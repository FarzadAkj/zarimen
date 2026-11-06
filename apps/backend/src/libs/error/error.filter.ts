import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common"
import type { FastifyReply, FastifyRequest } from "fastify"
import type { ErrorType } from "./error.types"
import { Catch, HttpException, HttpStatus } from "@nestjs/common"
import { NodeEnvType } from "~/config"
import { CommonErrors } from "~/libs/errors"
import { logger } from "../logger"
import { GlobalError } from "./classes/global-error"

@Catch()
export class ErrorExceptionFilter implements ExceptionFilter {
	constructor(private nodeEnv: NodeEnvType) { }

	catch(exception: unknown, host: ArgumentsHost) {
		const productMode = this.nodeEnv === NodeEnvType.Production
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<FastifyReply>()
		const request = ctx.getRequest<FastifyRequest>()

		const errorData: Partial<ErrorType> = {
			path: request.url,
			message: undefined,
			timestamp: new Date().toISOString(),
			errorCode: CommonErrors.UnknownServerError.message,
		}

		/**
		 * Parsing error
		 */
		if (exception instanceof GlobalError) {
			errorData.message = `${exception.errorContext.module}:${exception.errorContext.message}`
			errorData.errorCode = exception.errorContext.message
			errorData.statusCode = exception.errorContext.statusCode
			errorData.debugError = exception.error
			errorData.module = exception.errorContext.module
		}
		else if (exception instanceof HttpException) {
			errorData.message = exception.message
			errorData.statusCode = exception.getStatus()
			errorData.debugError = exception
		}
		else if (exception instanceof Error) {
			errorData.message = exception.message
			errorData.statusCode = (exception as any).status || HttpStatus.INTERNAL_SERVER_ERROR
			errorData.debugError = exception
		}
		else if (typeof exception == "string") {
			errorData.message = exception
			errorData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
			errorData.debugError = new Error(exception, { cause: exception })
		}
		else {
			errorData.message = exception as string
			errorData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
			errorData.debugError = new Error(errorData.message, { cause: exception })
		}

		if (productMode) {
			delete errorData.debugError
		}

		if (errorData.statusCode !== HttpStatus.NOT_FOUND) {
			logger.error(exception)
		}
		else {
			logger.silent(`Ignored a ${HttpStatus.NOT_FOUND} Error`)
		}

		response.status(errorData.statusCode!)
		response.send(errorData)
	}
}
