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
			findFirst: async () => null,
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

/** What SePal posts to the callback url: 1 paid, 0 not paid. */
function callback(paymentNumber: string, invoiceNumber: string, status = 1) {
	return { status, paymentNumber, invoiceNumber }
}

describe("subscriptionService purchase", () => {
	let prisma: ReturnType<typeof createPrisma>
	let sepal: { requestPayment: ReturnType<typeof vi.fn>, verifyPayment: ReturnType<typeof vi.fn>, gatewayUrl: (a: string) => string }
	let service: SubscriptionService

	function setup(subscriptionEndsAt: Date | null, vatPercent = 0) {
		prisma = createPrisma(subscriptionEndsAt)
		const settings = { getSetting: async () => ({ vatPercent }) }
		sepal = {
			requestPayment: vi.fn(async () => ({ ok: true, paymentNumber: "S0001" })),
			verifyPayment: vi.fn(async () => ({ ok: true, refId: "888", cardPan: null })),
			gatewayUrl: (paymentNumber: string) => `https://payment.sepal.ir/api/payment/${paymentNumber}/`,
		}
		const config = Object.assign(new Config(), { shopSiteUrl: "http://{subdomain}.localhost:3010", backendUrl: "http://127.0.0.1:8010" })
		service = new SubscriptionService(prisma as never, sepal as never, settings as never, config, new ErrorService())
	}

	beforeEach(() => setup(null))

	it("charges the plan's price through SePal, with the subscription callback", async () => {
		expect(await service.startPurchase("shop-1", "month")).toEqual({ url: "https://payment.sepal.ir/api/payment/S0001/" })
		expect(sepal.requestPayment).toHaveBeenCalledWith(expect.objectContaining({
			amount: 2_000_000,
			callbackUrl: "http://127.0.0.1:8010/subscription/purchaseCallback",
		}))
		expect(prisma.purchases[0]).toMatchObject({ status: "PENDING", planTitle: "یک‌ماهه", durationDays: 30 })
	})

	it("adds the VAT to the plan's price at the gateway and verifies the same total", async () => {
		setup(null, 10)
		await service.startPurchase("shop-1", "month")
		expect(sepal.requestPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 2_200_000 }))
		expect(prisma.purchases[0]).toMatchObject({ vatAmount: 200_000 })
		expect(prisma.purchases[0]!.price.toNumber()).toBe(2_000_000)

		expect(await service.handlePurchaseCallback(callback("S0001", "p-1"))).toContain("purchase=success")
		expect(sepal.verifyPayment).toHaveBeenCalledWith({ paymentNumber: "S0001", invoiceNumber: "p-1", amount: 2_200_000 })
	})

	it("refuses a disabled plan", async () => {
		expect(await errorCode(service.startPurchase("shop-1", "old"))).toBe("PlanNotFound")
		expect(sepal.requestPayment).not.toHaveBeenCalled()
	})

	it("adds the plan to the end of a running subscription once paid", async () => {
		const twoWeeks = new Date(Date.now() + 14 * DAY)
		setup(twoWeeks)
		await service.startPurchase("shop-1", "month")

		const url = new URL(await service.handlePurchaseCallback(callback("S0001", "p-1")))
		expect(prisma.shop.subscriptionEndsAt!.getTime()).toBe(twoWeeks.getTime() + 30 * DAY)
		expect(prisma.purchases[0]).toMatchObject({ status: "SUCCESS", refId: "888", startsAt: twoWeeks })
		expect(url.pathname).toBe("/panel/subscription")
		expect(url.searchParams.get("purchase")).toBe("success")
		expect(url.searchParams.get("endsAt")).toBe(prisma.shop.subscriptionEndsAt!.toISOString())
	})

	it("extends only once when the callback comes twice", async () => {
		await service.startPurchase("shop-1", "month")
		await service.handlePurchaseCallback(callback("S0001", "p-1"))
		const end = prisma.shop.subscriptionEndsAt
		expect(await service.handlePurchaseCallback(callback("S0001", "p-1"))).toContain("purchase=success")
		expect(prisma.shop.subscriptionEndsAt).toBe(end)
		expect(sepal.verifyPayment).toHaveBeenCalledTimes(1)
	})

	it("extends nothing when the owner cancels at the gateway", async () => {
		await service.startPurchase("shop-1", "month")
		expect(await service.handlePurchaseCallback(callback("S0001", "p-1", 0))).toContain("purchase=failed&reason=Canceled")
		expect(prisma.shop.subscriptionEndsAt).toBeNull()
		expect(prisma.purchases[0]!.status).toBe("FAILED")
	})

	it("extends nothing when SePal does not verify the payment", async () => {
		sepal.verifyPayment.mockResolvedValueOnce({ ok: false, message: "unpaid" })
		await service.startPurchase("shop-1", "month")
		expect(await service.handlePurchaseCallback(callback("S0001", "p-1"))).toContain("purchase=failed")
		expect(prisma.shop.subscriptionEndsAt).toBeNull()
	})

	describe("admin changes the end date", () => {
		it("moves it later and records a free «تمدید توسط مدیر» row from the old end", async () => {
			const twoWeeks = new Date(Date.now() + 14 * DAY)
			const sixWeeks = new Date(Date.now() + 42 * DAY)
			setup(twoWeeks)
			const result = await service.setSubscriptionEnd("shop-1", sixWeeks)

			expect(prisma.shop.subscriptionEndsAt).toBe(sixWeeks)
			expect(result).toMatchObject({ isActive: true, endsAt: sixWeeks })
			expect(prisma.purchases[0]).toMatchObject({ planTitle: "تمدید توسط مدیر", status: "SUCCESS", startsAt: twoWeeks, endsAt: sixWeeks, durationDays: 28 })
			expect(Number(prisma.purchases[0]!.price)).toBe(0)
		})

		it("refuses a date before the current end, changing nothing", async () => {
			const twoWeeks = new Date(Date.now() + 14 * DAY)
			setup(twoWeeks)
			expect(await errorCode(service.setSubscriptionEnd("shop-1", new Date(Date.now() + 7 * DAY)))).toBe("EndDateTooEarly")
			expect(prisma.shop.subscriptionEndsAt).toBe(twoWeeks)
			expect(prisma.purchases).toHaveLength(0)
		})
	})
})
