import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "~/common/constants"
import { defineErrorList } from "~/libs/error/classes/global-error"

export const AuthErrors = defineErrorList(ModuleNames.AuthModule, {
	/** The phone number is not the admin's. */
	NotAdmin: { statusCode: HttpStatus.FORBIDDEN },
	/** No shop has this subdomain. */
	ShopNotFound: { statusCode: HttpStatus.NOT_FOUND },
	/** The admin has disabled the shop; its owner cannot log in. */
	ShopDisabled: { statusCode: HttpStatus.FORBIDDEN },
	/** The phone number is not the shop owner's. */
	NotShopOwner: { statusCode: HttpStatus.FORBIDDEN },
	/** A usable code was sent less than OTP_TTL ago. */
	OtpAlreadySent: { statusCode: HttpStatus.TOO_MANY_REQUESTS },
	OtpIsNotValid: { statusCode: HttpStatus.BAD_REQUEST },
	SmsFailure: { statusCode: HttpStatus.SERVICE_UNAVAILABLE },
	/** Missing, invalid or expired token. */
	Unauthorized: { statusCode: HttpStatus.UNAUTHORIZED },
})
