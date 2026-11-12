import { ApiProperty } from "@nestjs/swagger"

export class WalletTopUpModel {
	/** SePal page to send the owner's browser to (a navigation from our site: SePal checks the Referer). */
	@ApiProperty({ type: String })
	url!: string
}
