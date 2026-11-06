import type { FullErrorInfo } from "./error.types"
import { Injectable } from "@nestjs/common"
import { GlobalError } from "./classes/global-error"

@Injectable()
export class ErrorService {
	throwErrorToClient(errorData: FullErrorInfo, error?: Error): GlobalError {
		return new GlobalError(errorData, error)
	}
}
