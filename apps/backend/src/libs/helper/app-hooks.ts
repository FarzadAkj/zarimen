import type { INestApplication } from "@nestjs/common"
import type { NestFastifyApplication } from "@nestjs/platform-fastify"
import type { IncomingMessage, ServerResponse } from "node:http"
import { ValidationPipe } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { NodeEnvType } from "~/config"
import { ErrorExceptionFilter } from "~/libs/error/error.filter"

export function setupCors(app: INestApplication) {
	app.enableCors()
}

export function setupGlobalHttpValidation(app: NestFastifyApplication, nodeEnv: NodeEnvType) {
	const isDev = nodeEnv === NodeEnvType.Development
	app.useGlobalFilters(new ErrorExceptionFilter(nodeEnv))
	app.useGlobalPipes(new ValidationPipe({
		stopAtFirstError: !isDev,
		whitelist: true,
		transform: true,
	}))
}

export function setupShutdownHooks(app: NestFastifyApplication) {
	app.enableShutdownHooks()
}

type SwaggerConfig = {
	swaggerApiPath: string
	swaggerApiDocPath: string
	env: NodeEnvType
}

/**
 * Swagger UI at `swaggerApiPath`, raw JSON at `swaggerApiDocPath`.
 * The frontend generates its typed client from the JSON (`pnpm --filter @zar-imen/frontend api`).
 */
export function setupSwagger(app: INestApplication, config: SwaggerConfig) {
	if (config.env === NodeEnvType.Production)
		return

	const documentBuilder = new DocumentBuilder()
		.setTitle("Zar Imen APIs")
		.setVersion("1.0")
		.addBearerAuth()
		.build()

	const document = SwaggerModule.createDocument(app, documentBuilder)
	SwaggerModule.setup(config.swaggerApiPath, app, document)
	app.use(config.swaggerApiDocPath, (_req: IncomingMessage, res: ServerResponse) => {
		res.setHeader("Content-Type", "application/json")
		res.end(JSON.stringify(document))
	})

	return document
}
