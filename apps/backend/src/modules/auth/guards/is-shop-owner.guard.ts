import type { CanActivate, ExecutionContext } from "@nestjs/common"
import type { FastifyRequest } from "fastify"
import type { AuthJwtPayload } from "../constants/auth.constants"
import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { ErrorService } from "~/libs/error/error.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { SHOP_ROLE } from "../constants/auth.constants"
import { AuthErrors } from "../constants/auth.errors"
import { readToken } from "./read-token"

export type ShopOwnerRequest = FastifyRequest & { _shopOwner: Extract<AuthJwtPayload, { role: typeof SHOP_ROLE }> }

/**
 * Lets the request through only with a valid shop token in `Authorization`, and only
 * while the shop is still active and its owner phone is still the one in the token.
 * So disabling a shop, or changing its owner, logs the owner out at once.
 */
@Injectable()
export class IsShopOwner implements CanActivate {
	constructor(
		private jwt: JwtService,
		private prisma: PrismaService,
		private error: ErrorService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<ShopOwnerRequest>()

		const payload = await this.jwt.verifyAsync<AuthJwtPayload>(readToken(request)).catch(() => null)
		if (payload?.role !== SHOP_ROLE)
			throw this.error.throwErrorToClient(AuthErrors.Unauthorized)

		const isOwner = await this.prisma.shop.exists({
			id: payload.shopId,
			isActive: true,
			ownerPhoneNumber: payload.phoneNumber,
		})
		if (!isOwner)
			throw this.error.throwErrorToClient(AuthErrors.Unauthorized)

		request._shopOwner = payload
		return true
	}
}
