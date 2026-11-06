import type { DynamicModule } from "@nestjs/common"
import type { ASYNC_OPTIONS_TYPE } from "./config/zarinpal.module-builder"
import { ConfigurableModuleClass } from "./config/zarinpal.module-builder"
import { ZarinpalService } from "./zarinpal.service"

export class ZarinpalModule extends ConfigurableModuleClass {
	static override registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
		const moduleOptions = super.registerAsync(options)

		return {
			...moduleOptions,
			global: true,
			providers: [...(moduleOptions.providers ?? []), ZarinpalService],
			exports: [ZarinpalService],
		}
	}
}
