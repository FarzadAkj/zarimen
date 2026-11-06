import type { ShopOwnerRequest } from "../auth/guards/is-shop-owner.guard"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { ReadShopPublicInfoInput } from "./dto/read-shop-public-info.input"
import { ShopPublicInfoModel } from "./model/shop-public-info.model"
import { ShopModel } from "./model/shop.model"
import { ShopService } from "./shop.service"

/** Endpoints of a shop's site: its public pages and its owner's panel (<subdomain>.zarimen.ir). */
@Controller("shop-panel")
export class ShopPanelController {
	constructor(private shop: ShopService) { }

	@Post("readShopPublicInfo")
	@ApiOperation({ operationId: "readShopPublicInfo", description: "Public: what the shop's landing and login pages show." })
	@ApiBody({ type: ReadShopPublicInfoInput })
	@ApiResponse({ type: ShopPublicInfoModel, status: 200 })
	readShopPublicInfo(@Body() input: ReadShopPublicInfoInput): Promise<ShopPublicInfoModel> {
		return this.shop.readShopPublicInfo(input.subdomain)
	}

	@UseGuards(IsShopOwner)
	@ApiBearerAuth()
	@Post("readMyShop")
	@ApiOperation({ operationId: "readMyShop", description: "The logged-in owner's shop." })
	@ApiResponse({ type: ShopModel, status: 200 })
	readMyShop(@Req() request: ShopOwnerRequest): Promise<ShopModel> {
		return this.shop.readShop({ id: request._shopOwner.shopId })
	}
}
