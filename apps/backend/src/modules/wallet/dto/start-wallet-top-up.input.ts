import { ApiProperty } from "@nestjs/swagger"
import { IsInt, Max, Min } from "class-validator"
import { MAX_WALLET_TOP_UP, MIN_WALLET_TOP_UP } from "../constants/wallet.constants"

export class StartWalletTopUpInput {
	@ApiProperty({ type: Number, minimum: MIN_WALLET_TOP_UP, maximum: MAX_WALLET_TOP_UP, description: "Tomans to add to the wallet" })
	@IsInt()
	@Min(MIN_WALLET_TOP_UP)
	@Max(MAX_WALLET_TOP_UP)
	amount!: number
}
