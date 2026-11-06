import type { AuthJwtPayload } from "./constants/auth.constants"
import type { MeModel } from "./model/me.model"
import type { OtpSentModel } from "./model/otp-sent.model"
import type { TokenModel } from "./model/token.model"
import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Config } from "~/config"
import { ErrorService } from "~/libs/error/error.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { ADMIN_ROLE, SHOP_ROLE } from "./constants/auth.constants"
import { AuthErrors } from "./constants/auth.errors"
import { OtpService } from "./otp.service"

/**
 * SMS login for the admins (`adminPhoneNumbers`, zarimen.ir/panel) and for shop owners
 * (the shop's `ownerPhoneNumber`, <subdomain>.zarimen.ir/panel). Both use the same code flow.
 */
@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private otp: OtpService,
		private jwt: JwtService,
		private config: Config,
		private error: ErrorService,
	) { }

	async sendAdminOtp(phoneNumber: string): Promise<OtpSentModel> {
		this.assertAdmin(phoneNumber)
		return this.otp.send(phoneNumber)
	}

	async exchangeAdminOtp(phoneNumber: string, code: string): Promise<TokenModel> {
		this.assertAdmin(phoneNumber)
		await this.otp.consume(phoneNumber, code)
		return this.issueToken({ role: ADMIN_ROLE, phoneNumber })
	}

	async sendShopOtp(subdomain: string, phoneNumber: string): Promise<OtpSentModel> {
		await this.findShopOwnedBy(subdomain, phoneNumber)
		return this.otp.send(phoneNumber)
	}

	async exchangeShopOtp(subdomain: string, phoneNumber: string, code: string): Promise<TokenModel> {
		const shop = await this.findShopOwnedBy(subdomain, phoneNumber)
		await this.otp.consume(phoneNumber, code)
		return this.issueToken({ role: SHOP_ROLE, phoneNumber, shopId: shop.id })
	}

	toMe(payload: AuthJwtPayload): MeModel {
		return payload.role === SHOP_ROLE
			? { role: payload.role, phoneNumber: payload.phoneNumber, shopId: payload.shopId }
			: { role: payload.role, phoneNumber: payload.phoneNumber }
	}

	private assertAdmin(phoneNumber: string) {
		if (!this.config.isAdminPhoneNumber(phoneNumber))
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

	private async issueToken(payload: AuthJwtPayload): Promise<TokenModel> {
		return {
			token: await this.jwt.signAsync(payload),
			me: this.toMe(payload),
		}
	}
}
