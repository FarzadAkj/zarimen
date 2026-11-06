import { ApiProperty } from "@nestjs/swagger"
import { IsJWT, Matches } from "class-validator"
import { IsJalaliDate, IsNationalCode, IsPhoneNumber, IsSubdomain } from "~/libs/validators/validators"

export class StartSignupInput {
	/** The shop the customer is verifying at (`setoode` for setoode.zarimen.ir). */
	@ApiProperty({ type: String, example: "setoode" })
	@IsSubdomain()
	subdomain!: string

	@ApiProperty({ type: String, example: "0499370899" })
	@IsNationalCode()
	ssn!: string

	@ApiProperty({ type: String, example: "09120000000" })
	@IsPhoneNumber()
	phoneNumber!: string

	@ApiProperty({ type: String, example: "1370/01/05", description: "Jalali YYYY/MM/DD" })
	@IsJalaliDate()
	birthDate!: string
}

export class CompleteSignupInput {
	/** `ticket` returned by startSignup. */
	@ApiProperty({ type: String })
	@IsJWT()
	ticket!: string

	@ApiProperty({ type: String, example: "123456" })
	@Matches(/^\d{6}$/)
	code!: string
}
