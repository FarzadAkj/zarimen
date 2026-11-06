import { beforeEach, describe, expect, it, vi } from "vitest"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { ServiceCostSettingsModel } from "../setting/model/service-cost-settings.model"
import { WalletService } from "./wallet.service"
import "reflect-metadata"

/** One wallet, with the conditional decrement Postgres does for `updateMany`. */
function createPrisma(balance: number) {
	const wallet = { shopId: "shop-1", balance }
	return {
		wallet: Object.assign(wallet, {
			exists: async ({ balance: { gte } }: { balance: { gte: number } }) => wallet.balance >= gte,
			updateMany: async ({ where, data }: { where: { balance: { gte: number } }, data: { balance: { decrement: number } } }) => {
				if (wallet.balance < where.balance.gte)
					return { count: 0 }
				wallet.balance -= data.balance.decrement
				return { count: 1 }
			},
			update: async ({ data }: { data: { balance: { increment: number } } }) => {
				wallet.balance += data.balance.increment
			},
		}),
	}
}

function errorCode(promise: Promise<unknown>) {
	return promise.then(
		() => "resolved",
		(e: unknown) => (e instanceof GlobalError ? e.errorContext.message : String(e)),
	)
}

describe("walletService", () => {
	let prisma: ReturnType<typeof createPrisma>
	let costs: ServiceCostSettingsModel
	let wallet: WalletService

	function setup(balance: number, shahkarCost: number, smsCost: number) {
		prisma = createPrisma(balance)
		costs = Object.assign(new ServiceCostSettingsModel(), { shahkarCost, smsCost })
		const settings = { getSetting: async () => costs }
		wallet = new WalletService(prisma as never, settings as never, new ErrorService())
	}

	beforeEach(() => setup(5000, 1000, 200))

	it("takes the price and runs the service", async () => {
		const run = vi.fn(async () => "matched")
		expect(await wallet.charge("shop-1", "shahkar", run)).toBe("matched")
		expect(prisma.wallet.balance).toBe(4000)
	})

	it("charges each service its own price", async () => {
		await wallet.charge("shop-1", "sms", async () => {})
		expect(prisma.wallet.balance).toBe(4800)
	})

	it("refuses and runs nothing when the balance does not cover the price", async () => {
		setup(999, 1000, 200)
		const run = vi.fn(async () => {})
		expect(await errorCode(wallet.charge("shop-1", "shahkar", run))).toBe("InsufficientBalance")
		expect(run).not.toHaveBeenCalled()
		expect(prisma.wallet.balance).toBe(999)
	})

	it("allows spending the balance down to exactly zero", async () => {
		setup(1000, 1000, 200)
		await wallet.charge("shop-1", "shahkar", async () => {})
		expect(prisma.wallet.balance).toBe(0)
	})

	it("refunds when the service fails", async () => {
		expect(await errorCode(wallet.charge("shop-1", "shahkar", async () => {
			throw new Error("api.ir down")
		}))).toBe("Error: api.ir down")
		expect(prisma.wallet.balance).toBe(5000)
	})

	it("does not touch the wallet when the service is free", async () => {
		setup(0, 0, 0)
		const run = vi.fn(async () => "ok")
		expect(await wallet.charge("shop-1", "sms", run)).toBe("ok")
		expect(prisma.wallet.balance).toBe(0)
	})

	it("assertCanAfford checks the sum of the services", async () => {
		setup(1199, 1000, 200)
		expect(await errorCode(wallet.assertCanAfford("shop-1", ["shahkar", "sms"]))).toBe("InsufficientBalance")
		setup(1200, 1000, 200)
		expect(await errorCode(wallet.assertCanAfford("shop-1", ["shahkar", "sms"]))).toBe("resolved")
	})
})
