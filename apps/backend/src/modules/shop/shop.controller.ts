import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { CreateShopInput } from "./dto/create-shop.input"
import { ReadShopPublicInfoInput } from "./dto/read-shop-public-info.input"
import { SetShopActiveInput } from "./dto/set-shop-active.input"
import { SetWalletBalanceInput } from "./dto/set-wallet-balance.input"
import { UpdateShopInput } from "./dto/update-shop.input"
import { ShopModel } from "./model/shop.model"
import { ShopService } from "./shop.service"

/** Admin only: adding, editing and enabling / disabling shops. */
@UseGuards(IsAdmin)
@ApiBearerAuth()
@Controller("shop")
export class ShopController {
	constructor(private shop: ShopService) { }

	@Post("createShop")
	@ApiOperation({ operationId: "createShop" })
	@ApiBody({ type: CreateShopInput })
	@ApiResponse({ type: ShopModel, status: 200 })
	createShop(@Body() input: CreateShopInput): Promise<ShopModel> {
		return this.shop.createShop(input)
	}

	@Post("updateShop")
	@ApiOperation({ operationId: "updateShop", description: "Edits a shop's details; the subdomain and the owner's mobile and national code cannot change." })
	@ApiBody({ type: UpdateShopInput })
	@ApiResponse({ type: ShopModel, status: 200 })
	updateShop(@Body() input: UpdateShopInput): Promise<ShopModel> {
		return this.shop.updateShop(input)
	}

	@Post("readShops")
	@ApiOperation({ operationId: "readShops" })
	@ApiResponse({ type: ShopModel, isArray: true, status: 200 })
	readShops(): Promise<ShopModel[]> {
		return this.shop.readShops()
	}

	@Post("setShopActive")
	@ApiOperation({ operationId: "setShopActive" })
	@ApiBody({ type: SetShopActiveInput })
	@ApiResponse({ type: ShopModel, status: 200 })
	setShopActive(@Body() input: SetShopActiveInput): Promise<ShopModel> {
		return this.shop.setShopActive(input.id, input.isActive)
	}

	@Post("setWalletBalance")
	@ApiOperation({ operationId: "setWalletBalance", description: "Sets the shop's wallet balance to the given amount." })
	@ApiBody({ type: SetWalletBalanceInput })
	@ApiResponse({ type: ShopModel, status: 200 })
	setWalletBalance(@Body() input: SetWalletBalanceInput): Promise<ShopModel> {
		return this.shop.setWalletBalance(input.shopId, input.balance)
	}

	@Post("readShopBySubdomain")
	@ApiOperation({ operationId: "readShopBySubdomain", description: "One shop, for the admin's view of its panel." })
	@ApiBody({ type: ReadShopPublicInfoInput })
	@ApiResponse({ type: ShopModel, status: 200 })
	readShopBySubdomain(@Body() input: ReadShopPublicInfoInput): Promise<ShopModel> {
		return this.shop.readShop({ subdomain: input.subdomain })
	}
}
