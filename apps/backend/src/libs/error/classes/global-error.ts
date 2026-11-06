import type { ErrorInfoItem, FullErrorInfo } from "../error.types"

/**
 * Create new error exception for Override Project Errors
 */
export class GlobalError extends Error {
	constructor(public errorContext: FullErrorInfo, public error?: Error) {
		const message = `${errorContext.module}:${errorContext.message}`
		super(message, { cause: error })
	}
}

export function defineErrorList<T extends Record<string, ErrorInfoItem>>(moduleName: string, input: T) {
	// @ts-expect-error ts-limitation
	const output: Record<Partial<keyof T>, FullErrorInfo> = {}
	const entries = Object.entries(input)

	for (const [key, value] of entries) {
		// @ts-expect-error ts-limitation
		output[key] = {
			message: key,
			statusCode: value.statusCode,
			module: moduleName,
		}
	}

	return output
}
