import { ApiProperty } from "@nestjs/swagger"
import { IsBankCardNumber } from "~/libs/validators/validators"

export class AddCardInput {
	@ApiProperty({ type: String, example: "6037997599999993" })
	@IsBankCardNumber()
	cardNumber!: string
}
