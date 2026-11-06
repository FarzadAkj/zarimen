import type { HttpStatus } from "@nestjs/common"

export type ErrorInfo = {
	moduleName: string
	errList: ErrorInfoItem[]
}

/**
 * The Error Information Type
 */
export type ErrorInfoItem = {
	statusCode?: HttpStatus
}

/**
 * The Error Information Type
 */
export type FullErrorInfo = {
	message: string
	module: string
	statusCode?: HttpStatus
}

/**
 * This type used for the object that collects all the errors
 */
export type TranslationMapRecordType = Record<string, ErrorUnit>
export type ErrorUnit = {
	[key: number]: FullErrorInfo
}

/**
 * Used for creating new error
 */
export type ErrorType = {
	message: string
	module?: string
	statusCode?: number
	timestamp: string
	path: string
	debugError?: Error
	errorCode?: string
}
