import { ApiProperty } from "@nestjs/swagger"
import { IsJWT, IsOptional, Matches } from "class-validator"
import { IsJalaliDate, IsNationalCode, IsPhoneNumber, IsSubdomain } from "~/libs/validators/validators"

/** Phase 1, step 1: texts the shop owner an approval code (see requestSignupApproval). */
export class RequestSignupApprovalInput {
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

/** Phase 1, step 2: the same details + the code texted to the shop owner (needed whenever Shahkar runs). */
export class StartSignupInput extends RequestSignupApprovalInput {
	@ApiProperty({ type: String, example: "123456", required: false })
	@IsOptional()
	@Matches(/^\d{6}$/)
	ownerCode?: string
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
