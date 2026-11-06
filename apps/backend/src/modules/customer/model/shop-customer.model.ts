import { ApiProperty } from "@nestjs/swagger"

/** A customer as their shop's owner sees them. */
export class ShopCustomerModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ type: String })
	ssn!: string

	@ApiProperty({ type: String })
	phoneNumber!: string

	@ApiProperty({ type: String, description: "Jalali YYYY/MM/DD" })
	birthDate!: string

	/** First verification at this shop. */
	@ApiProperty({ type: String, format: "date-time" })
	firstSeenAt!: Date

	/** Last signup / login at this shop. */
	@ApiProperty({ type: String, format: "date-time" })
	lastSeenAt!: Date

	/** How many verified cards the customer has; the numbers come from readMyCustomerCards. */
	@ApiProperty({ type: Number })
	cardCount!: number
}

/** A customer's card as their shop's owner sees it: the full number, on request. */
export class ShopCustomerCardModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ type: String })
	cardNumber!: string

	@ApiProperty({ type: String, nullable: true })
	bankName!: string | null

	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date
}
