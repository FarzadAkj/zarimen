import type { TobeShop } from "@prisma/client"
import type { CheckAndInsertTobeShopInput, SubmitTobeShopInput } from "./dto/tobe-shop.input"
import type { ReadTobeShopsOutput, SubmitTobeShopOutput, TobeShopModel } from "./model/tobe-shop.model"
import { Injectable } from "@nestjs/common"
import { TobeShopStatus } from "@prisma/client"
import { Config } from "~/config"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { ImageBucketService } from "~/libs/image-bucket/image-bucket.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { RateLimiter } from "~/libs/rate-limit/rate-limiter"
import { SmsIrService } from "~/libs/sms-ir/sms-ir.service"
import { ShopService } from "../shop/shop.service"
import { ACCEPTED_PER_HOUR, ATTEMPTS_PER_HOUR, problemText, TOBE_SHOPS_PAGE_SIZE, tobeShopNotice, UPLOADS_PER_HOUR } from "./constants/tobe-shop"
import { TobeShopErrors } from "./constants/tobe-shop.errors"

const HOUR = 60 * 60 * 1000

/**
 * Shop requests from zarimen.ir/signup. Anyone submits the shop form (checked only against
 * existing shops' unique values); the admins get an SMS. The admin's "Check and Insert" runs
 * the same checks as creating a shop by hand (Shahkar included): it passes → Shop created,
 * REGISTERED; it fails → CANCELED with the problem. The admin may then send the welcome /
 * rejection SMS, with the template's variable edited, or skip it.
 */
@Injectable()
export class TobeShopService {
	private attempts = new RateLimiter(ATTEMPTS_PER_HOUR, HOUR)
	private accepted = new RateLimiter(ACCEPTED_PER_HOUR, HOUR)
	private uploads = new RateLimiter(UPLOADS_PER_HOUR, HOUR)
	/** Requests being checked right now; a second click must not create the shop twice. */
	private checking = new Set<string>()

	constructor(
		private prisma: PrismaService,
		private shops: ShopService,
		private images: ImageBucketService,
		private sms: SmsIrService,
		private config: Config,
		private error: ErrorService,
	) { }

	async submit(input: SubmitTobeShopInput, ip: string): Promise<SubmitTobeShopOutput> {
		if (!this.attempts.hit(ip))
			throw this.error.throwErrorToClient(TobeShopErrors.TooManyRequests)
		if (input.logoUrl && !this.images.isOwnImageUrl(input.logoUrl))
			throw this.error.throwErrorToClient(TobeShopErrors.InvalidLogo)

		const taken = await this.shops.findTaken(input)
		const result = { subdomainTaken: taken.subdomain, nationalCodeTaken: taken.nationalCode, phoneNumberTaken: taken.phoneNumber }
		if (taken.subdomain || taken.nationalCode || taken.phoneNumber)
			return { accepted: false, ...result }

		if (!this.accepted.hit(ip))
			throw this.error.throwErrorToClient(TobeShopErrors.TooManyRequests)

		await this.prisma.tobeShop.create({ data: { ...input, ip } })
		await this.sms.sendBulkMessage(this.config.adminPhoneNumberList(), tobeShopNotice(input))
		return { accepted: true, ...result }
	}

	/** The logo upload of the public form, limited per IP. */
	createLogoUpload(contentType: Parameters<ImageBucketService["createUpload"]>[0], size: number, ip: string) {
		if (!this.uploads.hit(ip))
			throw this.error.throwErrorToClient(TobeShopErrors.TooManyRequests)
		return this.images.createUpload(contentType, size)
	}

	async readTobeShops(status: TobeShopStatus | undefined, page = 1): Promise<ReadTobeShopsOutput> {
		const where = { status }
		const [data, count] = await Promise.all([
			this.prisma.tobeShop.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * TOBE_SHOPS_PAGE_SIZE, take: TOBE_SHOPS_PAGE_SIZE }),
			this.prisma.tobeShop.count({ where }),
		])
		return { data: data.map(row => this.toModel(row)), count, pageSize: TOBE_SHOPS_PAGE_SIZE }
	}

	/**
	 * "Check and Insert": creates the shop through ShopService.createShop (unique values +
	 * Shahkar). A failure the requester caused cancels the request and keeps the reason in
	 * `problem`; anything else (Shahkar down…) is thrown and the request stays PENDING.
	 */
	async checkAndInsert({ id, initialWalletBalance }: CheckAndInsertTobeShopInput): Promise<TobeShopModel> {
		if (this.checking.has(id))
			throw this.error.throwErrorToClient(TobeShopErrors.TobeShopBusy)
		this.checking.add(id)
		try {
			const request = await this.findWithStatus(id, TobeShopStatus.PENDING)
			const { name, brandName, subdomain, logoUrl, address, landline, ownerFullName, ownerPhoneNumber, ownerNationalCode } = request

			let shopId: string
			try {
				({ id: shopId } = await this.shops.createShop({
					name,
					brandName,
					subdomain,
					ownerFullName,
					ownerPhoneNumber,
					ownerNationalCode,
					logoUrl: logoUrl ?? undefined,
					address: address ?? undefined,
					landline: landline ?? undefined,
					initialWalletBalance,
				}))
			}
			catch (e) {
				const problem = e instanceof GlobalError ? problemText(e.errorContext.message, request) : null
				if (!problem)
					throw e
				return this.toModel(await this.prisma.tobeShop.update({ where: { id }, data: { status: TobeShopStatus.CANCELED, problem } }))
			}
			return this.toModel(await this.prisma.tobeShop.update({ where: { id }, data: { status: TobeShopStatus.REGISTERED, shopId } }))
		}
		finally {
			this.checking.delete(id)
		}
	}

	/** Admin only; PENDING requests only. */
	async cancel(id: string): Promise<TobeShopModel> {
		await this.findWithStatus(id, TobeShopStatus.PENDING)
		return this.toModel(await this.prisma.tobeShop.update({ where: { id }, data: { status: TobeShopStatus.CANCELED } }))
	}

	/**
	 * The one SMS a decided request gets, with the admin's value for the template's variable:
	 * CANCELED → rejection template (INFO), REGISTERED → welcome template (SUBDOMAIN).
	 */
	async sendSms(id: string, value: string): Promise<TobeShopModel> {
		const request = await this.prisma.tobeShop.findUnique({ where: { id } })
		if (!request)
			throw this.error.throwErrorToClient(TobeShopErrors.TobeShopNotFound)
		if (request.status === TobeShopStatus.PENDING)
			throw this.error.throwErrorToClient(TobeShopErrors.TobeShopWrongStatus)
		if (request.smsSentAt)
			throw this.error.throwErrorToClient(TobeShopErrors.SmsAlreadySent)

		try {
			if (request.status === TobeShopStatus.REGISTERED)
				await this.sms.sendShopWelcome(request.ownerPhoneNumber, value.trim())
			else
				await this.sms.sendShopRejected(request.ownerPhoneNumber, value.trim())
		}
		catch (e) {
			throw this.error.throwErrorToClient(TobeShopErrors.SmsFailure, e as Error)
		}
		return this.toModel(await this.prisma.tobeShop.update({ where: { id }, data: { smsSentAt: new Date() } }))
	}

	private async findWithStatus(id: string, status: TobeShopStatus) {
		const request = await this.prisma.tobeShop.findUnique({ where: { id } })
		if (!request)
			throw this.error.throwErrorToClient(TobeShopErrors.TobeShopNotFound)
		if (request.status !== status)
			throw this.error.throwErrorToClient(TobeShopErrors.TobeShopWrongStatus)
		return request
	}

	private toModel({ ip: _ip, updatedAt: _updatedAt, ...row }: TobeShop): TobeShopModel {
		return row
	}
}
