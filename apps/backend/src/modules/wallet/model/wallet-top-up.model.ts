import { ApiProperty } from "@nestjs/swagger"

export class WalletTopUpModel {
	/** Zarinpal page to send the owner's browser to. */
	@ApiProperty({ type: String })
	url!: string
}
