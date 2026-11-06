import type { DynamicModule, ModuleMetadata, Provider } from "@nestjs/common"
import { plainToInstance } from "class-transformer"
import { validateSync } from "class-validator"
import defu from "defu"

export type ConfigModuleMetadata = ModuleMetadata & {
    config?: Record<string, unknown>
}

export type ConfigModuleAsyncMetadata = ModuleMetadata & {
    useFactory: (...args: unknown[]) => Promise<Record<string, unknown>> | Record<string, unknown>
    inject?: any[]
}

export class ConfigModule {
    static forRoot<T extends object>(
        configClass: new () => T,
        metadata: ConfigModuleMetadata = {},
    ): DynamicModule {
        const configInstance = plainToInstance(configClass, metadata.config || {})
        const errors = validateSync(configInstance, { whitelist: true })

        if (errors.length)
            throw new Error(`Config validation failed: ${errors}`)

        const configProvider: Provider = {
            provide: configClass,
            useValue: configInstance,
        }

        const mandatoryOptions: ModuleMetadata = {
            providers: [configProvider],
            exports: [configProvider],
        }

        const moduleOptions: ModuleMetadata = defu(metadata, mandatoryOptions)

        return {
            global: true,
            module: ConfigModule,
            ...moduleOptions,
        }
    }

    static forRootAsync<T extends object>(
        configClass: new () => T,
        metadata: ConfigModuleAsyncMetadata,
    ): DynamicModule {
        const configProvider: Provider = {
            provide: configClass,
            useFactory: async (...args: unknown[]) => {
                const configValues = await metadata.useFactory(...args)
                const instance = plainToInstance(configClass, configValues)
                const errors = validateSync(instance, { whitelist: true })
                if (errors.length)
                    throw new Error(`Config validation failed: ${errors}`)
                return instance
            },
            inject: metadata.inject || [],
        }

        const mandatoryOptions: ModuleMetadata = {
            providers: [configProvider],
            exports: [configProvider],
        }

        const moduleOptions: ModuleMetadata = defu(metadata, mandatoryOptions)

        return {
            global: true,
            module: ConfigModule,
            ...moduleOptions,
        }
    }
}
