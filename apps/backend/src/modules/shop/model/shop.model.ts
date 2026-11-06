import { ApiProperty } from "@nestjs/swagger"

export class ShopModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ type: String })
	name!: string

	@ApiProperty({ type: String })
	brandName!: string

	@ApiProperty({ type: String })
	subdomain!: string

	@ApiProperty({ type: Boolean })
	isActive!: boolean

	/** Customers can use the shop until then; null: never subscribed. */
	@ApiProperty({ type: String, format: "date-time", nullable: true })
	subscriptionEndsAt!: Date | null

	@ApiProperty({ type: String, nullable: true })
	logoUrl!: string | null

	@ApiProperty({ type: String, nullable: true })
	address!: string | null

	@ApiProperty({ type: String, nullable: true })
	landline!: string | null

	@ApiProperty({ type: String })
	ownerFullName!: string

	@ApiProperty({ type: String })
	ownerPhoneNumber!: string

	@ApiProperty({ type: String })
	ownerNationalCode!: string

	/** Whole Tomans as a string, e.g. "1500000". */
	@ApiProperty({ type: String })
	walletBalance!: string

	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date
}
