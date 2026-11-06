import { ApiProperty } from "@nestjs/swagger"
import { IsDateString, IsUUID } from "class-validator"

export class SetShopSubscriptionEndInput {
	@ApiProperty({ type: String })
	@IsUUID()
	shopId!: string

	/** Must be after the shop's current end date and after now. */
	@ApiProperty({ type: String, format: "date-time" })
	@IsDateString()
	endsAt!: string
}
