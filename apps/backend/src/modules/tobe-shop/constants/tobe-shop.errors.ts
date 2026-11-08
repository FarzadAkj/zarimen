import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "~/common/constants"
import { defineErrorList } from "~/libs/error/classes/global-error"

export const TobeShopErrors = defineErrorList(ModuleNames.TobeShopModule, {
	TobeShopNotFound: { statusCode: HttpStatus.NOT_FOUND },
	/** The action needs another status (e.g. checking a request that is no longer PENDING). */
	TobeShopWrongStatus: { statusCode: HttpStatus.BAD_REQUEST },
	/** The same request is being checked right now (double click). */
	TobeShopBusy: { statusCode: HttpStatus.CONFLICT },
	SmsAlreadySent: { statusCode: HttpStatus.BAD_REQUEST },
	SmsFailure: { statusCode: HttpStatus.BAD_GATEWAY },
	/** Too many requests / uploads from one IP. */
	TooManyRequests: { statusCode: HttpStatus.TOO_MANY_REQUESTS },
	InvalidLogo: { statusCode: HttpStatus.BAD_REQUEST },
})
