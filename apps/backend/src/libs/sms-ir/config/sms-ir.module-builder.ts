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
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder<SmsIrConfig>()
	.build()
