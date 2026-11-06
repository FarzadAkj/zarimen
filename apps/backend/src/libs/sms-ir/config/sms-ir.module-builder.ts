import { ConfigurableModuleBuilder } from "@nestjs/common"

export type SmsIrConfig = {
	secret: string
	sendSms: boolean
	/** sms.ir "verify" template id of the OTP message. */
	otpTemplate: string
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder<SmsIrConfig>()
	.build()
