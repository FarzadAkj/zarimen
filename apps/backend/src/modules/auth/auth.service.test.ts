import type { AuthOtp } from "@prisma/client"
import { JwtService } from "@nestjs/jwt"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Config } from "~/config"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { AuthService } from "./auth.service"
import { OTP_MAX_ATTEMPTS } from "./constants/auth.constants"
import { OtpService } from "./otp.service"
import "reflect-metadata"

/** Admin and owner codes are not billed, so charging only has to run the send. */
const freeWallet = { charge: (_shopId: string, _service: string, run: () => Promise<unknown>) => run() }

const ADMIN = "09120000000"
const OTHER_ADMIN = "09130000000"
const OWNER = "09121111111"

type FakeShop = { id: string, subdomain: string, isActive: boolean, ownerPhoneNumber: string }

/** In-memory stand-in for the authOtp / shop calls the service makes. */
function createPrisma() {
	const rows: AuthOtp[] = []
	const shops: FakeShop[] = [
		{ id: "shop-1", subdomain: "setoode", isActive: true, ownerPhoneNumber: OWNER },
		{ id: "shop-2", subdomain: "rahimi", isActive: false, ownerPhoneNumber: OWNER },
	]
	return {
		rows,
		shop: {
			findUnique: async ({ where }: { where: { subdomain: string } }) => shops.find(s => s.subdomain === where.subdomain) ?? null,
		},
		authOtp: {
			create: async ({ data }: { data: Pick<AuthOtp, "phoneNumber" | "purpose" | "code" | "expireDate"> & { customerPhoneNumber?: string } }) => {
				const row: AuthOtp = { id: String(rows.length + 1), attempts: 0, isUsed: false, createdAt: new Date(), ...data, customerPhoneNumber: data.customerPhoneNumber ?? null }
				rows.push(row)
				return row
			},
			findFirst: async ({ where }: { where: { phoneNumber: string, purpose: string, customerPhoneNumber: string | null } }) =>
				rows.filter(r => r.phoneNumber === where.phoneNumber && r.purpose === where.purpose && r.customerPhoneNumber === where.customerPhoneNumber && !r.isUsed && r.expireDate > new Date()).at(-1) ?? null,
			update: async ({ where, data }: { where: { id: string }, data: Partial<AuthOtp> }) =>
				Object.assign(rows.find(r => r.id === where.id)!, data),
			delete: async ({ where }: { where: { id: string } }) => rows.splice(rows.findIndex(r => r.id === where.id), 1)[0],
		},
	}
}

function errorCode(promise: Promise<unknown>) {
	return promise.then(
		() => "resolved",
		(e: unknown) => (e instanceof GlobalError ? e.errorContext.message : String(e)),
	)
}

describe("authService", () => {
	let prisma: ReturnType<typeof createPrisma>
	let sms: { sendOTPMessage: ReturnType<typeof vi.fn>, sendOwnerApproval: ReturnType<typeof vi.fn> }
	let otp: OtpService
	let auth: AuthService

	beforeEach(() => {
		prisma = createPrisma()
		sms = { sendOTPMessage: vi.fn(async () => {}), sendOwnerApproval: vi.fn(async () => {}) }
		const config = Object.assign(new Config(), { adminPhoneNumbers: `${ADMIN}, ${OTHER_ADMIN}` })
		const jwt = new JwtService({ secret: "x".repeat(32) })
		const error = new ErrorService()
		otp = new OtpService(prisma as never, sms as never, freeWallet as never, error)
		auth = new AuthService(prisma as never, otp, jwt, config, error)
	})

	const sentCode = () => sms.sendOTPMessage.mock.calls.at(-1)![1] as string

	it("accepts every number in the admin list, spaces around commas included", async () => {
		expect(await errorCode(auth.sendAdminOtp(ADMIN))).toBe("resolved")
		expect(await errorCode(auth.sendAdminOtp(OTHER_ADMIN))).toBe("resolved")
	})

	it("refuses to send a code to anyone but an admin", async () => {
		expect(await errorCode(auth.sendAdminOtp("09129999999"))).toBe("NotAdmin")
		expect(sms.sendOTPMessage).not.toHaveBeenCalled()
	})

	it("sends a 6-digit code and refuses a second one while it is usable", async () => {
		await auth.sendAdminOtp(ADMIN)
		expect(sentCode()).toMatch(/^\d{6}$/)
		expect(await errorCode(auth.sendAdminOtp(ADMIN))).toBe("OtpAlreadySent")
	})

	it("drops the code when the SMS fails, so the admin can retry at once", async () => {
		sms.sendOTPMessage.mockRejectedValueOnce(new Error("sms.ir down"))
		expect(await errorCode(auth.sendAdminOtp(ADMIN))).toBe("SmsFailure")
		expect(prisma.rows).toHaveLength(0)
		expect(await errorCode(auth.sendAdminOtp(ADMIN))).toBe("resolved")
	})

	it("exchanges the right code for a token exactly once", async () => {
		await auth.sendAdminOtp(ADMIN)
		const result = await auth.exchangeAdminOtp(ADMIN, sentCode())
		expect(result.token).toBeTruthy()
		expect(result.me).toEqual({ role: "admin", phoneNumber: ADMIN })
		expect(await errorCode(auth.exchangeAdminOtp(ADMIN, sentCode()))).toBe("OtpIsNotValid")
	})

	it("burns the code after the maximum number of wrong guesses", async () => {
		await auth.sendAdminOtp(ADMIN)
		const wrong = sentCode() === "000000" ? "111111" : "000000"
		for (let i = 0; i < OTP_MAX_ATTEMPTS; i++)
			expect(await errorCode(auth.exchangeAdminOtp(ADMIN, wrong))).toBe("OtpIsNotValid")

		// even the right code is refused now
		expect(await errorCode(auth.exchangeAdminOtp(ADMIN, sentCode()))).toBe("OtpIsNotValid")
		// and a fresh code can be requested
		expect(await errorCode(auth.sendAdminOtp(ADMIN))).toBe("resolved")
	})

	it("refuses an expired code", async () => {
		await auth.sendAdminOtp(ADMIN)
		prisma.rows[0]!.expireDate = new Date(Date.now() - 1000)
		expect(await errorCode(auth.exchangeAdminOtp(ADMIN, sentCode()))).toBe("OtpIsNotValid")
	})

	describe("shop login", () => {
		it("refuses unknown subdomains, disabled shops and phones that are not the owner's", async () => {
			expect(await errorCode(auth.sendShopOtp("nope", OWNER))).toBe("ShopNotFound")
			expect(await errorCode(auth.sendShopOtp("rahimi", OWNER))).toBe("ShopDisabled")
			expect(await errorCode(auth.sendShopOtp("setoode", ADMIN))).toBe("NotShopOwner")
			expect(sms.sendOTPMessage).not.toHaveBeenCalled()
		})

		it("issues a token bound to that one shop", async () => {
			await auth.sendShopOtp("setoode", OWNER)
			const { token, me } = await auth.exchangeShopOtp("setoode", OWNER, sentCode())
			expect(me).toEqual({ role: "shop", phoneNumber: OWNER, shopId: "shop-1" })
			expect(await new JwtService({ secret: "x".repeat(32) }).verifyAsync(token)).toMatchObject({ role: "shop", shopId: "shop-1" })
		})

		it("re-checks the shop at exchange time, so a shop disabled after the code was sent cannot log in", async () => {
			await auth.sendShopOtp("setoode", OWNER)
			const shop = await prisma.shop.findUnique({ where: { subdomain: "setoode" } })
			shop!.isActive = false
			expect(await errorCode(auth.exchangeShopOtp("setoode", OWNER, sentCode()))).toBe("ShopDisabled")
		})
	})

	it("a customer code the shop cannot pay for is not kept, and is reported as such (not as an SMS failure)", async () => {
		const brokeWallet = { charge: async () => {
			throw new GlobalError({ module: "WalletModule", message: "InsufficientBalance" })
		} }
		const otp = new OtpService(prisma as never, sms as never, brokeWallet as never, new ErrorService())
		expect(await errorCode(otp.send("09121111111", { shopId: "shop-1", customerSsn: "0499370899" }))).toBe("InsufficientBalance")
		expect(prisma.rows).toHaveLength(0)
		expect(sms.sendOTPMessage).not.toHaveBeenCalled()
	})

	describe("owner approval codes", () => {
		const bill = { shopId: "shop-1", customerSsn: "0499370899" }
		const signupOf = (customerPhoneNumber: string) => ({ purpose: "SIGNUP_APPROVAL" as const, customerPhoneNumber })
		const CUSTOMER_A = "09122222222"
		const CUSTOMER_B = "09123333333"
		const approvalCode = () => sms.sendOwnerApproval.mock.calls.at(-1)![1] as string

		it("go out with the approval template and never log the owner in", async () => {
			await otp.send(OWNER, bill, signupOf(CUSTOMER_A))
			expect(sms.sendOTPMessage).not.toHaveBeenCalled()
			expect(await errorCode(auth.exchangeShopOtp("setoode", OWNER, approvalCode()))).toBe("OtpIsNotValid")
			expect(await errorCode(otp.consume(OWNER, approvalCode(), signupOf(CUSTOMER_A)))).toBe("resolved")
		})

		it("do not block the owner's login code", async () => {
			await otp.send(OWNER, bill, { purpose: "CARD_APPROVAL", customerPhoneNumber: CUSTOMER_A })
			expect(await errorCode(auth.sendShopOtp("setoode", OWNER))).toBe("resolved")
		})

		it("approve only their own purpose", async () => {
			await otp.send(OWNER, bill, signupOf(CUSTOMER_A))
			expect(await errorCode(otp.consume(OWNER, approvalCode(), { purpose: "CARD_APPROVAL", customerPhoneNumber: CUSTOMER_A }))).toBe("OtpIsNotValid")
			expect(await errorCode(otp.consume(OWNER, approvalCode(), signupOf(CUSTOMER_A)))).toBe("resolved")
		})

		it("are kept per customer: two customers wait at once, the same customer twice is refused", async () => {
			await otp.send(OWNER, bill, signupOf(CUSTOMER_A))
			const codeA = approvalCode()
			expect(await errorCode(otp.send(OWNER, bill, signupOf(CUSTOMER_B)))).toBe("resolved")
			const codeB = approvalCode()
			expect(await errorCode(otp.send(OWNER, bill, signupOf(CUSTOMER_A)))).toBe("OtpAlreadySent")

			expect(await errorCode(otp.consume(OWNER, codeB, signupOf(CUSTOMER_B)))).toBe("resolved")
			expect(await errorCode(otp.consume(OWNER, codeA, signupOf(CUSTOMER_A)))).toBe("resolved")
		})

		it("only approve the customer they were sent for", async () => {
			await otp.send(OWNER, bill, signupOf(CUSTOMER_A))
			expect(await errorCode(otp.consume(OWNER, approvalCode(), signupOf(CUSTOMER_B)))).toBe("OtpIsNotValid")
		})
	})
})
