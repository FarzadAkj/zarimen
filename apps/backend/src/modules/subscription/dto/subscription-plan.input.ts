import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsInt, IsNotEmpty, IsString, IsUUID, Max, MaxLength, Min } from "class-validator"
import { MAX_PLAN_PRICE, MIN_PLAN_PRICE } from "../constants/subscription"

export class CreateSubscriptionPlanInput {
	@ApiProperty({ type: String, example: "اشتراک یک‌ماهه" })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	title!: string

	@ApiProperty({ type: Number, example: 2_000_000, description: "Whole Tomans" })
	@IsInt()
	@Min(MIN_PLAN_PRICE)
	@Max(MAX_PLAN_PRICE)
	price!: number

	@ApiProperty({ type: Number, example: 30 })
	@IsInt()
	@Min(1)
	@Max(3650)
	durationDays!: number
}

export class SetSubscriptionPlanActiveInput {
	@ApiProperty({ type: String })
	@IsUUID()
	id!: string

	@ApiProperty({ type: Boolean })
	@IsBoolean()
	isActive!: boolean
}

export class StartSubscriptionPurchaseInput {
	@ApiProperty({ type: String })
	@IsUUID()
	planId!: string
}
