import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { CustomerService } from "./customer.service"
import { ReadShopCustomerCardsInput, ReadShopCustomersInput } from "./dto/admin-shop-customers.input"
import { ReadShopManualCardChecksInput } from "./dto/read-manual-card-checks.input"
import { ReadManualCardChecksOutput } from "./model/manual-card-check.model"
import { ShopCustomerCardModel, ShopCustomerModel } from "./model/shop-customer.model"

/** The admin looking at one shop's customers (zarimen.ir/panel/customers/<subdomain>). */
@UseGuards(IsAdmin)
@ApiBearerAuth()
@Controller("shop")
export class AdminShopCustomersController {
	constructor(private customer: CustomerService) { }

	@Post("readShopCustomers")
	@ApiOperation({ operationId: "readShopCustomers" })
	@ApiBody({ type: ReadShopCustomersInput })
	@ApiResponse({ type: ShopCustomerModel, isArray: true, status: 200 })
	readShopCustomers(@Body() input: ReadShopCustomersInput): Promise<ShopCustomerModel[]> {
		return this.customer.readShopCustomers(input.shopId, input.search)
	}

	@Post("readShopCustomerCards")
	@ApiOperation({ operationId: "readShopCustomerCards" })
	@ApiBody({ type: ReadShopCustomerCardsInput })
	@ApiResponse({ type: ShopCustomerCardModel, isArray: true, status: 200 })
	readShopCustomerCards(@Body() input: ReadShopCustomerCardsInput): Promise<ShopCustomerCardModel[]> {
		return this.customer.readShopCustomerCards(input.shopId, input.customerId)
	}

	@Post("readShopManualCardChecks")
	@ApiOperation({ operationId: "readShopManualCardChecks", description: "A shop owner's «استعلام دستی» history, newest first." })
	@ApiBody({ type: ReadShopManualCardChecksInput })
	@ApiResponse({ type: ReadManualCardChecksOutput, status: 200 })
	readShopManualCardChecks(@Body() input: ReadShopManualCardChecksInput): Promise<ReadManualCardChecksOutput> {
		return this.customer.readManualCardChecks(input.shopId, input.page)
	}
}
