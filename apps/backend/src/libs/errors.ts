import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "~/common/constants"
import { defineErrorList } from "~/libs/error/classes/global-error"

export const CommonErrors = defineErrorList(ModuleNames.Common, {
	UnknownServerError: {
		statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
	},
})
