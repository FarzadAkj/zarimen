import { ApiProperty } from "@nestjs/swagger"

export class SubscriptionPlanModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ type: String })
	title!: string

	/** Whole Tomans as a string. */
	@ApiProperty({ type: String })
	price!: string

	@ApiProperty({ type: Number })
	durationDays!: number

	@ApiProperty({ type: Boolean })
	isActive!: boolean
}

export class MySubscriptionModel {
	@ApiProperty({ type: Boolean })
	isActive!: boolean

	/** When the paid time (including purchases queued after the current one) runs out. */
	@ApiProperty({ type: String, format: "date-time", nullable: true })
	endsAt!: Date | null

	/** Title of the purchase covering today. */
	@ApiProperty({ type: String, nullable: true })
	currentPlanTitle!: string | null
}

export class SubscriptionPurchaseModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ type: String })
	planTitle!: string

	/** What was paid, whole Tomans. */
	@ApiProperty({ type: String })
	price!: string

	@ApiProperty({ type: Number })
	durationDays!: number

	@ApiProperty({ type: String, format: "date-time" })
	startsAt!: Date

	@ApiProperty({ type: String, format: "date-time" })
	endsAt!: Date

	/** Zarinpal reference number. */
	@ApiProperty({ type: String, nullable: true })
	refId!: string | null

	/** When it was bought. */
	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date
}

export class ReadSubscriptionPurchasesOutput {
	@ApiProperty({ type: SubscriptionPurchaseModel, isArray: true })
	data!: SubscriptionPurchaseModel[]

	@ApiProperty({ type: Number })
	count!: number

	@ApiProperty({ type: Number })
	pageSize!: number
}

export class SubscriptionPurchaseStartedModel {
	/** Zarinpal page to send the owner's browser to. */
	@ApiProperty({ type: String })
	url!: string
}
