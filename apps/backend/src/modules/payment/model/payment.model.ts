import { ApiProperty } from "@nestjs/swagger"

const PAYMENT_KINDS = ["TOP_UP", "SUBSCRIPTION"] as const
export type PaymentKind = (typeof PAYMENT_KINDS)[number]

/** A paid SePal (or old Zarinpal) payment: a wallet top-up or a plan purchase. */
export class PaymentModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ enum: PAYMENT_KINDS, enumName: "PaymentKind" })
	kind!: PaymentKind

	/** SUBSCRIPTION only: the plan's title at purchase time. */
	@ApiProperty({ type: String, nullable: true })
	planTitle!: string | null

	/** What the owner paid, VAT included, in whole Tomans. */
	@ApiProperty({ type: String })
	amount!: string

	@ApiProperty({ type: String })
	shopName!: string

	@ApiProperty({ type: String })
	subdomain!: string

	@ApiProperty({ type: String })
	ownerPhoneNumber!: string

	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date
}

export class ReadPaymentsOutput {
	@ApiProperty({ type: PaymentModel, isArray: true })
	data!: PaymentModel[]

	@ApiProperty({ type: Number })
	count!: number

	@ApiProperty({ type: Number })
	pageSize!: number
}
