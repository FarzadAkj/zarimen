import type { ShopOwnerRequest } from "../auth/guards/is-shop-owner.guard"
import { Controller, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { CustomerService } from "./customer.service"
import { ShopCustomerModel } from "./model/shop-customer.model"

/** The shop owner's view of their customers (<subdomain>.zarimen.ir/panel). */
@Controller("shop-panel")
export class ShopCustomersController {
	constructor(private customer: CustomerService) { }

	@UseGuards(IsShopOwner)
	@ApiBearerAuth()
	@Post("readMyCustomers")
	@ApiOperation({ operationId: "readMyCustomers", description: "Customers who verified at the owner's shop." })
	@ApiResponse({ type: ShopCustomerModel, isArray: true, status: 200 })
	readMyCustomers(@Req() request: ShopOwnerRequest): Promise<ShopCustomerModel[]> {
		return this.customer.readShopCustomers(request._shopOwner.shopId)
	}
}
