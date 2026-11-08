import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { ImageBucketService } from "~/libs/image-bucket/image-bucket.service"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { CreateImageUploadInput } from "./dto/create-image-upload.input"
import { CreateImageUploadOutput } from "./dto/create-image-upload.output"

@Controller("image-upload")
export class ImageUploadController {
	constructor(private images: ImageBucketService) { }

	/** Returns a presigned URL the panel uploads one image to, straight to the bucket. */
	@UseGuards(IsAdmin)
	@ApiBearerAuth()
	@Post("createImageUpload")
	@ApiOperation({ operationId: "createImageUpload" })
	@ApiBody({ type: CreateImageUploadInput })
	@ApiResponse({ type: CreateImageUploadOutput, status: 200 })
	createImageUpload(@Body() input: CreateImageUploadInput): CreateImageUploadOutput {
		return this.images.createUpload(input.contentType, input.size)
	}
}

/** Same as createImageUpload, for shop owners (photos in their tickets). */
@UseGuards(IsShopOwner)
@ApiBearerAuth()
@Controller("shop-panel")
export class ShopImageUploadController {
	constructor(private images: ImageBucketService) { }

	@Post("createMyImageUpload")
	@ApiOperation({ operationId: "createMyImageUpload" })
	@ApiBody({ type: CreateImageUploadInput })
	@ApiResponse({ type: CreateImageUploadOutput, status: 200 })
	createMyImageUpload(@Body() input: CreateImageUploadInput): CreateImageUploadOutput {
		return this.images.createUpload(input.contentType, input.size)
	}
}
