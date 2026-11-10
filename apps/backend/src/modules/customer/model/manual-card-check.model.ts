import { ApiProperty } from "@nestjs/swagger"

/** CardMatch's answer to an owner's «استعلام دستی». */
export class ManualCardCheckModel {
	/** `true` when the card belongs to the national code + birth date. */
	@ApiProperty({ type: Boolean })
	matched!: boolean

	@ApiProperty({ type: String, nullable: true })
	bankName!: string | null
}

/** One past «استعلام دستی» in the shop's history: what was asked and the answer. */
export class ManualCardCheckRecordModel extends ManualCardCheckModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ type: String })
	ssn!: string

	@ApiProperty({ type: String, description: "Jalali YYYY/MM/DD" })
	birthDate!: string

	@ApiProperty({ type: String })
	cardNumber!: string

	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date
}

export class ReadManualCardChecksOutput {
	@ApiProperty({ type: ManualCardCheckRecordModel, isArray: true })
	data!: ManualCardCheckRecordModel[]

	@ApiProperty({ type: Number })
	count!: number

	@ApiProperty({ type: Number })
	pageSize!: number
}
