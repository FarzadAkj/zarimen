import { ApiProperty } from "@nestjs/swagger"

export class CustomerCardModel {
	@ApiProperty({ type: String })
	id!: string

	/** "6037-99**-****-7893"; the full number never leaves the backend. */
	@ApiProperty({ type: String })
	maskedNumber!: string

	@ApiProperty({ type: String, nullable: true })
	bankName!: string | null

	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date
}

export class CustomerCardsModel {
	@ApiProperty({ type: String })
	phoneNumber!: string

	@ApiProperty({ type: CustomerCardModel, isArray: true })
	cards!: CustomerCardModel[]
}
