import { ApiProperty } from "@nestjs/swagger"
import { IsInt, Max, Min } from "class-validator"

/**
 * What a shop's wallet pays per request its customers trigger, in whole Tomans.
 * 0 (the default) means free.
 */
export class ServiceCostSettingsModel {
	@ApiProperty({ type: Number, description: "Tomans per Shahkar check (mobile ↔ national code)." })
	@IsInt()
	@Min(0)
	@Max(1_000_000_000)
	shahkarCost: number = 0

	@ApiProperty({ type: Number, description: "Tomans per bank card check (CardMatch: card ↔ national code + birth date)." })
	@IsInt()
	@Min(0)
	@Max(1_000_000_000)
	cardMatchCost: number = 0

	@ApiProperty({ type: Number, description: "Tomans per SMS sent to a customer." })
	@IsInt()
	@Min(0)
	@Max(1_000_000_000)
	smsCost: number = 0
}
