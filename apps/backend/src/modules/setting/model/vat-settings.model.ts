import { ApiProperty } from "@nestjs/swagger"
import { DEFAULT_VAT_PERCENT } from "@zar-imen/shared"
import { IsInt, Max, Min } from "class-validator"

/** VAT («مالیات بر ارزش افزوده») added on top of every SePal payment: wallet top-ups and subscriptions. */
export class VatSettingsModel {
	@ApiProperty({ type: Number, description: "Whole percent added to the amount the owner pays (10 → 50,000 + 5,000 Tomans)." })
	@IsInt()
	@Min(0)
	@Max(100)
	vatPercent: number = DEFAULT_VAT_PERCENT
}
