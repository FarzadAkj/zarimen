import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger"
import { TobeShopStatus } from "@prisma/client"
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from "class-validator"
import { CreateShopInput } from "../../shop/dto/create-shop.input"

/** The shop form without the wallet balance (the admin sets it at "Check and Insert"). */
export class SubmitTobeShopInput extends OmitType(CreateShopInput, ["initialWalletBalance"] as const) { }

export class TobeShopIdInput {
	@ApiProperty({ type: String })
	@IsUUID()
	id!: string
}

export class CheckAndInsertTobeShopInput extends TobeShopIdInput {
	@ApiPropertyOptional({ type: String, example: "1500000", description: "Initial wallet balance in Tomans. Defaults to 0." })
	@IsOptional()
	@Matches(/^\d{1,18}$/, { message: "initialWalletBalance must be a whole, non-negative number of Tomans" })
	initialWalletBalance?: string
}

/** The template's variable: INFO for a CANCELED request, SUBDOMAIN for a REGISTERED one. */
export class SendTobeShopSmsInput extends TobeShopIdInput {
	@ApiProperty({ type: String })
	@IsString()
	@IsNotEmpty()
	@MaxLength(300)
	value!: string
}

export class ReadTobeShopsInput {
	@ApiPropertyOptional({ type: Number, default: 1 })
	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number

	@ApiPropertyOptional({ enum: TobeShopStatus, enumName: "TobeShopStatus" })
	@IsOptional()
	@IsEnum(TobeShopStatus)
	status?: TobeShopStatus
}
