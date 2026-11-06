import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsOptional, IsString, MaxLength } from "class-validator"

/** What Zarinpal appends when it sends the payer back: `?Authority=A0000...&Status=OK|NOK` */
export class TopUpCallbackQuery {
	@ApiProperty({ type: String })
	@IsString()
	@MaxLength(100)
	Authority!: string

	@ApiPropertyOptional({ type: String, enum: ["OK", "NOK"] })
	@IsOptional()
	@IsString()
	@MaxLength(10)
	Status?: string
}
