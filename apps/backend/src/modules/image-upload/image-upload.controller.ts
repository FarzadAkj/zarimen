import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { ImageBucketService } from "~/libs/image-bucket/image-bucket.service"
import { IsAdmin } from "../auth/guards/is-admin.guard"
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
