import type { ShopOwnerRequest } from "../auth/guards/is-shop-owner.guard"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { ReadShopLoginInfoInput } from "./dto/read-shop-login-info.input"
import { ShopLoginInfoModel } from "./model/shop-login-info.model"
import { ShopModel } from "./model/shop.model"
import { ShopService } from "./shop.service"

/** Endpoints of a shop's own panel, <subdomain>.zarimen.ir/panel. */
@Controller("shop-panel")
export class ShopPanelController {
	constructor(private shop: ShopService) { }

	@Post("readShopLoginInfo")
	@ApiOperation({ operationId: "readShopLoginInfo", description: "Public: name and logo shown on the shop's login page." })
	@ApiBody({ type: ReadShopLoginInfoInput })
	@ApiResponse({ type: ShopLoginInfoModel, status: 200 })
	readShopLoginInfo(@Body() input: ReadShopLoginInfoInput): Promise<ShopLoginInfoModel> {
		return this.shop.readShopLoginInfo(input.subdomain)
	}

	@UseGuards(IsShopOwner)
	@ApiBearerAuth()
	@Post("readMyShop")
	@ApiOperation({ operationId: "readMyShop", description: "The logged-in owner's shop." })
	@ApiResponse({ type: ShopModel, status: 200 })
	readMyShop(@Req() request: ShopOwnerRequest): Promise<ShopModel> {
		return this.shop.readShop(request._shopOwner.shopId)
	}
}
