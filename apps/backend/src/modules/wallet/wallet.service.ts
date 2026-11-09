import type { PaidService, WalletTransaction } from "@prisma/client"
import type { WalletTopUpModel } from "./model/wallet-top-up.model"
import type { ReadWalletTransactionsOutput, WalletTransactionModel } from "./model/wallet-transaction.model"
import { Injectable } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { WalletTransactionStatus, WalletTransactionType } from "@prisma/client"
import { vatOf } from "@zar-imen/shared"
import { SoftwareName } from "~/common/constants"
import { Config } from "~/config"
import { ErrorService } from "~/libs/error/error.service"
import { logger } from "~/libs/logger"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { ZarinpalService } from "~/libs/zarinpal/zarinpal.service"
import { SERVICE_COST_SETTINGS_KEY, VAT_SETTINGS_KEY } from "../setting/constants/settings-constant.keys"
import { ServiceCostSettingsModel } from "../setting/model/service-cost-settings.model"
import { VatSettingsModel } from "../setting/model/vat-settings.model"
import { SettingService } from "../setting/setting.service"
import { PENDING_TOP_UP_TTL_MINUTES, WALLET_TRANSACTIONS_PAGE_SIZE } from "./constants/wallet.constants"
import { WalletErrors } from "./constants/wallet.errors"

/** Who pays for a customer's request: the shop, on behalf of the customer (shown in its history). */
export type Bill = { shopId: string, customerSsn: string }

/** Where the owner lands after Zarinpal: their shop's /panel/wallet, with the outcome in the query string. */
type TopUpOutcome = { success: true, amount: string, refId: string } | { success: false, reason: string }

/**
 * Shop wallets: every change is a WalletTransaction row (the owner's history).
 * - charge: customers' Shahkar checks / SMS, priced on the admin's settings page (-)
 * - top-ups through Zarinpal (+)
 * - admin adjustments are recorded by ShopService (+/-)
 */
@Injectable()
export class WalletService {
	constructor(
		private prisma: PrismaService,
		private settings: SettingService,
		private zarinpal: ZarinpalService,
		private config: Config,
		private error: ErrorService,
	) { }

	/**
	 * Throws InsufficientBalance unless the wallet holds enough for all of `services`.
	 * For flows that use several services in a row, so the first is not paid for when
	 * the next could not be.
	 */
	async assertCanAfford(shopId: string, services: PaidService[]) {
		const costs = await this.readCosts()
		const total = services.reduce((sum, service) => sum + costs[service], 0)
		if (total === 0)
			return

		const affordable = await this.prisma.wallet.exists({ shopId, balance: { gte: total } })
		if (!affordable)
			throw this.error.throwErrorToClient(WalletErrors.InsufficientBalance)
	}

	/**
	 * Takes the price of `service` from the shop's wallet (recording it in the history),
	 * then runs it. If `run` throws (the provider failed or could not be reached), the
	 * price is refunded and the history row removed.
	 * The deduction only happens while the balance covers it, so concurrent requests
	 * cannot take the wallet below zero.
	 */
	async charge<T>(bill: Bill, service: PaidService, run: () => Promise<T>): Promise<T> {
		const cost = (await this.readCosts())[service]
		if (cost === 0)
			return run()

		const charged = await this.prisma.$transaction(async (tx) => {
			const { count } = await tx.wallet.updateMany({
				where: { shopId: bill.shopId, balance: { gte: cost } },
				data: { balance: { decrement: cost } },
			})
			if (count === 0)
				return null

			const wallet = await tx.wallet.findUniqueOrThrow({ where: { shopId: bill.shopId }, select: { id: true } })
			return tx.walletTransaction.create({
				data: {
					walletId: wallet.id,
					type: WalletTransactionType.SERVICE_CHARGE,
					amount: -cost,
					service,
					customerSsn: bill.customerSsn,
				},
			})
		})
		if (!charged)
			throw this.error.throwErrorToClient(WalletErrors.InsufficientBalance)

		try {
			return await run()
		}
		catch (e) {
			await this.prisma.$transaction([
				this.prisma.wallet.update({ where: { shopId: bill.shopId }, data: { balance: { increment: cost } } }),
				this.prisma.walletTransaction.delete({ where: { id: charged.id } }),
			])
			throw e
		}
	}

	/**
	 * Starts a Zarinpal payment of `amount` Tomans plus the admin's VAT; once verified by
	 * `GET /wallet/topUpCallback`, `amount` (without the VAT) is added to the shop's wallet.
	 */
	async startTopUp(shopId: string, amount: number): Promise<WalletTopUpModel> {
		const { vatPercent } = await this.settings.getSetting(VAT_SETTINGS_KEY, VatSettingsModel)
		const vatAmount = vatOf(amount, vatPercent)
		const shop = await this.prisma.shop.findUniqueOrThrow({
			where: { id: shopId },
			select: { ownerPhoneNumber: true, subdomain: true, wallet: { select: { id: true } } },
		})

		const topUp = await this.prisma.walletTransaction.create({
			data: {
				walletId: shop.wallet!.id,
				type: WalletTransactionType.TOP_UP,
				status: WalletTransactionStatus.PENDING,
				amount,
				vatAmount,
			},
		})

		let request: Awaited<ReturnType<ZarinpalService["requestPayment"]>>
		try {
			request = await this.zarinpal.requestPayment({
				amount: amount + vatAmount,
				description: `${SoftwareName} - شارژ کیف پول ${shop.subdomain}`,
				orderId: topUp.id,
				callbackUrl: new URL("/wallet/topUpCallback", this.config.backendUrl).toString(),
				mobile: shop.ownerPhoneNumber,
			})
		}
		catch (e) {
			await this.failTopUp(topUp.id, null, "Zarinpal could not be reached")
			throw this.error.throwErrorToClient(WalletErrors.GatewayUnavailable, e as Error)
		}

		if (!request.ok) {
			logger.error(`[wallet] top-up request refused for shop ${shopId}: ${request.message}`)
			await this.failTopUp(topUp.id, request.code, request.message)
			throw this.error.throwErrorToClient(WalletErrors.GatewayError, new Error(request.message))
		}

		await this.prisma.walletTransaction.update({ where: { id: topUp.id }, data: { authority: request.authority } })
		return { url: this.zarinpal.gatewayUrl(request.authority) }
	}

	/**
	 * Zarinpal sends the owner's browser back here with `Authority` / `Status`. Verifies the
	 * payment, credits the wallet and returns where to redirect the owner (their shop's
	 * /panel/wallet). Idempotent: a second callback for a verified payment credits nothing.
	 */
	async handleTopUpCallback(authority: string, status?: string): Promise<string> {
		const topUp = await this.prisma.walletTransaction.findUnique({
			where: { authority },
			include: { wallet: { select: { shop: { select: { subdomain: true } } } } },
		})
		if (!topUp || topUp.type !== WalletTransactionType.TOP_UP)
			throw this.error.throwErrorToClient(WalletErrors.TopUpNotFound)

		const back = (outcome: TopUpOutcome) => this.resultUrl(topUp.wallet.shop.subdomain, outcome)
		const amount = topUp.amount.toFixed(0)

		if (topUp.status === WalletTransactionStatus.SUCCESS)
			return back({ success: true, amount, refId: topUp.refId ?? "" })
		if (topUp.status === WalletTransactionStatus.FAILED)
			return back({ success: false, reason: "Failed" })
		// Too late: cancelStaleTopUps gave up on it. Unverified, so Zarinpal returns the money to the payer.
		if (topUp.status === WalletTransactionStatus.CANCELED)
			return back({ success: false, reason: "Expired" })

		if (status === "NOK") {
			await this.failTopUp(topUp.id, null, "Canceled by the payer")
			return back({ success: false, reason: "Canceled" })
		}

		let verification: Awaited<ReturnType<ZarinpalService["verifyPayment"]>>
		try {
			verification = await this.zarinpal.verifyPayment({ amount: topUp.amount.add(topUp.vatAmount).toNumber(), authority })
		}
		catch (e) {
			// Stays PENDING: Zarinpal reverses unverified payments, and nothing was credited.
			logger.error(`[wallet] top-up verify failed for ${authority}`, e)
			return back({ success: false, reason: "GatewayUnavailable" })
		}

		if (!verification.ok) {
			await this.failTopUp(topUp.id, verification.code, verification.message)
			return back({ success: false, reason: "Failed" })
		}

		await this.creditTopUp(topUp, verification)
		return back({ success: true, amount, refId: verification.refId })
	}

	/**
	 * Every 10 minutes: top-ups still PENDING more than PENDING_TOP_UP_TTL_MINUTES after they
	 * started (the owner never came back from Zarinpal) are canceled. Nothing was credited for
	 * them, and a late callback can no longer credit one (crediting needs PENDING).
	 */
	@Cron(CronExpression.EVERY_10_MINUTES)
	async cancelStaleTopUps() {
		const { count } = await this.prisma.walletTransaction.updateMany({
			where: {
				type: WalletTransactionType.TOP_UP,
				status: WalletTransactionStatus.PENDING,
				createdAt: { lt: new Date(Date.now() - PENDING_TOP_UP_TTL_MINUTES * 60 * 1000) },
			},
			data: { status: WalletTransactionStatus.CANCELED, description: `Still pending after ${PENDING_TOP_UP_TTL_MINUTES} minutes` },
		})
		if (count)
			logger.info(`[wallet] canceled ${count} stale pending top-up(s)`)
		return count
	}

	/** The shop's history, newest first; only completed rows (no pending / failed top-ups). */
	async readTransactions(shopId: string, page = 1): Promise<ReadWalletTransactionsOutput> {
		const { data, count } = await this.prisma.walletTransaction.findManyAndCount({
			where: { wallet: { shopId }, status: WalletTransactionStatus.SUCCESS },
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * WALLET_TRANSACTIONS_PAGE_SIZE,
			take: WALLET_TRANSACTIONS_PAGE_SIZE,
		})
		return { data: data.map(row => this.toModel(row)), count, pageSize: WALLET_TRANSACTIONS_PAGE_SIZE }
	}

	/** Marks the top-up paid and credits the wallet, once: a concurrent second callback finds it no longer PENDING. */
	private async creditTopUp(topUp: WalletTransaction, verification: { code: number, refId: string, cardPan: string | null }) {
		await this.prisma.$transaction(async (tx) => {
			const { count } = await tx.walletTransaction.updateMany({
				where: { id: topUp.id, status: WalletTransactionStatus.PENDING },
				data: {
					status: WalletTransactionStatus.SUCCESS,
					refId: verification.refId,
					cardPan: verification.cardPan,
					gatewayCode: verification.code,
				},
			})
			if (count === 1)
				await tx.wallet.update({ where: { id: topUp.walletId }, data: { balance: { increment: topUp.amount } } })
		})
	}

	private async failTopUp(id: string, gatewayCode: number | null, description: string) {
		await this.prisma.walletTransaction.update({
			where: { id },
			data: { status: WalletTransactionStatus.FAILED, gatewayCode, description },
		})
	}

	private resultUrl(subdomain: string, outcome: TopUpOutcome) {
		const url = new URL("/panel/wallet", this.config.shopSiteUrl.replace("{subdomain}", subdomain))
		url.searchParams.set("topUp", outcome.success ? "success" : "failed")
		if (outcome.success) {
			url.searchParams.set("amount", outcome.amount)
			url.searchParams.set("refId", outcome.refId)
		}
		else {
			url.searchParams.set("reason", outcome.reason)
		}
		return url.toString()
	}

	private async readCosts(): Promise<Record<PaidService, number>> {
		const { shahkarCost, cardMatchCost, smsCost } = await this.settings.getSetting(SERVICE_COST_SETTINGS_KEY, ServiceCostSettingsModel)
		return { SHAHKAR: shahkarCost, CARD_MATCH: cardMatchCost, SMS: smsCost }
	}

	private toModel(row: WalletTransaction): WalletTransactionModel {
		return {
			id: row.id,
			type: row.type,
			amount: row.amount.toFixed(0),
			service: row.service,
			customerSsn: row.customerSsn,
			refId: row.refId,
			createdAt: row.createdAt,
		}
	}
}
