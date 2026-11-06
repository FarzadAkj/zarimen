import type { SubscriptionPlan, SubscriptionPurchase } from "@prisma/client"
import type { CreateSubscriptionPlanInput } from "./dto/subscription-plan.input"
import type { MySubscriptionModel, ReadSubscriptionPurchasesOutput, SubscriptionPlanModel, SubscriptionPurchaseModel, SubscriptionPurchaseStartedModel } from "./model/subscription.model"
import { Injectable } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { SubscriptionPurchaseStatus } from "@prisma/client"
import { SoftwareName } from "~/common/constants"
import { Config } from "~/config"
import { ErrorService } from "~/libs/error/error.service"
import { logger } from "~/libs/logger"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { ZarinpalService } from "~/libs/zarinpal/zarinpal.service"
import { extendSubscription, hasActiveSubscription, PENDING_PURCHASE_TTL_MINUTES, SUBSCRIPTION_PURCHASES_PAGE_SIZE } from "./constants/subscription"
import { SubscriptionErrors } from "./constants/subscription.errors"

/** Where the owner lands after Zarinpal: their shop's /panel/subscription, with the outcome in the query string. */
type PurchaseOutcome = { success: true, planTitle: string, endsAt: Date, refId: string } | { success: false, reason: string }

/**
 * Subscription plans (defined by the admin) and shops buying them through Zarinpal.
 * A shop's customers can use its pages until `Shop.subscriptionEndsAt`; each purchase
 * extends it from the current end (or from now, if it already ended).
 */
@Injectable()
export class SubscriptionService {
	constructor(
		private prisma: PrismaService,
		private zarinpal: ZarinpalService,
		private config: Config,
		private error: ErrorService,
	) { }

	// ---- plans (admin)

	async readPlans(onlyActive: boolean): Promise<SubscriptionPlanModel[]> {
		const plans = await this.prisma.subscriptionPlan.findMany({
			where: onlyActive ? { isActive: true } : {},
			orderBy: [{ durationDays: "asc" }, { price: "asc" }],
		})
		return plans.map(plan => this.toPlanModel(plan))
	}

	async createPlan(input: CreateSubscriptionPlanInput): Promise<SubscriptionPlanModel> {
		return this.toPlanModel(await this.prisma.subscriptionPlan.create({ data: input }))
	}

	async setPlanActive(id: string, isActive: boolean): Promise<SubscriptionPlanModel> {
		if (!await this.prisma.subscriptionPlan.exists({ id }))
			throw this.error.throwErrorToClient(SubscriptionErrors.PlanNotFound)
		return this.toPlanModel(await this.prisma.subscriptionPlan.update({ where: { id }, data: { isActive } }))
	}

	// ---- a shop's subscription

	async readMySubscription(shopId: string): Promise<MySubscriptionModel> {
		const now = new Date()
		const [shop, current] = await Promise.all([
			this.prisma.shop.findUniqueOrThrow({ where: { id: shopId }, select: { subscriptionEndsAt: true } }),
			this.prisma.subscriptionPurchase.findFirst({
				where: { shopId, status: SubscriptionPurchaseStatus.SUCCESS, startsAt: { lte: now }, endsAt: { gt: now } },
				select: { planTitle: true },
			}),
		])
		return {
			isActive: hasActiveSubscription(shop.subscriptionEndsAt, now),
			endsAt: shop.subscriptionEndsAt,
			currentPlanTitle: current?.planTitle ?? null,
		}
	}

	/** Paid purchases, newest first. */
	async readPurchases(shopId: string, page = 1): Promise<ReadSubscriptionPurchasesOutput> {
		const { data, count } = await this.prisma.subscriptionPurchase.findManyAndCount({
			where: { shopId, status: SubscriptionPurchaseStatus.SUCCESS },
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * SUBSCRIPTION_PURCHASES_PAGE_SIZE,
			take: SUBSCRIPTION_PURCHASES_PAGE_SIZE,
		})
		return { data: data.map(row => this.toPurchaseModel(row)), count, pageSize: SUBSCRIPTION_PURCHASES_PAGE_SIZE }
	}

	/** Starts a Zarinpal payment for an active plan; verified by `GET /subscription/purchaseCallback`. */
	async startPurchase(shopId: string, planId: string): Promise<SubscriptionPurchaseStartedModel> {
		const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } })
		if (!plan?.isActive)
			throw this.error.throwErrorToClient(SubscriptionErrors.PlanNotFound)

		const shop = await this.prisma.shop.findUniqueOrThrow({ where: { id: shopId }, select: { ownerPhoneNumber: true, subdomain: true } })
		const purchase = await this.prisma.subscriptionPurchase.create({
			data: { shopId, planId, planTitle: plan.title, price: plan.price, durationDays: plan.durationDays },
		})

		let request: Awaited<ReturnType<ZarinpalService["requestPayment"]>>
		try {
			request = await this.zarinpal.requestPayment({
				amount: plan.price.toNumber(),
				description: `${SoftwareName} - ${plan.title} - ${shop.subdomain}`,
				orderId: purchase.id,
				callbackUrl: new URL("/subscription/purchaseCallback", this.config.backendUrl).toString(),
				mobile: shop.ownerPhoneNumber,
			})
		}
		catch (e) {
			await this.failPurchase(purchase.id, null, "Zarinpal could not be reached")
			throw this.error.throwErrorToClient(SubscriptionErrors.GatewayUnavailable, e as Error)
		}

		if (!request.ok) {
			logger.error(`[subscription] purchase request refused for shop ${shopId}: ${request.message}`)
			await this.failPurchase(purchase.id, request.code, request.message)
			throw this.error.throwErrorToClient(SubscriptionErrors.GatewayError, new Error(request.message))
		}

		await this.prisma.subscriptionPurchase.update({ where: { id: purchase.id }, data: { authority: request.authority } })
		return { url: this.zarinpal.gatewayUrl(request.authority) }
	}

	/**
	 * Zarinpal sends the owner back here. Verifies the payment, extends the shop's subscription
	 * and returns where to redirect the owner. Idempotent: a repeated callback extends nothing.
	 */
	async handlePurchaseCallback(authority: string, status?: string): Promise<string> {
		const purchase = await this.prisma.subscriptionPurchase.findUnique({
			where: { authority },
			include: { shop: { select: { subdomain: true } } },
		})
		if (!purchase)
			throw this.error.throwErrorToClient(SubscriptionErrors.PurchaseNotFound)

		const back = (outcome: PurchaseOutcome) => this.resultUrl(purchase.shop.subdomain, outcome)

		if (purchase.status === SubscriptionPurchaseStatus.SUCCESS)
			return back({ success: true, planTitle: purchase.planTitle, endsAt: purchase.endsAt!, refId: purchase.refId ?? "" })
		if (purchase.status === SubscriptionPurchaseStatus.FAILED)
			return back({ success: false, reason: "Failed" })
		// Too late: cancelStalePurchases gave up on it. Unverified, so Zarinpal returns the money to the payer.
		if (purchase.status === SubscriptionPurchaseStatus.CANCELED)
			return back({ success: false, reason: "Expired" })

		if (status === "NOK") {
			await this.failPurchase(purchase.id, null, "Canceled by the payer")
			return back({ success: false, reason: "Canceled" })
		}

		let verification: Awaited<ReturnType<ZarinpalService["verifyPayment"]>>
		try {
			verification = await this.zarinpal.verifyPayment({ amount: purchase.price.toNumber(), authority })
		}
		catch (e) {
			// Stays PENDING: Zarinpal reverses unverified payments, and nothing was extended.
			logger.error(`[subscription] verify failed for ${authority}`, e)
			return back({ success: false, reason: "GatewayUnavailable" })
		}

		if (!verification.ok) {
			await this.failPurchase(purchase.id, verification.code, verification.message)
			return back({ success: false, reason: "Failed" })
		}

		const paid = await this.completePurchase(purchase, verification)
		return back({ success: true, planTitle: purchase.planTitle, endsAt: paid.endsAt, refId: verification.refId })
	}

	/** Every 10 minutes: purchases still PENDING 20 minutes after they started are canceled. */
	@Cron(CronExpression.EVERY_10_MINUTES)
	async cancelStalePurchases() {
		const { count } = await this.prisma.subscriptionPurchase.updateMany({
			where: {
				status: SubscriptionPurchaseStatus.PENDING,
				createdAt: { lt: new Date(Date.now() - PENDING_PURCHASE_TTL_MINUTES * 60 * 1000) },
			},
			data: { status: SubscriptionPurchaseStatus.CANCELED, description: `Still pending after ${PENDING_PURCHASE_TTL_MINUTES} minutes` },
		})
		if (count)
			logger.info(`[subscription] canceled ${count} stale pending purchase(s)`)
		return count
	}

	/**
	 * Marks the purchase paid and extends the shop's subscription, once. The shop row is locked
	 * while the new end date is computed, so two purchases verified at the same time both count.
	 */
	private async completePurchase(purchase: SubscriptionPurchase, verification: { code: number, refId: string, cardPan: string | null }) {
		return this.prisma.$transaction(async (tx) => {
			const { count } = await tx.subscriptionPurchase.updateMany({
				where: { id: purchase.id, status: SubscriptionPurchaseStatus.PENDING },
				data: {
					status: SubscriptionPurchaseStatus.SUCCESS,
					refId: verification.refId,
					cardPan: verification.cardPan,
					gatewayCode: verification.code,
				},
			})
			// A concurrent callback already completed it.
			if (count === 0)
				return tx.subscriptionPurchase.findUniqueOrThrow({ where: { id: purchase.id } }) as Promise<{ endsAt: Date }>

			const [shop] = await tx.$queryRaw<{ subscriptionEndsAt: Date | null }[]>`
				SELECT "subscriptionEndsAt" FROM "Shop" WHERE "id" = ${purchase.shopId}::uuid FOR UPDATE`
			const period = extendSubscription(shop!.subscriptionEndsAt, new Date(), purchase.durationDays)

			await tx.shop.update({ where: { id: purchase.shopId }, data: { subscriptionEndsAt: period.endsAt } })
			await tx.subscriptionPurchase.update({ where: { id: purchase.id }, data: period })
			return period
		})
	}

	private async failPurchase(id: string, gatewayCode: number | null, description: string) {
		await this.prisma.subscriptionPurchase.update({
			where: { id },
			data: { status: SubscriptionPurchaseStatus.FAILED, gatewayCode, description },
		})
	}

	private resultUrl(subdomain: string, outcome: PurchaseOutcome) {
		const url = new URL("/panel/subscription", this.config.shopSiteUrl.replace("{subdomain}", subdomain))
		url.searchParams.set("purchase", outcome.success ? "success" : "failed")
		if (outcome.success) {
			url.searchParams.set("plan", outcome.planTitle)
			url.searchParams.set("endsAt", outcome.endsAt.toISOString())
			url.searchParams.set("refId", outcome.refId)
		}
		else {
			url.searchParams.set("reason", outcome.reason)
		}
		return url.toString()
	}

	private toPlanModel(plan: SubscriptionPlan): SubscriptionPlanModel {
		return { id: plan.id, title: plan.title, price: plan.price.toFixed(0), durationDays: plan.durationDays, isActive: plan.isActive }
	}

	private toPurchaseModel(row: SubscriptionPurchase): SubscriptionPurchaseModel {
		return {
			id: row.id,
			planTitle: row.planTitle,
			price: row.price.toFixed(0),
			durationDays: row.durationDays,
			startsAt: row.startsAt!,
			endsAt: row.endsAt!,
			refId: row.refId,
			createdAt: row.createdAt,
		}
	}
}
