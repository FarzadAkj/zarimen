import type { FastifyRequest } from "fastify"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { clientIp } from "~/libs/rate-limit/rate-limiter"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { CreateImageUploadInput } from "../image-upload/dto/create-image-upload.input"
import { CreateImageUploadOutput } from "../image-upload/dto/create-image-upload.output"
import { CheckAndInsertTobeShopInput, ReadTobeShopsInput, SendTobeShopSmsInput, SubmitTobeShopInput, TobeShopIdInput } from "./dto/tobe-shop.input"
import { ReadTobeShopsOutput, SubmitTobeShopOutput, TobeShopModel } from "./model/tobe-shop.model"
import { TobeShopService } from "./tobe-shop.service"

/** Public: zarimen.ir/signup. Called from the browser, so the IP limits see the visitor. */
@Controller("tobe-shop")
export class PublicTobeShopController {
	constructor(private tobeShops: TobeShopService) { }

	@Post("submitTobeShop")
	@ApiOperation({ operationId: "submitTobeShop", description: "Saved (and the admins texted) only when no existing shop has the subdomain, national code or mobile." })
	@ApiBody({ type: SubmitTobeShopInput })
	@ApiResponse({ type: SubmitTobeShopOutput, status: 200 })
	submitTobeShop(@Body() input: SubmitTobeShopInput, @Req() request: FastifyRequest): Promise<SubmitTobeShopOutput> {
		return this.tobeShops.submit(input, clientIp(request))
	}

	@Post("createTobeShopLogoUpload")
	@ApiOperation({ operationId: "createTobeShopLogoUpload", description: "Presigned upload for the form's logo, limited per IP." })
	@ApiBody({ type: CreateImageUploadInput })
	@ApiResponse({ type: CreateImageUploadOutput, status: 200 })
	createTobeShopLogoUpload(@Body() input: CreateImageUploadInput, @Req() request: FastifyRequest): CreateImageUploadOutput {
		return this.tobeShops.createLogoUpload(input.contentType, input.size, clientIp(request))
	}
}

/** The admins' side: zarimen.ir/panel/requests. */
@UseGuards(IsAdmin)
@ApiBearerAuth()
@Controller("tobe-shop")
export class TobeShopController {
	constructor(private tobeShops: TobeShopService) { }

	@Post("readTobeShops")
	@ApiOperation({ operationId: "readTobeShops", description: "Newest first, optionally one status only." })
	@ApiBody({ type: ReadTobeShopsInput })
	@ApiResponse({ type: ReadTobeShopsOutput, status: 200 })
	readTobeShops(@Body() input: ReadTobeShopsInput): Promise<ReadTobeShopsOutput> {
		return this.tobeShops.readTobeShops(input.status, input.page)
	}

	@Post("checkAndInsertTobeShop")
	@ApiOperation({ operationId: "checkAndInsertTobeShop", description: "Runs the shop checks (Shahkar included): REGISTERED with a new Shop, or CANCELED with `problem`." })
	@ApiBody({ type: CheckAndInsertTobeShopInput })
	@ApiResponse({ type: TobeShopModel, status: 200 })
	checkAndInsertTobeShop(@Body() input: CheckAndInsertTobeShopInput): Promise<TobeShopModel> {
		return this.tobeShops.checkAndInsert(input)
	}

	@Post("cancelTobeShop")
	@ApiOperation({ operationId: "cancelTobeShop" })
	@ApiBody({ type: TobeShopIdInput })
	@ApiResponse({ type: TobeShopModel, status: 200 })
	cancelTobeShop(@Body() input: TobeShopIdInput): Promise<TobeShopModel> {
		return this.tobeShops.cancel(input.id)
	}

	@Post("sendTobeShopSms")
	@ApiOperation({ operationId: "sendTobeShopSms", description: "CANCELED → rejection template (value = INFO); REGISTERED → welcome template (value = SUBDOMAIN). Once per request." })
	@ApiBody({ type: SendTobeShopSmsInput })
	@ApiResponse({ type: TobeShopModel, status: 200 })
	sendTobeShopSms(@Body() input: SendTobeShopSmsInput): Promise<TobeShopModel> {
		return this.tobeShops.sendSms(input.id, input.value)
	}
}
