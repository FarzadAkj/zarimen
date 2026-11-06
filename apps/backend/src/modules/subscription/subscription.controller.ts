import type { ShopOwnerRequest } from "../auth/guards/is-shop-owner.guard"
import { Body, Controller, Get, Post, Query, Redirect, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { ReadWalletTransactionsInput } from "../wallet/dto/read-wallet-transactions.input"
import { TopUpCallbackQuery } from "../wallet/dto/top-up-callback.query"
import { SetShopSubscriptionEndInput } from "./dto/set-subscription-end.input"
import { CreateSubscriptionPlanInput, SetSubscriptionPlanActiveInput, StartSubscriptionPurchaseInput } from "./dto/subscription-plan.input"
import { MySubscriptionModel, ReadSubscriptionPurchasesOutput, SubscriptionPlanModel, SubscriptionPurchaseStartedModel } from "./model/subscription.model"
import { SubscriptionService } from "./subscription.service"

/** Plans, on the admin's settings page. */
@UseGuards(IsAdmin)
@ApiBearerAuth()
@Controller("setting")
export class SubscriptionPlanController {
	constructor(private subscription: SubscriptionService) { }

	@Post("readSubscriptionPlans")
	@ApiOperation({ operationId: "readSubscriptionPlans", description: "All plans, disabled included." })
	@ApiResponse({ type: SubscriptionPlanModel, isArray: true, status: 200 })
	readSubscriptionPlans(): Promise<SubscriptionPlanModel[]> {
		return this.subscription.readPlans(false)
	}

	@Post("createSubscriptionPlan")
	@ApiOperation({ operationId: "createSubscriptionPlan" })
	@ApiBody({ type: CreateSubscriptionPlanInput })
	@ApiResponse({ type: SubscriptionPlanModel, status: 200 })
	createSubscriptionPlan(@Body() input: CreateSubscriptionPlanInput): Promise<SubscriptionPlanModel> {
		return this.subscription.createPlan(input)
	}

	@Post("setSubscriptionPlanActive")
	@ApiOperation({ operationId: "setSubscriptionPlanActive", description: "Disabled plans are no longer offered; past purchases keep them." })
	@ApiBody({ type: SetSubscriptionPlanActiveInput })
	@ApiResponse({ type: SubscriptionPlanModel, status: 200 })
	setSubscriptionPlanActive(@Body() input: SetSubscriptionPlanActiveInput): Promise<SubscriptionPlanModel> {
		return this.subscription.setPlanActive(input.id, input.isActive)
	}
}

/** The admin changing one shop's subscription (shops table / zarimen.ir/panel/customers/<subdomain>). */
@UseGuards(IsAdmin)
@ApiBearerAuth()
@Controller("shop")
export class AdminShopSubscriptionController {
	constructor(private subscription: SubscriptionService) { }

	@Post("setShopSubscriptionEnd")
	@ApiOperation({ operationId: "setShopSubscriptionEnd", description: "Moves the shop's subscription end later (never earlier than the current end or now)." })
	@ApiBody({ type: SetShopSubscriptionEndInput })
	@ApiResponse({ type: MySubscriptionModel, status: 200 })
	setShopSubscriptionEnd(@Body() input: SetShopSubscriptionEndInput): Promise<MySubscriptionModel> {
		return this.subscription.setSubscriptionEnd(input.shopId, new Date(input.endsAt))
	}
}

/** The owner's subscription (<subdomain>.zarimen.ir/panel/subscription). */
@UseGuards(IsShopOwner)
@ApiBearerAuth()
@Controller("shop-panel")
export class ShopSubscriptionController {
	constructor(private subscription: SubscriptionService) { }

	@Post("readAvailablePlans")
	@ApiOperation({ operationId: "readAvailablePlans", description: "Plans the owner can buy." })
	@ApiResponse({ type: SubscriptionPlanModel, isArray: true, status: 200 })
	readAvailablePlans(): Promise<SubscriptionPlanModel[]> {
		return this.subscription.readPlans(true)
	}

	@Post("readMySubscription")
	@ApiOperation({ operationId: "readMySubscription" })
	@ApiResponse({ type: MySubscriptionModel, status: 200 })
	readMySubscription(@Req() request: ShopOwnerRequest): Promise<MySubscriptionModel> {
		return this.subscription.readMySubscription(request._shopOwner.shopId)
	}

	@Post("readMySubscriptionPurchases")
	@ApiOperation({ operationId: "readMySubscriptionPurchases" })
	@ApiBody({ type: ReadWalletTransactionsInput })
	@ApiResponse({ type: ReadSubscriptionPurchasesOutput, status: 200 })
	readMySubscriptionPurchases(@Req() request: ShopOwnerRequest, @Body() input: ReadWalletTransactionsInput): Promise<ReadSubscriptionPurchasesOutput> {
		return this.subscription.readPurchases(request._shopOwner.shopId, input.page)
	}

	@Post("startSubscriptionPurchase")
	@ApiOperation({ operationId: "startSubscriptionPurchase", description: "Returns the Zarinpal url to pay for the plan." })
	@ApiBody({ type: StartSubscriptionPurchaseInput })
	@ApiResponse({ type: SubscriptionPurchaseStartedModel, status: 200 })
	startSubscriptionPurchase(@Req() request: ShopOwnerRequest, @Body() input: StartSubscriptionPurchaseInput): Promise<SubscriptionPurchaseStartedModel> {
		return this.subscription.startPurchase(request._shopOwner.shopId, input.planId)
	}
}

/** Zarinpal's return url for subscription payments (the owner's browser lands here), and the public plan list. */
@Controller("subscription")
export class SubscriptionCallbackController {
	constructor(private subscription: SubscriptionService) { }

	@Post("readPublicPlans")
	@ApiOperation({ operationId: "readPublicPlans", description: "Public: the active plans, for the zarimen.ir landing page." })
	@ApiResponse({ type: SubscriptionPlanModel, isArray: true, status: 200 })
	readPublicPlans(): Promise<SubscriptionPlanModel[]> {
		return this.subscription.readPlans(true)
	}

	@Get("purchaseCallback")
	@Redirect()
	@ApiOperation({ operationId: "subscriptionPurchaseCallback", description: "Verifies the payment, extends the subscription, then 302s to <shopSiteUrl>/panel/subscription?purchase=success&plan=&endsAt=&refId= or ?purchase=failed&reason=" })
	@ApiQuery({ name: "Authority", type: String })
	@ApiQuery({ name: "Status", type: String, required: false, enum: ["OK", "NOK"] })
	@ApiResponse({ status: 302, description: "Redirect to the shop's subscription page" })
	async purchaseCallback(@Query() query: TopUpCallbackQuery) {
		return { url: await this.subscription.handlePurchaseCallback(query.Authority, query.Status), statusCode: 302 }
	}
}
