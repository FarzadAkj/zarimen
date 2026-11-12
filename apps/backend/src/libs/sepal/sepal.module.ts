import type { DynamicModule } from "@nestjs/common"
import type { ASYNC_OPTIONS_TYPE } from "./config/sepal.module-builder"
import { ConfigurableModuleClass } from "./config/sepal.module-builder"
import { SepalService } from "./sepal.service"

export class SepalModule extends ConfigurableModuleClass {
	static override registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
		const moduleOptions = super.registerAsync(options)

		return {
			...moduleOptions,
			global: true,
			providers: [...(moduleOptions.providers ?? []), SepalService],
			exports: [SepalService],
		}
	}
}
