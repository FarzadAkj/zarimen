import { JwtService } from "@nestjs/jwt"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { toCardMatchDate } from "./constants/card"
import { CustomerService } from "./customer.service"
import "reflect-metadata"

const SSN = "0499370899"
const PHONE = "09121111111"
const BIRTH = "1370/01/05"
const CARD = "6037997599999993"

type Customer = { id: string, ssn: string, phoneNumber: string, birthDate: string, updatedAt: Date }
type Card = { id: string, customerId: string, cardNumber: string, createdAt: Date }
type Link = { customerId: string, shopId: string, lastSeenAt: Date }

/** In-memory stand-in for the Prisma calls CustomerService makes. */
function createPrisma() {
	const shops = [
		{ id: "shop-1", subdomain: "setoode", isActive: true },
		{ id: "shop-2", subdomain: "rahimi", isActive: true },
		{ id: "shop-3", subdomain: "closed", isActive: false },
	]
	const customers: Customer[] = []
	const cards: Card[] = []
	const links: Link[] = []
	const match = (row: Record<string, unknown>, where: Record<string, unknown>) =>
		Object.entries(where).every(([k, v]) => row[k] === v)

	return {
		customers,
		cards,
		links,
		shop: {
			findUnique: async ({ where }: { where: Record<string, unknown> }) => shops.find(s => match(s, where)) ?? null,
		},
		customer: {
			findUnique: async ({ where }: { where: Record<string, unknown> }) => customers.find(c => match(c, where)) ?? null,
			findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
				const customer = customers.find(c => c.id === where.id)!
				return { ...customer, cards: cards.filter(card => card.customerId === customer.id) }
			},
			findFirst: async ({ where }: { where: { phoneNumber: string } }) =>
				customers.filter(c => c.phoneNumber === where.phoneNumber).sort((a, b) => +b.updatedAt - +a.updatedAt)[0] ?? null,
			create: async ({ data }: { data: Omit<Customer, "id" | "updatedAt"> }) => {
				const row = { id: `customer-${customers.length + 1}`, updatedAt: new Date(), ...data }
				customers.push(row)
				return row
			},
			update: async ({ where, data }: { where: { id: string }, data: Partial<Customer> }) =>
				Object.assign(customers.find(c => c.id === where.id)!, data, { updatedAt: new Date() }),
		},
		customerShop: {
			upsert: async ({ where }: { where: { customerId_shopId: { customerId: string, shopId: string } } }) => {
				const key = where.customerId_shopId
				const link = links.find(l => match(l, key))
				if (link)
					link.lastSeenAt = new Date()
				else
					links.push({ ...key, lastSeenAt: new Date() })
			},
		},
		customerCard: {
			exists: async (where: Record<string, unknown>) => cards.some(c => match(c, where)),
			create: async ({ data }: { data: { customerId: string, cardNumber: string } }) => {
				cards.push({ id: `card-${cards.length + 1}`, createdAt: new Date(), ...data })
			},
		},
	}
}

function errorCode(promise: Promise<unknown>) {
	return promise.then(
		() => "resolved",
		(e: unknown) => (e instanceof GlobalError ? e.errorContext.message : String(e)),
	)
}

describe("customerService", () => {
	let prisma: ReturnType<typeof createPrisma>
	let shahkar: { verifyMobileNationalCode: ReturnType<typeof vi.fn>, verifyCardMatch: ReturnType<typeof vi.fn> }
	let otp: { send: ReturnType<typeof vi.fn>, consume: ReturnType<typeof vi.fn> }
	let jwt: JwtService
	let service: CustomerService

	beforeEach(() => {
		prisma = createPrisma()
		shahkar = {
			verifyMobileNationalCode: vi.fn(async () => ({ matched: true })),
			verifyCardMatch: vi.fn(async () => ({ matched: true })),
		}
		otp = { send: vi.fn(async () => ({ expiresInSeconds: 120 })), consume: vi.fn(async () => {}) }
		jwt = new JwtService({ secret: "x".repeat(32) })
		service = new CustomerService(prisma as never, shahkar as never, otp as never, jwt, new ErrorService())
	})

	const signup = async (subdomain = "setoode", details = { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH }) => {
		const { ticket } = await service.startSignup(subdomain, details)
		return service.completeSignup(ticket, "123456")
	}

	describe("signup", () => {
		it("sends no SMS when Shahkar says the phone is not the national code's", async () => {
			shahkar.verifyMobileNationalCode.mockResolvedValueOnce({ matched: false })
			expect(await errorCode(service.startSignup("setoode", { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH }))).toBe("PhoneNationalCodeMismatch")
			expect(otp.send).not.toHaveBeenCalled()
		})

		it("reports an unreachable Shahkar as unavailable, not as a mismatch", async () => {
			shahkar.verifyMobileNationalCode.mockRejectedValueOnce(new Error("api.ir down"))
			expect(await errorCode(service.startSignup("setoode", { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH }))).toBe("IdentityServiceUnavailable")
		})

		it("refuses disabled and unknown shops", async () => {
			expect(await errorCode(service.startSignup("closed", { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH }))).toBe("ShopDisabled")
			expect(await errorCode(service.startSignup("nope", { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH }))).toBe("ShopNotFound")
		})

		it("creates the customer, links the shop and opens a session", async () => {
			const { token } = await signup()
			expect(prisma.customers).toHaveLength(1)
			expect(prisma.links).toEqual([expect.objectContaining({ customerId: "customer-1", shopId: "shop-1" })])
			expect(await jwt.verifyAsync(token)).toMatchObject({ role: "customer", customerId: "customer-1", shopId: "shop-1" })
		})

		it("adds no row for a national code already on file: only the phone and the shops change", async () => {
			await signup("setoode")
			await signup("rahimi", { ssn: SSN, phoneNumber: "09122222222", birthDate: BIRTH })
			expect(prisma.customers).toHaveLength(1)
			expect(prisma.customers[0]!.phoneNumber).toBe("09122222222")
			expect(prisma.links.map(l => l.shopId)).toEqual(["shop-1", "shop-2"])
		})

		it("refuses a known national code with a different birth date", async () => {
			await signup()
			expect(await errorCode(service.startSignup("rahimi", { ssn: SSN, phoneNumber: PHONE, birthDate: "1371/01/05" }))).toBe("BirthDateMismatch")
		})

		it("refuses a forged or foreign ticket", async () => {
			expect(await errorCode(service.completeSignup("not-a-jwt", "123456"))).toBe("SignupExpired")
			const other = await new JwtService({ secret: "y".repeat(32) }).signAsync({ kind: "customer-signup", ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH, shopId: "shop-1" })
			expect(await errorCode(service.completeSignup(other, "123456"))).toBe("SignupExpired")
			const session = await jwt.signAsync({ role: "customer", customerId: "x", shopId: "shop-1" })
			expect(await errorCode(service.completeSignup(session, "123456"))).toBe("SignupExpired")
			expect(prisma.customers).toHaveLength(0)
		})

		it("saves nothing when the SMS code is wrong", async () => {
			const { ticket } = await service.startSignup("setoode", { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH })
			otp.consume.mockRejectedValueOnce(new Error("OtpIsNotValid"))
			await errorCode(service.completeSignup(ticket, "000000"))
			expect(prisma.customers).toHaveLength(0)
		})
	})

	describe("login", () => {
		it("refuses a phone no customer has, without sending an SMS", async () => {
			expect(await errorCode(service.startLogin("setoode", PHONE))).toBe("NotRegistered")
			expect(otp.send).not.toHaveBeenCalled()
		})

		it("links the customer to the shop they log in at", async () => {
			await signup("setoode")
			await service.startLogin("rahimi", PHONE)
			const { token } = await service.completeLogin("rahimi", PHONE, "123456")
			expect(await jwt.verifyAsync(token)).toMatchObject({ customerId: "customer-1", shopId: "shop-2" })
			expect(prisma.links.map(l => l.shopId)).toEqual(["shop-1", "shop-2"])
		})
	})

	describe("cards", () => {
		beforeEach(async () => {
			await signup()
		})

		it("sends CardMatch the national code and the unpadded Jalali birth date", async () => {
			await service.addCard("customer-1", CARD)
			expect(shahkar.verifyCardMatch).toHaveBeenCalledWith({ nationalCode: SSN, birthDate: "1370/1/5", cardNumber: CARD })
		})

		it("returns the card masked, with its bank", async () => {
			const { cards } = await service.addCard("customer-1", CARD)
			expect(cards).toEqual([expect.objectContaining({ maskedNumber: "6037-99**-****-9993", bankName: "بانک ملی ایران" })])
		})

		it("does not save a card CardMatch rejects", async () => {
			shahkar.verifyCardMatch.mockResolvedValueOnce({ matched: false })
			expect(await errorCode(service.addCard("customer-1", CARD))).toBe("CardNotOwned")
			expect(prisma.cards).toHaveLength(0)
		})

		it("refuses the same card twice without asking CardMatch again", async () => {
			await service.addCard("customer-1", CARD)
			expect(await errorCode(service.addCard("customer-1", CARD))).toBe("CardAlreadyAdded")
			expect(shahkar.verifyCardMatch).toHaveBeenCalledTimes(1)
		})
	})

	it("toCardMatchDate strips the zero padding", () => {
		expect(toCardMatchDate("1370/01/05")).toBe("1370/1/5")
		expect(toCardMatchDate("1402/12/30")).toBe("1402/12/30")
	})
})
