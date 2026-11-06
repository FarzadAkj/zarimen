import { ConfigurableModuleBuilder } from "@nestjs/common"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder<ZarinpalConfig>()
	.build()

export type ZarinpalConfig = {
	merchantId: string
	/** Gateway base url; production by default, `https://sandbox.zarinpal.com` for testing. */
	baseUrl?: string
}
