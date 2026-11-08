import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "~/common/constants"
import { defineErrorList } from "~/libs/error/classes/global-error"

export const TicketErrors = defineErrorList(ModuleNames.TicketModule, {
	/** No such ticket, or (for an owner) it belongs to another shop. */
	TicketNotFound: { statusCode: HttpStatus.NOT_FOUND },
	/** The owner closed it; nobody can write any more. */
	TicketClosed: { statusCode: HttpStatus.BAD_REQUEST },
	/** An image URL that is not one of ours (not in the bucket's zar-imen/ folder). */
	InvalidTicketImage: { statusCode: HttpStatus.BAD_REQUEST },
})
