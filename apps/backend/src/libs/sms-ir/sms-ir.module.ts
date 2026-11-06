import type { DynamicModule } from "@nestjs/common"
import type { ASYNC_OPTIONS_TYPE } from "./config/sms-ir.module-builder"
import { ConfigurableModuleClass } from "./config/sms-ir.module-builder"
import { SmsIrService } from "./sms-ir.service"

export class SmsIrModule extends ConfigurableModuleClass {
	static override registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
		const moduleOptions = super.registerAsync(options)

		return {
			...moduleOptions,
			global: true,
			providers: [...(moduleOptions.providers ?? []), SmsIrService],
			exports: [SmsIrService],
		}
	}
}
