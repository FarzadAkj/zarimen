import { ApiProperty } from "@nestjs/swagger"
import { Matches } from "class-validator"
import { IsPhoneNumber, IsSubdomain } from "~/libs/validators/validators"

export class SendShopOtpInput {
	/** The shop whose panel is being logged in to (`setoode` for setoode.zarimen.ir). */
	@ApiProperty({ type: String, example: "setoode" })
	@IsSubdomain()
	subdomain!: string

	@ApiProperty({ type: String, example: "09120000000" })
	@IsPhoneNumber()
	phoneNumber!: string
}

export class ExchangeShopOtpInput extends SendShopOtpInput {
	@ApiProperty({ type: String, example: "123456" })
	@Matches(/^\d{6}$/)
	code!: string
}
