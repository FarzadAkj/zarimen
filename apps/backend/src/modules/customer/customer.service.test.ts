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
type ManualCheck = { id: string, shopId: string, ssn: string, birthDate: string, cardNumber: string, matched: boolean, createdAt: Date }

/** In-memory stand-in for the Prisma calls CustomerService makes. */
function createPrisma() {
	const subscribed = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
	const shops = [
		{ id: "shop-1", subdomain: "setoode", ownerPhoneNumber: "09350000001", isActive: true, subscriptionEndsAt: subscribed },
		{ id: "shop-2", subdomain: "rahimi", isActive: true, subscriptionEndsAt: subscribed },
		{ id: "shop-3", subdomain: "closed", isActive: false, subscriptionEndsAt: subscribed },
		{ id: "shop-4", subdomain: "expired", isActive: true, subscriptionEndsAt: new Date(Date.now() - 1000) },
		{ id: "shop-5", subdomain: "never", isActive: true, subscriptionEndsAt: null },
	]
	const customers: Customer[] = []
	const cards: Card[] = []
	const links: Link[] = []
	const manualChecks: ManualCheck[] = []
	const match = (row: Record<string, unknown>, where: Record<string, unknown>) =>
		Object.entries(where).every(([k, v]) => row[k] === v)

	return {
		customers,
		cards,
		links,
		manualChecks,
		manualCardCheck: {
			create: async ({ data }: { data: Omit<ManualCheck, "id" | "createdAt"> }) => {
				// one ms apart, so "newest first" is well defined
				manualChecks.push({ id: `check-${manualChecks.length + 1}`, createdAt: new Date(Date.now() + manualChecks.length), ...data })
			},
			findManyAndCount: async ({ where, skip, take }: { where: { shopId: string }, skip: number, take: number }) => {
				const rows = manualChecks.filter(c => c.shopId === where.shopId).sort((a, b) => +b.createdAt - +a.createdAt)
				return { data: rows.slice(skip, skip + take).map(({ shopId: _, ...row }) => row), count: rows.length }
			},
		},
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
			findUnique: async ({ where }: { where: { customerId_shopId: { customerId: string, shopId: string } } }) => {
				const key = where.customerId_shopId
				if (!links.some(l => match(l, key)))
					return null
				return { customer: { cards: cards.filter(c => c.customerId === key.customerId) } }
			},
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
	let wallet: { assertCanAfford: ReturnType<typeof vi.fn>, charge: ReturnType<typeof vi.fn> }
	let sms: { sendCardAdded: ReturnType<typeof vi.fn> }
	let jwt: JwtService
	let service: CustomerService

	beforeEach(() => {
		prisma = createPrisma()
		shahkar = {
			verifyMobileNationalCode: vi.fn(async () => ({ matched: true })),
			verifyCardMatch: vi.fn(async () => ({ matched: true })),
		}
		otp = { send: vi.fn(async () => ({ expiresInSeconds: 120 })), consume: vi.fn(async () => {}) }
		wallet = {
			assertCanAfford: vi.fn(async () => {}),
			charge: vi.fn((_bill: unknown, _service: string, run: () => Promise<unknown>) => run()),
		}
		sms = { sendCardAdded: vi.fn(async () => {}) }
		jwt = new JwtService({ secret: "x".repeat(32) })
		service = new CustomerService(prisma as never, shahkar as never, otp as never, wallet as never, sms as never, jwt, new ErrorService())
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

		it("refuses shops whose subscription ended or never started, before any paid call", async () => {
			expect(await errorCode(service.startSignup("expired", { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH }))).toBe("SubscriptionInactive")
			expect(await errorCode(service.startLogin("never", PHONE))).toBe("SubscriptionInactive")
			expect(shahkar.verifyMobileNationalCode).not.toHaveBeenCalled()
			expect(otp.send).not.toHaveBeenCalled()
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

		it("skips Shahkar for a customer already saved with the same national code, birth date and phone", async () => {
			await signup("setoode")
			shahkar.verifyMobileNationalCode.mockClear()
			wallet.assertCanAfford.mockClear()

			await service.startSignup("rahimi", { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH })
			expect(shahkar.verifyMobileNationalCode).not.toHaveBeenCalled()
			expect(wallet.assertCanAfford).toHaveBeenCalledWith("shop-2", ["SMS"])
			expect(otp.send).toHaveBeenLastCalledWith(PHONE, { shopId: "shop-2", customerSsn: SSN })
		})

		it("still asks Shahkar when a saved customer signs up with a different phone", async () => {
			await signup("setoode")
			shahkar.verifyMobileNationalCode.mockClear()
			await service.startSignup("setoode", { ssn: SSN, phoneNumber: "09122222222", birthDate: BIRTH })
			expect(shahkar.verifyMobileNationalCode).toHaveBeenCalledWith({ mobile: "09122222222", nationalCode: SSN })
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
			await service.addCard("customer-1", "shop-1", CARD)
			expect(shahkar.verifyCardMatch).toHaveBeenCalledWith({ nationalCode: SSN, birthDate: "1370/1/5", cardNumber: CARD })
		})

		it("returns the card masked, with its bank", async () => {
			const { cards } = await service.addCard("customer-1", "shop-1", CARD)
			expect(cards).toEqual([expect.objectContaining({ maskedNumber: "6037-99**-****-9993", bankName: "بانک ملی ایران" })])
		})

		it("does not save a card CardMatch rejects", async () => {
			shahkar.verifyCardMatch.mockResolvedValueOnce({ matched: false })
			expect(await errorCode(service.addCard("customer-1", "shop-1", CARD))).toBe("CardNotOwned")
			expect(prisma.cards).toHaveLength(0)
		})

		it("texts the owner the shop's subdomain and the customer's national code, billed as an SMS", async () => {
			await service.addCard("customer-1", "shop-1", CARD)
			expect(sms.sendCardAdded).toHaveBeenCalledWith("09350000001", "setoode", SSN)
			expect(wallet.charge).toHaveBeenLastCalledWith({ shopId: "shop-1", customerSsn: SSN }, "SMS", expect.any(Function))
		})

		it("keeps the card when the owner's SMS cannot be paid or sent", async () => {
			wallet.charge
				.mockImplementationOnce((_bill: unknown, _service: string, run: () => Promise<unknown>) => run())
				.mockRejectedValueOnce(new GlobalError({ module: "WalletModule", message: "InsufficientBalance" }))
			const { cards } = await service.addCard("customer-1", "shop-1", CARD)
			expect(cards).toHaveLength(1)
			expect(sms.sendCardAdded).not.toHaveBeenCalled()

			sms.sendCardAdded.mockRejectedValueOnce(new Error("sms.ir down"))
			const second = await service.addCard("customer-1", "shop-1", "6037991899999999")
			expect(second.cards).toHaveLength(2)
		})

		it("does not text the owner about a card CardMatch rejects", async () => {
			shahkar.verifyCardMatch.mockResolvedValueOnce({ matched: false })
			await errorCode(service.addCard("customer-1", "shop-1", CARD))
			expect(sms.sendCardAdded).not.toHaveBeenCalled()
		})

		it("refuses the same card twice without asking CardMatch again", async () => {
			await service.addCard("customer-1", "shop-1", CARD)
			expect(await errorCode(service.addCard("customer-1", "shop-1", CARD))).toBe("CardAlreadyAdded")
			expect(shahkar.verifyCardMatch).toHaveBeenCalledTimes(1)
		})
	})

	describe("shop owner's view of cards", () => {
		beforeEach(async () => {
			await signup("setoode")
			await service.addCard("customer-1", "shop-1", CARD)
		})

		it("gives the owner the full card numbers of their own customer", async () => {
			expect(await service.readShopCustomerCards("shop-1", "customer-1")).toEqual([
				expect.objectContaining({ cardNumber: CARD, bankName: "بانک ملی ایران" }),
			])
		})

		it("refuses another shop's customer", async () => {
			expect(await errorCode(service.readShopCustomerCards("shop-2", "customer-1"))).toBe("CustomerNotFound")
		})
	})

	describe("owner's manual card check", () => {
		const details = { ssn: SSN, birthDate: BIRTH, cardNumber: CARD }

		it("asks CardMatch, bills the card price to the owner's shop and saves no customer or card", async () => {
			expect(await service.checkCardManually("shop-1", details)).toEqual({ matched: true, bankName: "بانک ملی ایران" })
			expect(shahkar.verifyCardMatch).toHaveBeenCalledWith({ nationalCode: SSN, birthDate: "1370/1/5", cardNumber: CARD })
			expect(wallet.charge).toHaveBeenCalledWith({ shopId: "shop-1", customerSsn: SSN }, "CARD_MATCH", expect.any(Function))
			expect(prisma.customers).toHaveLength(0)
			expect(prisma.cards).toHaveLength(0)
		})

		it("keeps every answered check, matched or not, in the shop's own history, newest first", async () => {
			await service.checkCardManually("shop-1", details)
			shahkar.verifyCardMatch.mockResolvedValueOnce({ matched: false })
			await service.checkCardManually("shop-1", { ...details, ssn: "0012345678" })

			const history = await service.readManualCardChecks("shop-1")
			expect(history).toMatchObject({ count: 2, pageSize: 20 })
			expect(history.data).toEqual([
				expect.objectContaining({ ssn: "0012345678", birthDate: BIRTH, cardNumber: CARD, matched: false, bankName: "بانک ملی ایران" }),
				expect.objectContaining({ ssn: SSN, matched: true }),
			])
			expect(await service.readManualCardChecks("shop-2")).toMatchObject({ data: [], count: 0 })
		})

		it("keeps no history row for a check that was not paid or not answered", async () => {
			wallet.charge.mockRejectedValueOnce(new GlobalError({ module: "WalletModule", message: "InsufficientBalance" }))
			await errorCode(service.checkCardManually("shop-1", details))
			shahkar.verifyCardMatch.mockRejectedValueOnce(new Error("down"))
			await errorCode(service.checkCardManually("shop-1", details))
			expect(prisma.manualChecks).toHaveLength(0)
		})

		it("returns a mismatch as a result, not an error", async () => {
			shahkar.verifyCardMatch.mockResolvedValueOnce({ matched: false })
			expect(await service.checkCardManually("shop-1", details)).toMatchObject({ matched: false })
		})

		it("reports an unpaid check as InsufficientBalance and an unreachable CardMatch as unavailable", async () => {
			wallet.charge.mockRejectedValueOnce(new GlobalError({ module: "WalletModule", message: "InsufficientBalance" }))
			expect(await errorCode(service.checkCardManually("shop-1", details))).toBe("InsufficientBalance")
			shahkar.verifyCardMatch.mockRejectedValueOnce(new Error("down"))
			expect(await errorCode(service.checkCardManually("shop-1", details))).toBe("IdentityServiceUnavailable")
		})

		it("refuses a shop without a running subscription before any paid call", async () => {
			expect(await errorCode(service.checkCardManually("shop-4", details))).toBe("SubscriptionInactive")
			expect(wallet.charge).not.toHaveBeenCalled()
		})
	})

	describe("billing", () => {
		const insufficient = () => new GlobalError({ module: "WalletModule", message: "InsufficientBalance" })

		it("checks the wallet covers Shahkar + SMS before running Shahkar, and bills both to the shop", async () => {
			await service.startSignup("setoode", { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH })
			expect(wallet.assertCanAfford).toHaveBeenCalledWith("shop-1", ["SHAHKAR", "SMS"])
			expect(wallet.charge).toHaveBeenCalledWith({ shopId: "shop-1", customerSsn: SSN }, "SHAHKAR", expect.any(Function))
			expect(otp.send).toHaveBeenCalledWith(PHONE, { shopId: "shop-1", customerSsn: SSN })
		})

		it("runs no Shahkar check and sends no SMS when the wallet cannot pay", async () => {
			wallet.assertCanAfford.mockRejectedValueOnce(insufficient())
			expect(await errorCode(service.startSignup("setoode", { ssn: SSN, phoneNumber: PHONE, birthDate: BIRTH }))).toBe("InsufficientBalance")
			expect(shahkar.verifyMobileNationalCode).not.toHaveBeenCalled()
			expect(otp.send).not.toHaveBeenCalled()
		})

		it("bills a card check at the card price, not the Shahkar price", async () => {
			await signup()
			await service.addCard("customer-1", "shop-1", CARD)
			expect(wallet.charge).toHaveBeenCalledWith({ shopId: "shop-1", customerSsn: SSN }, "CARD_MATCH", expect.any(Function))
		})

		it("reports an unpaid CardMatch as InsufficientBalance, not as the identity service being down", async () => {
			await signup()
			wallet.charge.mockRejectedValueOnce(insufficient())
			expect(await errorCode(service.addCard("customer-1", "shop-1", CARD))).toBe("InsufficientBalance")
			expect(prisma.cards).toHaveLength(0)
		})

		it("bills a login SMS to the shop logged in at", async () => {
			await signup("setoode")
			await service.startLogin("rahimi", PHONE)
			expect(otp.send).toHaveBeenLastCalledWith(PHONE, { shopId: "shop-2", customerSsn: SSN })
		})
	})

	it("toCardMatchDate strips the zero padding", () => {
		expect(toCardMatchDate("1370/01/05")).toBe("1370/1/5")
		expect(toCardMatchDate("1402/12/30")).toBe("1402/12/30")
	})
})
