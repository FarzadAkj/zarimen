import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsOptional, IsUUID, Min } from "class-validator"

export class ReadManualCardChecksInput {
	/** 1-based; newest checks first. */
	@ApiPropertyOptional({ type: Number, default: 1 })
	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number
}

export class ReadShopManualCardChecksInput extends ReadManualCardChecksInput {
	@ApiProperty({ type: String })
	@IsUUID()
	shopId!: string
}
