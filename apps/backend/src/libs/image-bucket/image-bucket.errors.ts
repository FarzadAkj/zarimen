import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "~/common/constants"
import { defineErrorList } from "~/libs/error/classes/global-error"

export const ImageBucketErrors = defineErrorList(ModuleNames.ImageBucket, {
	UnsupportedImage: { statusCode: HttpStatus.BAD_REQUEST },
	ImageTooLarge: { statusCode: HttpStatus.BAD_REQUEST },
	/** arvanAccessKey / arvanSecretKey are empty. */
	NotConfigured: { statusCode: HttpStatus.SERVICE_UNAVAILABLE },
})
