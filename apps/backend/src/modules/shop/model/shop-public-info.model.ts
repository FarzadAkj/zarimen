import { ApiProperty } from "@nestjs/swagger"

/**
 * What anyone may see about a shop: its landing page and login page.
 * Owner's name and mobile are public by the user's choice; never the national code or wallet.
 */
export class ShopPublicInfoModel {
	@ApiProperty({ type: String })
	name!: string

	@ApiProperty({ type: String })
	brandName!: string

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

	@ApiProperty({ type: Boolean })
	isActive!: boolean

	/** False: customers cannot use the shop's pages (no running subscription). */
	@ApiProperty({ type: Boolean })
	hasActiveSubscription!: boolean
}
