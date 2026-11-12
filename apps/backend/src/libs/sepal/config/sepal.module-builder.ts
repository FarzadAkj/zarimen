import { ConfigurableModuleBuilder } from "@nestjs/common"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder<SepalConfig>()
	.build()

export type SepalConfig = {
	apiKey: string
	/** Gateway base url; https://payment.sepal.ir by default. */
	baseUrl?: string
}
