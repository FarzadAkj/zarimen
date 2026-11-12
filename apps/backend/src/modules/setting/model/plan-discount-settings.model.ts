import { ApiProperty } from "@nestjs/swagger"
import { IsInt, Max, Min } from "class-validator"

/** Discount («تخفیف») taken off every subscription plan's price; VAT is added to the discounted price. */
export class PlanDiscountSettingsModel {
	@ApiProperty({ type: Number, description: "Whole percent, 0 = no discount (20 → a 2,000,000 plan costs 1,600,000 Tomans + VAT). At most 99: a free plan cannot go through the gateway." })
	@IsInt()
	@Min(0)
	@Max(99)
	discountPercent: number = 0
}
