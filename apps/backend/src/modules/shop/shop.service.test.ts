import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it } from "vitest"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { ShopService } from "./shop.service"
import "reflect-metadata"

type Shop = Record<string, unknown> & { id: string, subdomain: string }

/** In-memory stand-in for the Prisma calls updateShop makes. */
function createPrisma(shops: Shop[]) {
	const match = (row: Shop, where: Record<string, unknown>) =>
		Object.entries(where).every(([k, v]) => v !== null && typeof v === "object" && "not" in v ? row[k] !== v.not : row[k] === v)
	return {
		shop: {
			exists: async (where: Record<string, unknown>) => shops.some(s => match(s, where)),
			update: async ({ where, data }: { where: { id: string }, data: Record<string, unknown> }) => {
				const shop = Object.assign(shops.find(s => s.id === where.id)!, data)
				return { ...shop, wallet: { balance: new Prisma.Decimal(0) } }
			},
		},
	}
}

function errorCode(promise: Promise<unknown>) {
	return promise.then(() => "resolved", (e: unknown) => (e instanceof GlobalError ? e.errorContext.message : String(e)))
}

describe("shopService.updateShop", () => {
	let shops: Shop[]
	let service: ShopService

	const edit = {
		shopId: "shop-1",
		name: "طلای ستوده",
		brandName: "ستوده",
		ownerFullName: "علی ستوده",
	}

	beforeEach(() => {
		shops = [
			{ id: "shop-1", subdomain: "setoode", ownerPhoneNumber: "09120000001", ownerNationalCode: "0499370899", logoUrl: "https://x/logo.png", address: "تهران", landline: "02112345678" },
			{ id: "shop-2", subdomain: "rahimi", ownerPhoneNumber: "09120000002", ownerNationalCode: "0012345678" },
		]
		service = new ShopService(createPrisma(shops) as never, {} as never, new ErrorService())
	})

	it("saves the new details", async () => {
		const shop = await service.updateShop({ ...edit, name: "زرگری ستوده", address: "اصفهان" })
		expect(shop).toMatchObject({ name: "زرگری ستوده", address: "اصفهان" })
	})

	it("clears optional details left out, and never changes the subdomain or the owner's mobile or national code", async () => {
		const sneaky = { ...edit, subdomain: "other", ownerPhoneNumber: "09359999999", ownerNationalCode: "1111111111" }
		const shop = await service.updateShop(sneaky as typeof edit)
		expect(shop).toMatchObject({ logoUrl: null, address: null, landline: null, subdomain: "setoode", ownerPhoneNumber: "09120000001", ownerNationalCode: "0499370899" })
	})

	it("refuses an unknown shop", async () => {
		expect(await errorCode(service.updateShop({ ...edit, shopId: "nope" }))).toBe("NotFound")
	})
})
