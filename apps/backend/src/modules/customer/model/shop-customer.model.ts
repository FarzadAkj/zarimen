import { ApiProperty } from "@nestjs/swagger"
import { CustomerCardModel } from "./customer-card.model"

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

	@ApiProperty({ type: CustomerCardModel, isArray: true })
	cards!: CustomerCardModel[]
}
