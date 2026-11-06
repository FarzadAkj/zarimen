import type { SelectedShop } from "./constants/shop.select"
import type { CreateShopInput } from "./dto/create-shop.input"
import type { ShopLoginInfoModel } from "./model/shop-login-info.model"
import type { ShopModel } from "./model/shop.model"
import { Injectable } from "@nestjs/common"
import { ErrorService } from "~/libs/error/error.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { ShahkarService } from "~/libs/shahkar/shahkar.service"
import { ShopErrors } from "./constants/shop.errors"
import { shopSelect } from "./constants/shop.select"

@Injectable()
export class ShopService {
	constructor(
		private prisma: PrismaService,
		private shahkar: ShahkarService,
		private error: ErrorService,
	) { }

	async createShop(input: CreateShopInput): Promise<ShopModel> {
		const { initialWalletBalance, ...shop } = input

		if (await this.prisma.shop.exists({ subdomain: shop.subdomain }))
			throw this.error.throwErrorToClient(ShopErrors.SubdomainTaken)

		await this.verifyOwner(shop.ownerPhoneNumber, shop.ownerNationalCode)

		const created = await this.prisma.shop.create({
			data: {
				...shop,
				wallet: { create: { balance: initialWalletBalance ?? "0" } },
			},
			select: shopSelect,
		})

		return this.toModel(created)
	}

	async readShops(): Promise<ShopModel[]> {
		const shops = await this.prisma.shop.findMany({
			select: shopSelect,
			orderBy: { createdAt: "desc" },
		})
		return shops.map(shop => this.toModel(shop))
	}

	async setShopActive(id: string, isActive: boolean): Promise<ShopModel> {
		if (!await this.prisma.shop.exists({ id }))
			throw this.error.throwErrorToClient(ShopErrors.NotFound)

		const shop = await this.prisma.shop.update({
			where: { id },
			data: { isActive },
			select: shopSelect,
		})
		return this.toModel(shop)
	}

	/** Public: name and logo for the login page on <subdomain>.zarimen.ir/panel. */
	async readShopLoginInfo(subdomain: string): Promise<ShopLoginInfoModel> {
		const shop = await this.prisma.shop.findUnique({
			where: { subdomain },
			select: { name: true, brandName: true, logoUrl: true, isActive: true },
		})
		if (!shop)
			throw this.error.throwErrorToClient(ShopErrors.NotFound)
		return shop
	}

	async readShop(id: string): Promise<ShopModel> {
		const shop = await this.prisma.shop.findUnique({ where: { id }, select: shopSelect })
		if (!shop)
			throw this.error.throwErrorToClient(ShopErrors.NotFound)
		return this.toModel(shop)
	}

	/** Admin sets the shop's wallet balance to `balance` (an absolute value, not a change). */
	async setWalletBalance(shopId: string, balance: string): Promise<ShopModel> {
		if (!await this.prisma.shop.exists({ id: shopId }))
			throw this.error.throwErrorToClient(ShopErrors.NotFound)

		await this.prisma.wallet.update({ where: { shopId }, data: { balance } })
		const shop = await this.prisma.shop.findUniqueOrThrow({ where: { id: shopId }, select: shopSelect })
		return this.toModel(shop)
	}

	/**
	 * Shahkar: the owner's phone must be registered under the owner's national code.
	 * Skipped when `identityCheck=false`.
	 */
	private async verifyOwner(mobile: string, nationalCode: string) {
		let matched: boolean
		try {
			({ matched } = await this.shahkar.verifyMobileNationalCode({ mobile, nationalCode }))
		}
		catch (e) {
			throw this.error.throwErrorToClient(ShopErrors.IdentityServiceUnavailable, e as Error)
		}

		if (!matched)
			throw this.error.throwErrorToClient(ShopErrors.PhoneNationalCodeMismatch)
	}

	private toModel({ wallet, ...shop }: SelectedShop): ShopModel {
		// Every shop is created with its wallet in the same write.
		return { ...shop, walletBalance: wallet!.balance.toFixed(0) }
	}
}
