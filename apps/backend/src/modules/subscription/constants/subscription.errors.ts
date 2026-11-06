import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "~/common/constants"
import { defineErrorList } from "~/libs/error/classes/global-error"

export const SubscriptionErrors = defineErrorList(ModuleNames.SubscriptionModule, {
	/** No such plan, or the admin disabled it. */
	PlanNotFound: { statusCode: HttpStatus.NOT_FOUND },
	/** Zarinpal refused the payment request. */
	GatewayError: { statusCode: HttpStatus.BAD_GATEWAY },
	GatewayUnavailable: { statusCode: HttpStatus.SERVICE_UNAVAILABLE },
	/** The callback named a payment this app never started. */
	PurchaseNotFound: { statusCode: HttpStatus.NOT_FOUND },
})
