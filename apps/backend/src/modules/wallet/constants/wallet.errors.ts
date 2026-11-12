import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "~/common/constants"
import { defineErrorList } from "~/libs/error/classes/global-error"

export const WalletErrors = defineErrorList(ModuleNames.WalletModule, {
	/** The shop's wallet cannot pay for the request; nothing was run. */
	InsufficientBalance: { statusCode: HttpStatus.PAYMENT_REQUIRED },
	/** SePal refused the payment request. */
	GatewayError: { statusCode: HttpStatus.BAD_GATEWAY },
	/** SePal could not be reached. */
	GatewayUnavailable: { statusCode: HttpStatus.SERVICE_UNAVAILABLE },
	/** The callback named a payment this app never started. */
	TopUpNotFound: { statusCode: HttpStatus.NOT_FOUND },
})
