import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { CreateShopInput } from "./dto/create-shop.input"
import { SetShopActiveInput } from "./dto/set-shop-active.input"
import { SetWalletBalanceInput } from "./dto/set-wallet-balance.input"
import { ShopModel } from "./model/shop.model"
import { ShopService } from "./shop.service"

/** Admin only: adding shops and enabling / disabling them. */
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
}
