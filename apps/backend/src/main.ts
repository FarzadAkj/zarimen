import type { NestFastifyApplication } from "@nestjs/platform-fastify"
import { NestFactory } from "@nestjs/core"
import { FastifyAdapter } from "@nestjs/platform-fastify"
import { setupCors, setupGlobalHttpValidation, setupShutdownHooks, setupSwagger } from "~/libs/helper/app-hooks"
import { AppModule } from "./app.module"
import { SoftwareName } from "./common/constants"
import { Config } from "./config"
import { logger } from "./libs/logger"
import "reflect-metadata"

process.title = SoftwareName

export async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
		// Errors and warnings only; with `false` a failed startup exits 1 without a message.
		logger: ["error", "warn"],
		abortOnError: false,
		forceCloseConnections: true,
	})
	const config = app.get(Config)

	setupShutdownHooks(app)
	setupGlobalHttpValidation(app, config.NODE_ENV)
	setupSwagger(app, {
		env: config.NODE_ENV,
		swaggerApiDocPath: config.swaggerApiDocPath,
		swaggerApiPath: config.swaggerApiPath,
	})
	setupCors(app)

	await app.listen(Number(config.serverPort), "0.0.0.0")
	logger.ready(`Listening on :${config.serverPort}`)

	return app
}

bootstrap()
