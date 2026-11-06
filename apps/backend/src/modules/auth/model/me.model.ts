import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class MeModel {
	@ApiProperty({ type: String, example: "admin", description: "\"admin\" or \"shop\"" })
	role!: string

	@ApiProperty({ type: String })
	phoneNumber!: string

	/** Only on shop tokens. */
	@ApiPropertyOptional({ type: String })
	shopId?: string
}
