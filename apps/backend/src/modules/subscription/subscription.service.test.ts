import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Config } from "~/config"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { SubscriptionService } from "./subscription.service"
import "reflect-metadata"

const DAY = 24 * 60 * 60 * 1000

type Purchase = {
	id: string
	shopId: string
	planTitle: string
	price: Prisma.Decimal
	durationDays: number
	status: string
	authority?: string
	refId?: string
	startsAt?: Date
	endsAt?: Date
	createdAt: Date
}

/** One shop, two plans (one disabled) and the purchases, as the service reads / writes them. */
function createPrisma(subscriptionEndsAt: Date | null) {
	const shop = { id: "shop-1", subdomain: "setoode", ownerPhoneNumber: "09121111111", subscriptionEndsAt }
	const plans = [
		{ id: "month", title: "یک‌ماهه", price: new Prisma.Decimal(2_000_000), durationDays: 30, isActive: true },
		{ id: "old", title: "قدیمی", price: new Prisma.Decimal(1_000_000), durationDays: 30, isActive: false },
	]
	const purchases: Purchase[] = []

	const prisma = {
		shop,
		purchases,
		$transaction: async (work: (tx: unknown) => unknown) => work(prisma),
		$queryRaw: async () => [{ subscriptionEndsAt: shop.subscriptionEndsAt }],
		subscriptionPlan: {
			findUnique: async ({ where }: { where: { id: string } }) => plans.find(p => p.id === where.id) ?? null,
		},
		subscriptionPurchase: {
			create: async ({ data }: { data: Omit<Purchase, "id" | "status" | "createdAt"> }) => {
				const row: Purchase = { id: `p-${purchases.length + 1}`, status: "PENDING", createdAt: new Date(), ...data }
				purchases.push(row)
				return row
			},
			update: async ({ where, data }: { where: { id: string }, data: Partial<Purchase> }) => Object.assign(purchases.find(p => p.id === where.id)!, data),
			updateMany: async ({ where, data }: { where: { id: string, status: string }, data: Partial<Purchase> }) => {
				const row = purchases.find(p => p.id === where.id && p.status === where.status)
				if (row)
					Object.assign(row, data)
				return { count: row ? 1 : 0 }
			},
			findUnique: async ({ where }: { where: { authority: string } }) => {
				const row = purchases.find(p => p.authority === where.authority)
				return row && { ...row, shop: { subdomain: shop.subdomain } }
			},
			findUniqueOrThrow: async ({ where }: { where: { id: string } }) => purchases.find(p => p.id === where.id)!,
		},
	}
	Object.assign(prisma.shop, {
		findUniqueOrThrow: async () => shop,
		update: async ({ data }: { data: { subscriptionEndsAt: Date } }) => {
			shop.subscriptionEndsAt = data.subscriptionEndsAt
		},
	})
	return prisma
}

function errorCode(promise: Promise<unknown>) {
	return promise.then(
		() => "resolved",
		(e: unknown) => (e instanceof GlobalError ? e.errorContext.message : String(e)),
	)
}

describe("subscriptionService purchase", () => {
	let prisma: ReturnType<typeof createPrisma>
	let zarinpal: { requestPayment: ReturnType<typeof vi.fn>, verifyPayment: ReturnType<typeof vi.fn>, gatewayUrl: (a: string) => string }
	let service: SubscriptionService

	function setup(subscriptionEndsAt: Date | null) {
		prisma = createPrisma(subscriptionEndsAt)
		zarinpal = {
			requestPayment: vi.fn(async () => ({ ok: true, authority: "S0001" })),
			verifyPayment: vi.fn(async () => ({ ok: true, code: 100, refId: "888", cardPan: null })),
			gatewayUrl: (authority: string) => `https://sandbox.zarinpal.com/pg/StartPay/${authority}`,
		}
		const config = Object.assign(new Config(), { shopSiteUrl: "http://{subdomain}.localhost:3010", backendUrl: "http://127.0.0.1:8010" })
		service = new SubscriptionService(prisma as never, zarinpal as never, config, new ErrorService())
	}

	beforeEach(() => setup(null))

	it("charges the plan's price through Zarinpal, with the subscription callback", async () => {
		expect(await service.startPurchase("shop-1", "month")).toEqual({ url: "https://sandbox.zarinpal.com/pg/StartPay/S0001" })
		expect(zarinpal.requestPayment).toHaveBeenCalledWith(expect.objectContaining({
			amount: 2_000_000,
			callbackUrl: "http://127.0.0.1:8010/subscription/purchaseCallback",
		}))
		expect(prisma.purchases[0]).toMatchObject({ status: "PENDING", planTitle: "یک‌ماهه", durationDays: 30 })
	})

	it("refuses a disabled plan", async () => {
		expect(await errorCode(service.startPurchase("shop-1", "old"))).toBe("PlanNotFound")
		expect(zarinpal.requestPayment).not.toHaveBeenCalled()
	})

	it("adds the plan to the end of a running subscription once paid", async () => {
		const twoWeeks = new Date(Date.now() + 14 * DAY)
		setup(twoWeeks)
		await service.startPurchase("shop-1", "month")

		const url = new URL(await service.handlePurchaseCallback("S0001", "OK"))
		expect(prisma.shop.subscriptionEndsAt!.getTime()).toBe(twoWeeks.getTime() + 30 * DAY)
		expect(prisma.purchases[0]).toMatchObject({ status: "SUCCESS", refId: "888", startsAt: twoWeeks })
		expect(url.pathname).toBe("/panel/subscription")
		expect(url.searchParams.get("purchase")).toBe("success")
		expect(url.searchParams.get("endsAt")).toBe(prisma.shop.subscriptionEndsAt!.toISOString())
	})

	it("extends only once when the callback comes twice", async () => {
		await service.startPurchase("shop-1", "month")
		await service.handlePurchaseCallback("S0001", "OK")
		const end = prisma.shop.subscriptionEndsAt
		expect(await service.handlePurchaseCallback("S0001", "OK")).toContain("purchase=success")
		expect(prisma.shop.subscriptionEndsAt).toBe(end)
		expect(zarinpal.verifyPayment).toHaveBeenCalledTimes(1)
	})

	it("extends nothing when the owner cancels at the gateway", async () => {
		await service.startPurchase("shop-1", "month")
		expect(await service.handlePurchaseCallback("S0001", "NOK")).toContain("purchase=failed&reason=Canceled")
		expect(prisma.shop.subscriptionEndsAt).toBeNull()
		expect(prisma.purchases[0]!.status).toBe("FAILED")
	})

	it("extends nothing when Zarinpal does not verify the payment", async () => {
		zarinpal.verifyPayment.mockResolvedValueOnce({ ok: false, code: -51, message: "unpaid" })
		await service.startPurchase("shop-1", "month")
		expect(await service.handlePurchaseCallback("S0001", "OK")).toContain("purchase=failed")
		expect(prisma.shop.subscriptionEndsAt).toBeNull()
	})
})
