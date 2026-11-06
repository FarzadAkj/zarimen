import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "~/common/constants"
import { defineErrorList } from "~/libs/error/classes/global-error"

export const ShopErrors = defineErrorList(ModuleNames.ShopModule, {
	NotFound: { statusCode: HttpStatus.NOT_FOUND },
	SubdomainTaken: { statusCode: HttpStatus.CONFLICT },
	/** Shahkar: the owner's phone is not registered under the owner's national code. */
	PhoneNationalCodeMismatch: { statusCode: HttpStatus.BAD_REQUEST },
	IdentityServiceUnavailable: { statusCode: HttpStatus.SERVICE_UNAVAILABLE },
})
