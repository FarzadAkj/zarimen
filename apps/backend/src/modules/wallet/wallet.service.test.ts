import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Config } from "~/config"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { ServiceCostSettingsModel } from "../setting/model/service-cost-settings.model"
import { WalletService } from "./wallet.service"
import "reflect-metadata"

type Row = {
	id: string
	walletId: string
	type: string
	status: string
	amount: Prisma.Decimal
	service?: string
	customerSsn?: string
	authority?: string
	refId?: string
	createdAt: Date
}

const BILL = { shopId: "shop-1", customerSsn: "0499370899" }

/** One shop wallet and its history, with the conditional updates Postgres does. */
function createPrisma(balance: number) {
	const wallet = { id: "wallet-1", shopId: "shop-1", balance }
	const rows: Row[] = []

	const prisma = {
		wallet,
		rows,
		shop: {
			findUniqueOrThrow: async () => ({ ownerPhoneNumber: "09121111111", subdomain: "setoode", wallet: { id: wallet.id } }),
		},
		$transaction: async (work: unknown) => Array.isArray(work) ? Promise.all(work) : (work as (tx: unknown) => unknown)(prisma),
		walletTransaction: {
			create: async ({ data }: { data: Omit<Row, "id" | "createdAt" | "status" | "amount"> & { amount: number, status?: string } }) => {
				const row: Row = { id: `tx-${rows.length + 1}`, createdAt: new Date(), status: "SUCCESS", ...data, amount: new Prisma.Decimal(data.amount) }
				rows.push(row)
				return row
			},
			update: async ({ where, data }: { where: { id: string }, data: Partial<Row> }) => Object.assign(rows.find(r => r.id === where.id)!, data),
			updateMany: async ({ where, data }: { where: { id?: string, type?: string, status: string, createdAt?: { lt: Date } }, data: Partial<Row> }) => {
				const matched = rows.filter(r => (!where.id || r.id === where.id)
					&& (!where.type || r.type === where.type)
					&& r.status === where.status
					&& (!where.createdAt || r.createdAt < where.createdAt.lt))
				matched.forEach(r => Object.assign(r, data))
				return { count: matched.length }
			},
			delete: async ({ where }: { where: { id: string } }) => rows.splice(rows.findIndex(r => r.id === where.id), 1)[0],
			findUnique: async ({ where }: { where: { authority: string } }) => {
				const row = rows.find(r => r.authority === where.authority)
				return row && { ...row, wallet: { shop: { subdomain: "setoode" } } }
			},
		},
	}
	Object.assign(prisma.wallet, {
		exists: async ({ balance: { gte } }: { balance: { gte: number } }) => wallet.balance >= gte,
		findUniqueOrThrow: async () => ({ id: wallet.id }),
		updateMany: async ({ where, data }: { where: { balance: { gte: number } }, data: { balance: { decrement: number } } }) => {
			if (wallet.balance < where.balance.gte)
				return { count: 0 }
			wallet.balance -= data.balance.decrement
			return { count: 1 }
		},
		update: async ({ data }: { data: { balance: { increment: number | Prisma.Decimal } } }) => {
			wallet.balance += Number(data.balance.increment)
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

describe("walletService", () => {
	let prisma: ReturnType<typeof createPrisma>
	let zarinpal: { requestPayment: ReturnType<typeof vi.fn>, verifyPayment: ReturnType<typeof vi.fn>, gatewayUrl: (a: string) => string }
	let wallet: WalletService

	function setup(balance: number, shahkarCost: number, smsCost: number, cardMatchCost = 700) {
		prisma = createPrisma(balance)
		const costs = Object.assign(new ServiceCostSettingsModel(), { shahkarCost, smsCost, cardMatchCost })
		const settings = { getSetting: async () => costs }
		zarinpal = {
			requestPayment: vi.fn(async () => ({ ok: true, authority: "A0001" })),
			verifyPayment: vi.fn(async () => ({ ok: true, code: 100, refId: "777", cardPan: "6037**1234" })),
			gatewayUrl: (authority: string) => `https://sandbox.zarinpal.com/pg/StartPay/${authority}`,
		}
		const config = Object.assign(new Config(), { shopSiteUrl: "http://{subdomain}.localhost:3010", backendUrl: "http://127.0.0.1:8010" })
		wallet = new WalletService(prisma as never, settings as never, zarinpal as never, config, new ErrorService())
	}

	beforeEach(() => setup(5000, 1000, 200))

	describe("charge", () => {
		it("takes the price, records it for the customer, and runs the service", async () => {
			expect(await wallet.charge(BILL, "SHAHKAR", async () => "matched")).toBe("matched")
			expect(prisma.wallet.balance).toBe(4000)
			expect(prisma.rows).toEqual([expect.objectContaining({ type: "SERVICE_CHARGE", service: "SHAHKAR", customerSsn: BILL.customerSsn })])
			expect(prisma.rows[0]!.amount.toNumber()).toBe(-1000)
		})

		it("charges each service its own price", async () => {
			await wallet.charge(BILL, "SMS", async () => {})
			expect(prisma.wallet.balance).toBe(4800)
			await wallet.charge(BILL, "CARD_MATCH", async () => {})
			expect(prisma.wallet.balance).toBe(4100)
			expect(prisma.rows.map(r => r.service)).toEqual(["SMS", "CARD_MATCH"])
		})

		it("refuses, runs nothing and records nothing when the balance does not cover the price", async () => {
			setup(999, 1000, 200)
			const run = vi.fn(async () => {})
			expect(await errorCode(wallet.charge(BILL, "SHAHKAR", run))).toBe("InsufficientBalance")
			expect(run).not.toHaveBeenCalled()
			expect(prisma.wallet.balance).toBe(999)
			expect(prisma.rows).toHaveLength(0)
		})

		it("allows spending the balance down to exactly zero", async () => {
			setup(1000, 1000, 200)
			await wallet.charge(BILL, "SHAHKAR", async () => {})
			expect(prisma.wallet.balance).toBe(0)
		})

		it("refunds and removes the history row when the service fails", async () => {
			expect(await errorCode(wallet.charge(BILL, "SHAHKAR", async () => {
				throw new Error("api.ir down")
			}))).toBe("Error: api.ir down")
			expect(prisma.wallet.balance).toBe(5000)
			expect(prisma.rows).toHaveLength(0)
		})

		it("does not touch the wallet or the history when the service is free", async () => {
			setup(0, 0, 0, 0)
			expect(await wallet.charge(BILL, "SMS", async () => "ok")).toBe("ok")
			expect(prisma.wallet.balance).toBe(0)
			expect(prisma.rows).toHaveLength(0)
		})

		it("assertCanAfford checks the sum of the services", async () => {
			setup(1199, 1000, 200)
			expect(await errorCode(wallet.assertCanAfford("shop-1", ["SHAHKAR", "SMS"]))).toBe("InsufficientBalance")
			setup(1200, 1000, 200)
			expect(await errorCode(wallet.assertCanAfford("shop-1", ["SHAHKAR", "SMS"]))).toBe("resolved")
		})
	})

	describe("top-up", () => {
		it("credits the wallet once Zarinpal verifies, and sends the owner back to their shop", async () => {
			expect(await wallet.startTopUp("shop-1", 50_000)).toEqual({ url: "https://sandbox.zarinpal.com/pg/StartPay/A0001" })
			expect(prisma.rows[0]).toMatchObject({ type: "TOP_UP", status: "PENDING", authority: "A0001" })
			expect(zarinpal.requestPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 50_000, callbackUrl: "http://127.0.0.1:8010/wallet/topUpCallback" }))
			expect(prisma.wallet.balance).toBe(5000)

			const url = await wallet.handleTopUpCallback("A0001", "OK")
			expect(url).toBe("http://setoode.localhost:3010/panel/wallet?topUp=success&amount=50000&refId=777")
			expect(zarinpal.verifyPayment).toHaveBeenCalledWith({ amount: 50_000, authority: "A0001" })
			expect(prisma.wallet.balance).toBe(55_000)
			expect(prisma.rows[0]).toMatchObject({ status: "SUCCESS", refId: "777" })
		})

		it("credits only once when the callback comes twice", async () => {
			await wallet.startTopUp("shop-1", 50_000)
			await wallet.handleTopUpCallback("A0001", "OK")
			expect(await wallet.handleTopUpCallback("A0001", "OK")).toContain("topUp=success")
			expect(prisma.wallet.balance).toBe(55_000)
			expect(zarinpal.verifyPayment).toHaveBeenCalledTimes(1)
		})

		it("credits nothing when the owner cancels at the gateway", async () => {
			await wallet.startTopUp("shop-1", 50_000)
			expect(await wallet.handleTopUpCallback("A0001", "NOK")).toBe("http://setoode.localhost:3010/panel/wallet?topUp=failed&reason=Canceled")
			expect(zarinpal.verifyPayment).not.toHaveBeenCalled()
			expect(prisma.wallet.balance).toBe(5000)
			expect(prisma.rows[0]!.status).toBe("FAILED")
		})

		it("credits nothing when Zarinpal does not verify the payment", async () => {
			zarinpal.verifyPayment.mockResolvedValueOnce({ ok: false, code: -51, message: "Zarinpal -51: unpaid" })
			await wallet.startTopUp("shop-1", 50_000)
			expect(await wallet.handleTopUpCallback("A0001", "OK")).toContain("topUp=failed")
			expect(prisma.wallet.balance).toBe(5000)
		})

		it("leaves the top-up pending (nothing credited) when verification cannot reach Zarinpal", async () => {
			zarinpal.verifyPayment.mockRejectedValueOnce(new Error("timeout"))
			await wallet.startTopUp("shop-1", 50_000)
			expect(await wallet.handleTopUpCallback("A0001", "OK")).toContain("reason=GatewayUnavailable")
			expect(prisma.rows[0]!.status).toBe("PENDING")
			expect(prisma.wallet.balance).toBe(5000)
		})

		it("marks the top-up failed when Zarinpal refuses the payment request", async () => {
			zarinpal.requestPayment.mockResolvedValueOnce({ ok: false, code: -9, message: "Zarinpal -9: validation" })
			expect(await errorCode(wallet.startTopUp("shop-1", 50_000))).toBe("GatewayError")
			expect(prisma.rows[0]!.status).toBe("FAILED")
		})

		it("refuses a callback for an unknown authority", async () => {
			expect(await errorCode(wallet.handleTopUpCallback("nope", "OK"))).toBe("TopUpNotFound")
		})
	})

	describe("cancelStaleTopUps", () => {
		const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000)

		it("cancels only top-ups still pending after 20 minutes", async () => {
			await wallet.startTopUp("shop-1", 10_000) // tx-1: pending, 21 min old
			zarinpal.requestPayment.mockResolvedValueOnce({ ok: true, authority: "A0002" })
			await wallet.startTopUp("shop-1", 20_000) // tx-2: pending, 5 min old
			zarinpal.requestPayment.mockResolvedValueOnce({ ok: true, authority: "A0003" })
			await wallet.startTopUp("shop-1", 30_000) // tx-3: paid, 30 min old
			await wallet.handleTopUpCallback("A0003", "OK")
			prisma.rows[0]!.createdAt = minutesAgo(21)
			prisma.rows[1]!.createdAt = minutesAgo(5)
			prisma.rows[2]!.createdAt = minutesAgo(30)

			expect(await wallet.cancelStaleTopUps()).toBe(1)
			expect(prisma.rows.map(r => r.status)).toEqual(["CANCELED", "PENDING", "SUCCESS"])
		})

		it("a late callback for a canceled top-up credits nothing", async () => {
			await wallet.startTopUp("shop-1", 50_000)
			prisma.rows[0]!.createdAt = minutesAgo(25)
			await wallet.cancelStaleTopUps()

			expect(await wallet.handleTopUpCallback("A0001", "OK")).toBe("http://setoode.localhost:3010/panel/wallet?topUp=failed&reason=Expired")
			expect(zarinpal.verifyPayment).not.toHaveBeenCalled()
			expect(prisma.wallet.balance).toBe(5000)
		})
	})
})
