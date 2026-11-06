import type { ShopOwnerRequest } from "../auth/guards/is-shop-owner.guard"
import { Body, Controller, Get, Post, Query, Redirect, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { ReadShopWalletTransactionsInput, ReadWalletTransactionsInput } from "./dto/read-wallet-transactions.input"
import { StartWalletTopUpInput } from "./dto/start-wallet-top-up.input"
import { TopUpCallbackQuery } from "./dto/top-up-callback.query"
import { WalletTopUpModel } from "./model/wallet-top-up.model"
import { ReadWalletTransactionsOutput } from "./model/wallet-transaction.model"
import { WalletService } from "./wallet.service"

/** Zarinpal's return url (`zarinpalCallbackUrl`). The owner's browser lands here, not on the frontend. */
@Controller("wallet")
export class WalletCallbackController {
	constructor(private wallet: WalletService) { }

	@Get("topUpCallback")
	@Redirect()
	@ApiOperation({ operationId: "walletTopUpCallback", description: "Verifies the top-up, credits the wallet, then 302s to <shopSiteUrl>/panel/wallet?topUp=success&amount=&refId= or ?topUp=failed&reason=" })
	@ApiQuery({ name: "Authority", type: String })
	@ApiQuery({ name: "Status", type: String, required: false, enum: ["OK", "NOK"] })
	@ApiResponse({ status: 302, description: "Redirect to the shop's wallet page" })
	async topUpCallback(@Query() query: TopUpCallbackQuery) {
		return { url: await this.wallet.handleTopUpCallback(query.Authority, query.Status), statusCode: 302 }
	}
}

/** The shop owner's wallet (<subdomain>.zarimen.ir/panel/wallet). */
@UseGuards(IsShopOwner)
@ApiBearerAuth()
@Controller("shop-panel")
export class ShopWalletController {
	constructor(private wallet: WalletService) { }

	@Post("startWalletTopUp")
	@ApiOperation({ operationId: "startWalletTopUp", description: "Returns the Zarinpal url to add `amount` Tomans to the owner's wallet." })
	@ApiBody({ type: StartWalletTopUpInput })
	@ApiResponse({ type: WalletTopUpModel, status: 200 })
	startWalletTopUp(@Req() request: ShopOwnerRequest, @Body() input: StartWalletTopUpInput): Promise<WalletTopUpModel> {
		return this.wallet.startTopUp(request._shopOwner.shopId, input.amount)
	}

	@Post("readMyWalletTransactions")
	@ApiOperation({ operationId: "readMyWalletTransactions" })
	@ApiBody({ type: ReadWalletTransactionsInput })
	@ApiResponse({ type: ReadWalletTransactionsOutput, status: 200 })
	readMyWalletTransactions(@Req() request: ShopOwnerRequest, @Body() input: ReadWalletTransactionsInput): Promise<ReadWalletTransactionsOutput> {
		return this.wallet.readTransactions(request._shopOwner.shopId, input.page)
	}
}

/** The admin looking at one shop (zarimen.ir/panel/customers/<subdomain>). */
@UseGuards(IsAdmin)
@ApiBearerAuth()
@Controller("shop")
export class AdminShopWalletController {
	constructor(private wallet: WalletService) { }

	@Post("readShopWalletTransactions")
	@ApiOperation({ operationId: "readShopWalletTransactions" })
	@ApiBody({ type: ReadShopWalletTransactionsInput })
	@ApiResponse({ type: ReadWalletTransactionsOutput, status: 200 })
	readShopWalletTransactions(@Body() input: ReadShopWalletTransactionsInput): Promise<ReadWalletTransactionsOutput> {
		return this.wallet.readTransactions(input.shopId, input.page)
	}
}
