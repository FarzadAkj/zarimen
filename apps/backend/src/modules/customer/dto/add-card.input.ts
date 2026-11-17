import { ApiProperty } from "@nestjs/swagger"
import { Matches } from "class-validator"
import { IsBankCardNumber } from "~/libs/validators/validators"

export class RequestCardApprovalInput {
	@ApiProperty({ type: String, example: "6037997599999993" })
	@IsBankCardNumber()
	cardNumber!: string
}

export class AddCardInput extends RequestCardApprovalInput {
	/** The code texted to the shop owner by requestCardApproval. */
	@ApiProperty({ type: String, example: "123456" })
	@Matches(/^\d{6}$/)
	ownerCode!: string
}
