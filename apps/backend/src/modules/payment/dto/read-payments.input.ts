import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsOptional, Min } from "class-validator"

export class ReadPaymentsInput {
	/** 1-based; newest payments first. */
	@ApiPropertyOptional({ type: Number, default: 1 })
	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number
}
