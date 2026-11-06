import { ApiProperty } from "@nestjs/swagger"

export class SignupStartedModel {
	/** Send back with the SMS code to completeSignup. */
	@ApiProperty({ type: String })
	ticket!: string

	@ApiProperty({ type: String })
	phoneNumber!: string

	@ApiProperty({ type: Number, description: "Seconds until the SMS code expires" })
	expiresInSeconds!: number
}
