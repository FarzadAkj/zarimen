import { ApiProperty } from "@nestjs/swagger"
import { IsPhoneNumber } from "~/libs/validators/validators"

export class SendOtpInput {
	@ApiProperty({ type: String, example: "09120000000" })
	@IsPhoneNumber()
	phoneNumber!: string
}
