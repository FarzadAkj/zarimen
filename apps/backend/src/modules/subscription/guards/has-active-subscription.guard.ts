import type { CanActivate, ExecutionContext } from "@nestjs/common"
import type { ShopOwnerRequest } from "../../auth/guards/is-shop-owner.guard"
import { Injectable } from "@nestjs/common"
import { ErrorService } from "~/libs/error/error.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { hasActiveSubscription } from "../constants/subscription"
import { SubscriptionErrors } from "../constants/subscription.errors"

/**
 * For owner endpoints that need a running subscription (customer data). Must come after
 * IsShopOwner: `@UseGuards(IsShopOwner, HasActiveSubscription)`.
 */
@Injectable()
export class HasActiveSubscription implements CanActivate {
	constructor(
		private prisma: PrismaService,
		private error: ErrorService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const { _shopOwner } = context.switchToHttp().getRequest<ShopOwnerRequest>()
		const shop = await this.prisma.shop.findUniqueOrThrow({ where: { id: _shopOwner.shopId }, select: { subscriptionEndsAt: true } })
		if (!hasActiveSubscription(shop.subscriptionEndsAt))
			throw this.error.throwErrorToClient(SubscriptionErrors.SubscriptionInactive)
		return true
	}
}
