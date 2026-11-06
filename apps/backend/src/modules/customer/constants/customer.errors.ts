import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "~/common/constants"
import { defineErrorList } from "~/libs/error/classes/global-error"

export const CustomerErrors = defineErrorList(ModuleNames.CustomerModule, {
	ShopNotFound: { statusCode: HttpStatus.NOT_FOUND },
	ShopDisabled: { statusCode: HttpStatus.FORBIDDEN },
	/** The shop has no running subscription; its customers cannot use it. */
	SubscriptionInactive: { statusCode: HttpStatus.FORBIDDEN },
	/** Shahkar: the phone is not registered under the national code. */
	PhoneNationalCodeMismatch: { statusCode: HttpStatus.BAD_REQUEST },
	/** CardMatch: the card does not belong to the national code + birth date. */
	CardNotOwned: { statusCode: HttpStatus.BAD_REQUEST },
	IdentityServiceUnavailable: { statusCode: HttpStatus.SERVICE_UNAVAILABLE },
	/** The national code is registered with a different birth date. */
	BirthDateMismatch: { statusCode: HttpStatus.BAD_REQUEST },
	/** Phase 2 came too late (or with a forged ticket); start again from phase 1. */
	SignupExpired: { statusCode: HttpStatus.BAD_REQUEST },
	/** Login with a phone no customer has. */
	NotRegistered: { statusCode: HttpStatus.NOT_FOUND },
	CardAlreadyAdded: { statusCode: HttpStatus.CONFLICT },
	/** No such customer among the shop's customers. */
	CustomerNotFound: { statusCode: HttpStatus.NOT_FOUND },
})
