import { ApiProperty } from "@nestjs/swagger"
import { Matches } from "class-validator"
import { IsPhoneNumber, IsSubdomain } from "~/libs/validators/validators"

export class StartLoginInput {
	@ApiProperty({ type: String, example: "setoode" })
	@IsSubdomain()
	subdomain!: string

	@ApiProperty({ type: String, example: "09120000000" })
	@IsPhoneNumber()
	phoneNumber!: string
}

export class CompleteLoginInput extends StartLoginInput {
	@ApiProperty({ type: String, example: "123456" })
	@Matches(/^\d{6}$/)
	code!: string
}
