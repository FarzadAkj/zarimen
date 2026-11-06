import type { AdminRequest } from "./guards/is-admin.guard"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import { ExchangeOtpInput } from "./dto/exchange-otp.input"
import { SendOtpInput } from "./dto/send-otp.input"
import { ExchangeShopOtpInput, SendShopOtpInput } from "./dto/shop-otp.input"
import { IsAdmin } from "./guards/is-admin.guard"
import { MeModel } from "./model/me.model"
import { OtpSentModel } from "./model/otp-sent.model"
import { TokenModel } from "./model/token.model"

@Controller("auth")
export class AuthController {
	constructor(private auth: AuthService) { }

	@Post("sendAdminOtp")
	@ApiOperation({ operationId: "sendAdminOtp", description: "Sends a login code to the admin's phone. Finish with `exchangeAdminOtp`." })
	@ApiBody({ type: SendOtpInput })
	@ApiResponse({ type: OtpSentModel, status: 200 })
	sendAdminOtp(@Body() input: SendOtpInput): Promise<OtpSentModel> {
		return this.auth.sendAdminOtp(input.phoneNumber)
	}

	@Post("exchangeAdminOtp")
	@ApiOperation({ operationId: "exchangeAdminOtp" })
	@ApiBody({ type: ExchangeOtpInput })
	@ApiResponse({ type: TokenModel, status: 200 })
	exchangeAdminOtp(@Body() input: ExchangeOtpInput): Promise<TokenModel> {
		return this.auth.exchangeAdminOtp(input.phoneNumber, input.code)
	}

	@UseGuards(IsAdmin)
	@ApiBearerAuth()
	@Post("me")
	@ApiOperation({ operationId: "me" })
	@ApiResponse({ type: MeModel, status: 200 })
	me(@Req() request: AdminRequest): MeModel {
		return this.auth.toMe(request._admin)
	}

	@Post("sendShopOtp")
	@ApiOperation({ operationId: "sendShopOtp", description: "Sends a login code to the owner of the shop on `subdomain`. Finish with `exchangeShopOtp`." })
	@ApiBody({ type: SendShopOtpInput })
	@ApiResponse({ type: OtpSentModel, status: 200 })
	sendShopOtp(@Body() input: SendShopOtpInput): Promise<OtpSentModel> {
		return this.auth.sendShopOtp(input.subdomain, input.phoneNumber)
	}

	@Post("exchangeShopOtp")
	@ApiOperation({ operationId: "exchangeShopOtp" })
	@ApiBody({ type: ExchangeShopOtpInput })
	@ApiResponse({ type: TokenModel, status: 200 })
	exchangeShopOtp(@Body() input: ExchangeShopOtpInput): Promise<TokenModel> {
		return this.auth.exchangeShopOtp(input.subdomain, input.phoneNumber, input.code)
	}
}
