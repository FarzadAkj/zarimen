import type { ShopOwnerRequest } from "../auth/guards/is-shop-owner.guard"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { HasActiveSubscription } from "../subscription/guards/has-active-subscription.guard"
import { CustomerService } from "./customer.service"
import { CheckCardManuallyInput } from "./dto/check-card-manually.input"
import { ReadManualCardChecksInput } from "./dto/read-manual-card-checks.input"
import { ReadMyCustomerCardsInput } from "./dto/read-my-customer-cards.input"
import { ReadMyCustomersInput } from "./dto/read-my-customers.input"
import { ManualCardCheckModel, ReadManualCardChecksOutput } from "./model/manual-card-check.model"
import { ShopCustomerCardModel, ShopCustomerModel } from "./model/shop-customer.model"

/** The shop owner's view of their customers (<subdomain>.zarimen.ir/panel); needs a running subscription. */
@UseGuards(IsShopOwner, HasActiveSubscription)
@ApiBearerAuth()
@Controller("shop-panel")
export class ShopCustomersController {
	constructor(private customer: CustomerService) { }

	@Post("readMyCustomers")
	@ApiOperation({ operationId: "readMyCustomers", description: "Customers who verified at the owner's shop, optionally filtered by national code / mobile digits." })
	@ApiBody({ type: ReadMyCustomersInput })
	@ApiResponse({ type: ShopCustomerModel, isArray: true, status: 200 })
	readMyCustomers(@Req() request: ShopOwnerRequest, @Body() input: ReadMyCustomersInput): Promise<ShopCustomerModel[]> {
		return this.customer.readShopCustomers(request._shopOwner.shopId, input.search)
	}

	@Post("readMyCustomerCards")
	@ApiOperation({ operationId: "readMyCustomerCards", description: "Full card numbers of one of the owner's customers." })
	@ApiBody({ type: ReadMyCustomerCardsInput })
	@ApiResponse({ type: ShopCustomerCardModel, isArray: true, status: 200 })
	readMyCustomerCards(@Req() request: ShopOwnerRequest, @Body() input: ReadMyCustomerCardsInput): Promise<ShopCustomerCardModel[]> {
		return this.customer.readShopCustomerCards(request._shopOwner.shopId, input.customerId)
	}

	@Post("checkCardManually")
	@ApiOperation({ operationId: "checkCardManually", description: "Manual inquiry: CardMatch for a national code + birth date + card, paid from the shop's wallet. Kept in the shop's manual-check history." })
	@ApiBody({ type: CheckCardManuallyInput })
	@ApiResponse({ type: ManualCardCheckModel, status: 200 })
	checkCardManually(@Req() request: ShopOwnerRequest, @Body() input: CheckCardManuallyInput): Promise<ManualCardCheckModel> {
		return this.customer.checkCardManually(request._shopOwner.shopId, input)
	}

	@Post("readMyManualCardChecks")
	@ApiOperation({ operationId: "readMyManualCardChecks", description: "The owner's «استعلام دستی» history, newest first." })
	@ApiBody({ type: ReadManualCardChecksInput })
	@ApiResponse({ type: ReadManualCardChecksOutput, status: 200 })
	readMyManualCardChecks(@Req() request: ShopOwnerRequest, @Body() input: ReadManualCardChecksInput): Promise<ReadManualCardChecksOutput> {
		return this.customer.readManualCardChecks(request._shopOwner.shopId, input.page)
	}
}
