import { createConsola } from "consola"
import { SoftwareName } from "~/common/constants"

export function createLogger() {
	return createConsola().withTag(SoftwareName)
}

export const logger = createLogger()
