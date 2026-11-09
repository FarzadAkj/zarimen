import { ApiProperty } from "@nestjs/swagger"

/** CardMatch's answer to an owner's «استعلام دستی». Shown once, never saved. */
export class ManualCardCheckModel {
	/** `true` when the card belongs to the national code + birth date. */
	@ApiProperty({ type: Boolean })
	matched!: boolean

	@ApiProperty({ type: String, nullable: true })
	bankName!: string | null
}
