import type { AuthJwtPayload } from "./constants/auth.constants"
import type { MeModel } from "./model/me.model"
import type { OtpSentModel } from "./model/otp-sent.model"
import type { TokenModel } from "./model/token.model"
import { randomInt } from "node:crypto"
import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Config } from "~/config"
import { ErrorService } from "~/libs/error/error.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { SmsIrService } from "~/libs/sms-ir/sms-ir.service"
import { ADMIN_ROLE, OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS, SHOP_ROLE } from "./constants/auth.constants"
import { AuthErrors } from "./constants/auth.errors"

/**
 * SMS login for the admin (`adminPhoneNumber`, zarimen.ir/panel) and for shop owners
 * (the shop's `ownerPhoneNumber`, <subdomain>.zarimen.ir/panel). Both use the same code flow.
 */
@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private sms: SmsIrService,
		private jwt: JwtService,
		private config: Config,
		private error: ErrorService,
	) { }

	async sendAdminOtp(phoneNumber: string): Promise<OtpSentModel> {
		this.assertAdmin(phoneNumber)
		return this.sendOtp(phoneNumber)
	}

	async exchangeAdminOtp(phoneNumber: string, code: string): Promise<TokenModel> {
		this.assertAdmin(phoneNumber)
		await this.consumeOtp(phoneNumber, code)
		return this.issueToken({ role: ADMIN_ROLE, phoneNumber })
	}

	async sendShopOtp(subdomain: string, phoneNumber: string): Promise<OtpSentModel> {
		await this.findShopOwnedBy(subdomain, phoneNumber)
		return this.sendOtp(phoneNumber)
	}

	async exchangeShopOtp(subdomain: string, phoneNumber: string, code: string): Promise<TokenModel> {
		const shop = await this.findShopOwnedBy(subdomain, phoneNumber)
		await this.consumeOtp(phoneNumber, code)
		return this.issueToken({ role: SHOP_ROLE, phoneNumber, shopId: shop.id })
	}

	toMe(payload: AuthJwtPayload): MeModel {
		return payload.role === SHOP_ROLE
			? { role: payload.role, phoneNumber: payload.phoneNumber, shopId: payload.shopId }
			: { role: payload.role, phoneNumber: payload.phoneNumber }
	}

	private assertAdmin(phoneNumber: string) {
		if (phoneNumber !== this.config.adminPhoneNumber)
			throw this.error.throwErrorToClient(AuthErrors.NotAdmin)
	}

	/** The active shop on `subdomain` whose owner phone is `phoneNumber`. */
	private async findShopOwnedBy(subdomain: string, phoneNumber: string) {
		const shop = await this.prisma.shop.findUnique({
			where: { subdomain },
			select: { id: true, isActive: true, ownerPhoneNumber: true },
		})
		if (!shop)
			throw this.error.throwErrorToClient(AuthErrors.ShopNotFound)
		if (!shop.isActive)
			throw this.error.throwErrorToClient(AuthErrors.ShopDisabled)
		if (shop.ownerPhoneNumber !== phoneNumber)
			throw this.error.throwErrorToClient(AuthErrors.NotShopOwner)
		return shop
	}

	private async sendOtp(phoneNumber: string): Promise<OtpSentModel> {
		if (await this.findActiveOtp(phoneNumber))
			throw this.error.throwErrorToClient(AuthErrors.OtpAlreadySent)

		const code = randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0")
		const otp = await this.prisma.authOtp.create({
			data: {
				phoneNumber,
				code,
				expireDate: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
			},
		})

		try {
			await this.sms.sendOTPMessage(phoneNumber, code)
		}
		catch (e) {
			// Nobody received this code, so it must not block a retry for OTP_TTL.
			await this.prisma.authOtp.delete({ where: { id: otp.id } })
			throw this.error.throwErrorToClient(AuthErrors.SmsFailure, e as Error)
		}

		return { phoneNumber, expiresInSeconds: OTP_TTL_SECONDS }
	}

	/** Marks the phone's active code used if `code` matches it; counts a wrong guess otherwise. */
	private async consumeOtp(phoneNumber: string, code: string) {
		const otp = await this.findActiveOtp(phoneNumber)
		if (!otp)
			throw this.error.throwErrorToClient(AuthErrors.OtpIsNotValid)

		if (otp.code !== code) {
			const attempts = otp.attempts + 1
			await this.prisma.authOtp.update({
				where: { id: otp.id },
				data: { attempts, isUsed: attempts >= OTP_MAX_ATTEMPTS },
			})
			throw this.error.throwErrorToClient(AuthErrors.OtpIsNotValid)
		}

		await this.prisma.authOtp.update({ where: { id: otp.id }, data: { isUsed: true } })
	}

	private async issueToken(payload: AuthJwtPayload): Promise<TokenModel> {
		return {
			token: await this.jwt.signAsync(payload),
			me: this.toMe(payload),
		}
	}

	private findActiveOtp(phoneNumber: string) {
		return this.prisma.authOtp.findFirst({
			where: { phoneNumber, isUsed: false, expireDate: { gt: new Date() } },
			orderBy: { createdAt: "desc" },
		})
	}
}
