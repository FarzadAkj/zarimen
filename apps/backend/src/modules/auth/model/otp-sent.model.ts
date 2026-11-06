import { ApiProperty } from "@nestjs/swagger"

export class OtpSentModel {
	@ApiProperty({ type: String })
	phoneNumber!: string

	@ApiProperty({ type: Number, description: "Seconds until the code expires" })
	expiresInSeconds!: number
}
