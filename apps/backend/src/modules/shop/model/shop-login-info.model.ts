import { ApiProperty } from "@nestjs/swagger"

/** What anyone may see on a shop's login page: no owner details, no wallet. */
export class ShopLoginInfoModel {
	@ApiProperty({ type: String })
	name!: string

	@ApiProperty({ type: String })
	brandName!: string

	@ApiProperty({ type: String, nullable: true })
	logoUrl!: string | null

	@ApiProperty({ type: Boolean })
	isActive!: boolean
}
