import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from "class-validator"

/**
 * What SePal POSTs to a payment's callbackUrl (form fields, so numbers arrive as strings).
 * amount / cardNumber / referenceNumber only come with status 1; they are not trusted:
 * verification asks SePal again.
 */
export class PaymentCallbackInput {
	@ApiProperty({ type: Number, enum: [0, 1], description: "1 paid, 0 not paid" })
	@Type(() => Number)
	@IsInt()
	@IsIn([0, 1])
	status!: number

	@ApiProperty({ type: String })
	@Type(() => String)
	@IsString()
	@MaxLength(100)
	paymentNumber!: string

	@ApiProperty({ type: String, description: "Our payment row id" })
	@Type(() => String)
	@IsString()
	@MaxLength(100)
	invoiceNumber!: string

	@ApiPropertyOptional({ type: Number, description: "Rials" })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	amount?: number

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@Type(() => String)
	@IsString()
	@MaxLength(50)
	cardNumber?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@Type(() => String)
	@IsString()
	@MaxLength(100)
	referenceNumber?: string
}
