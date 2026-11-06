import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsInt, Max, Min } from "class-validator"
import { IMAGE_MAX_BYTES, ImageContentType } from "~/libs/image-bucket/image-bucket.service"

export class CreateImageUploadInput {
	@ApiProperty({ enum: ImageContentType, enumName: "ImageContentType" })
	@IsEnum(ImageContentType)
	contentType!: ImageContentType

	/** File size in bytes; the upload must be exactly this size. */
	@ApiProperty({ type: Number })
	@IsInt()
	@Min(1)
	@Max(IMAGE_MAX_BYTES)
	size!: number
}
