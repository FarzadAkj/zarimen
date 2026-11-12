import { ApiProperty } from "@nestjs/swagger"
import { PaidService, WalletTransactionType } from "@prisma/client"

export class WalletTransactionModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ enum: WalletTransactionType, enumName: "WalletTransactionType" })
	type!: WalletTransactionType

	/** Signed whole Tomans: "500000" added, "-1000" taken. */
	@ApiProperty({ type: String })
	amount!: string

	/** SERVICE_CHARGE only. */
	@ApiProperty({ enum: PaidService, enumName: "PaidService", nullable: true })
	service!: PaidService | null

	/** SERVICE_CHARGE only: the customer whose request was paid for. */
	@ApiProperty({ type: String, nullable: true })
	customerSsn!: string | null

	/** TOP_UP only: gateway reference number. */
	@ApiProperty({ type: String, nullable: true })
	refId!: string | null

	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date
}

export class ReadWalletTransactionsOutput {
	@ApiProperty({ type: WalletTransactionModel, isArray: true })
	data!: WalletTransactionModel[]

	@ApiProperty({ type: Number })
	count!: number

	@ApiProperty({ type: Number })
	pageSize!: number
}
