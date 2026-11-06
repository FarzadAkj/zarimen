import { ApiProperty } from "@nestjs/swagger"
import { Matches } from "class-validator"
import { IsPhoneNumber } from "~/libs/validators/validators"

export class ExchangeOtpInput {
	@ApiProperty({ type: String, example: "09120000000" })
	@IsPhoneNumber()
	phoneNumber!: string

	@ApiProperty({ type: String, example: "123456" })
	@Matches(/^\d{6}$/)
	code!: string
}
