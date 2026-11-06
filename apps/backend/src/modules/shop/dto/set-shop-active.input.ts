import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsUUID } from "class-validator"

export class SetShopActiveInput {
	@ApiProperty({ type: String })
	@IsUUID()
	id!: string

	@ApiProperty({ type: Boolean })
	@IsBoolean()
	isActive!: boolean
}
