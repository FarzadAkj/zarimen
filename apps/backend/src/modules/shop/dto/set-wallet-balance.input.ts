import { ApiProperty } from "@nestjs/swagger"
import { IsUUID, Matches } from "class-validator"

export class SetWalletBalanceInput {
	@ApiProperty({ type: String })
	@IsUUID()
	shopId!: string

	/** The new balance (not a change). A string so no precision is lost on the way to the Decimal column. */
	@ApiProperty({ type: String, example: "1500000" })
	@Matches(/^\d{1,18}$/, { message: "balance must be a whole, non-negative number of Tomans" })
	balance!: string
}
