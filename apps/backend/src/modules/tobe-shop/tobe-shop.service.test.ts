import { beforeEach, describe, expect, it, vi } from "vitest"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { ShopErrors } from "../shop/constants/shop.errors"
import { TobeShopService } from "./tobe-shop.service"
import "reflect-metadata"

const BUCKET = "https://bucket.example/zar-imen/"
const ADMINS = ["09120000000"]
const FORM = {
	name: "طلای ستوده",
	brandName: "ستوده",
	subdomain: "setoode",
	ownerFullName: "علی ستوده",
	ownerPhoneNumber: "09121111111",
	ownerNationalCode: "0499370899",
}

type Row = typeof FORM & { id: string, status: string, problem: string | null, shopId: string | null, smsSentAt: Date | null, ip: string | null, logoUrl: string | null, address: string | null, landline: string | null, createdAt: Date, updatedAt: Date }

function createPrisma() {
	const rows: Row[] = []
	return {
		rows,
		tobeShop: {
			create: async ({ data }: { data: typeof FORM & { ip: string } }) => {
				const row: Row = { id: `r-${rows.length + 1}`, status: "PENDING", problem: null, shopId: null, smsSentAt: null, logoUrl: null, address: null, landline: null, createdAt: new Date(), updatedAt: new Date(), ...data }
				rows.push(row)
				return row
			},
			findUnique: async ({ where }: { where: { id: string } }) => rows.find(r => r.id === where.id) ?? null,
			update: async ({ where, data }: { where: { id: string }, data: Partial<Row> }) => Object.assign(rows.find(r => r.id === where.id)!, data),
		},
	}
}

function errorCode(promise: Promise<unknown>) {
	return promise.then(
		() => "resolved",
		(e: unknown) => (e instanceof GlobalError ? e.errorContext.message : String(e)),
	)
}

describe("tobeShopService", () => {
	let prisma: ReturnType<typeof createPrisma>
	let shops: { findTaken: ReturnType<typeof vi.fn>, createShop: ReturnType<typeof vi.fn> }
	let sms: { sendBulkMessage: ReturnType<typeof vi.fn>, sendShopWelcome: ReturnType<typeof vi.fn>, sendShopRejected: ReturnType<typeof vi.fn> }
	let service: TobeShopService

	beforeEach(() => {
		prisma = createPrisma()
		shops = {
			findTaken: vi.fn(async () => ({ subdomain: false, nationalCode: false, phoneNumber: false })),
			createShop: vi.fn(async () => ({ id: "shop-1" })),
		}
		sms = { sendBulkMessage: vi.fn(async () => {}), sendShopWelcome: vi.fn(async () => {}), sendShopRejected: vi.fn(async () => {}) }
		const images = { isOwnImageUrl: (url: string) => url.startsWith(BUCKET), createUpload: vi.fn(() => ({})) }
		const config = { adminPhoneNumberList: () => ADMINS }
		service = new TobeShopService(prisma as never, shops as never, images as never, sms as never, config as never, new ErrorService())
	})

	const submitted = async () => {
		await service.submit(FORM, "1.1.1.1")
		return prisma.rows.at(-1)!
	}

	describe("submit", () => {
		it("saves a PENDING request and texts the admins", async () => {
			const result = await service.submit(FORM, "1.1.1.1")
			expect(result).toEqual({ accepted: true, subdomainTaken: false, nationalCodeTaken: false, phoneNumberTaken: false })
			expect(prisma.rows).toEqual([expect.objectContaining({ status: "PENDING", subdomain: "setoode", ip: "1.1.1.1" })])
			expect(sms.sendBulkMessage).toHaveBeenCalledWith(ADMINS, "درخواست ثبت فروشگاه طلای ستوده (setoode) ارسال شده است.")
		})

		it("reports every value an existing shop already has, and saves nothing", async () => {
			shops.findTaken.mockResolvedValueOnce({ subdomain: true, nationalCode: true, phoneNumber: false })
			expect(await service.submit(FORM, "1.1.1.1")).toEqual({ accepted: false, subdomainTaken: true, nationalCodeTaken: true, phoneNumberTaken: false })
			expect(prisma.rows).toHaveLength(0)
			expect(sms.sendBulkMessage).not.toHaveBeenCalled()
		})

		it("accepts at most 3 requests per IP per hour", async () => {
			for (let i = 0; i < 3; i++)
				await service.submit(FORM, "1.1.1.1")
			expect(await errorCode(service.submit(FORM, "1.1.1.1"))).toBe("TooManyRequests")
			expect(await errorCode(service.submit(FORM, "2.2.2.2"))).toBe("resolved")
		})

		it("refuses a logo that is not in our bucket", async () => {
			expect(await errorCode(service.submit({ ...FORM, logoUrl: "https://evil.example/x.png" }, "1.1.1.1"))).toBe("InvalidLogo")
		})
	})

	describe("checkAndInsert", () => {
		it("creates the shop (wallet balance included) and marks the request REGISTERED", async () => {
			const { id } = await submitted()
			const result = await service.checkAndInsert({ id, initialWalletBalance: "500000" })
			expect(shops.createShop).toHaveBeenCalledWith(expect.objectContaining({ subdomain: "setoode", ownerNationalCode: FORM.ownerNationalCode, initialWalletBalance: "500000" }))
			expect(result).toMatchObject({ status: "REGISTERED", shopId: "shop-1", problem: null })
		})

		it("a Shahkar mismatch cancels the request with the problem text", async () => {
			const { id } = await submitted()
			shops.createShop.mockRejectedValueOnce(new GlobalError(ShopErrors.PhoneNationalCodeMismatch))
			const result = await service.checkAndInsert({ id })
			expect(result.status).toBe("CANCELED")
			expect(result.problem).toBe("کد ملی صاحب (0499370899) با شماره تلفن (09121111111) مطابقت ندارد")
		})

		it("a subdomain taken since the submission cancels it too", async () => {
			const { id } = await submitted()
			shops.createShop.mockRejectedValueOnce(new GlobalError(ShopErrors.SubdomainTaken))
			expect((await service.checkAndInsert({ id })).problem).toContain("setoode")
		})

		it("shahkar being down is thrown and the request stays PENDING", async () => {
			const { id } = await submitted()
			shops.createShop.mockRejectedValueOnce(new GlobalError(ShopErrors.IdentityServiceUnavailable))
			expect(await errorCode(service.checkAndInsert({ id }))).toBe("IdentityServiceUnavailable")
			expect(prisma.rows[0]!.status).toBe("PENDING")
		})

		it("only PENDING requests are checked", async () => {
			const { id } = await submitted()
			await service.cancel(id)
			expect(await errorCode(service.checkAndInsert({ id }))).toBe("TobeShopWrongStatus")
			expect(shops.createShop).not.toHaveBeenCalled()
		})
	})

	describe("sendSms", () => {
		it("registered → welcome template with the admin's SUBDOMAIN, once", async () => {
			const { id } = await submitted()
			await service.checkAndInsert({ id })
			const result = await service.sendSms(id, "setoode")
			expect(sms.sendShopWelcome).toHaveBeenCalledWith(FORM.ownerPhoneNumber, "setoode")
			expect(result.smsSentAt).toBeInstanceOf(Date)
			expect(await errorCode(service.sendSms(id, "setoode"))).toBe("SmsAlreadySent")
		})

		it("canceled → rejection template with the admin's INFO", async () => {
			const { id } = await submitted()
			await service.cancel(id)
			await service.sendSms(id, "  مدارک ناقص است ")
			expect(sms.sendShopRejected).toHaveBeenCalledWith(FORM.ownerPhoneNumber, "مدارک ناقص است")
		})

		it("nothing is sent for a PENDING request; a failed send is reported and can be retried", async () => {
			const { id } = await submitted()
			expect(await errorCode(service.sendSms(id, "x"))).toBe("TobeShopWrongStatus")

			await service.cancel(id)
			sms.sendShopRejected.mockRejectedValueOnce(new Error("sms.ir down"))
			expect(await errorCode(service.sendSms(id, "x"))).toBe("SmsFailure")
			expect(prisma.rows[0]!.smsSentAt).toBeNull()
			expect(await errorCode(service.sendSms(id, "x"))).toBe("resolved")
		})
	})
})
