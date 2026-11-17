import { ConfigurableModuleBuilder } from "@nestjs/common"

export type SmsIrConfig = {
	secret: string
	sendSms: boolean
	/** sms.ir "verify" template id of the OTP message. */
	otpTemplate: string
	/** Sender line of plain-text bulk messages. */
	lineNumber: string
	/** sms.ir "verify" template ids of the shop-request messages (see Config). */
	shopRejectedTemplate: string
	shopWelcomeTemplate: string
	/** Tells a shop owner one of their customers added a card. */
	cardAddedTemplate: string
	/** Tells a shop owner an admin wrote in one of their tickets. */
	ticketAnsweredTemplate: string
	/** Tells a shop owner an admins' notice arrived (TITLE parameter). */
	noticeTemplate: string
	/** Sends the shop owner the code that approves a customer's paid check (CODE parameter). */
	ownerApprovalTemplate: string
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder<SmsIrConfig>()
	.build()
