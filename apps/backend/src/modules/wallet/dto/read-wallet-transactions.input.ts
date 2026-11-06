import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsOptional, IsUUID, Min } from "class-validator"

export class ReadWalletTransactionsInput {
	/** 1-based; newest transactions first. */
	@ApiPropertyOptional({ type: Number, default: 1 })
	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number
}

export class ReadShopWalletTransactionsInput extends ReadWalletTransactionsInput {
	@ApiProperty({ type: String })
	@IsUUID()
	shopId!: string
}
