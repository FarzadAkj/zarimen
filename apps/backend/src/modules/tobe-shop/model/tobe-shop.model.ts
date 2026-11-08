import { ApiProperty } from "@nestjs/swagger"
import { TobeShopStatus } from "@prisma/client"

export class TobeShopModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ type: String })
	name!: string

	@ApiProperty({ type: String })
	brandName!: string

	@ApiProperty({ type: String })
	subdomain!: string

	@ApiProperty({ type: String, nullable: true })
	logoUrl!: string | null

	@ApiProperty({ type: String, nullable: true })
	address!: string | null

	@ApiProperty({ type: String, nullable: true })
	landline!: string | null

	@ApiProperty({ type: String })
	ownerFullName!: string

	@ApiProperty({ type: String })
	ownerPhoneNumber!: string

	@ApiProperty({ type: String })
	ownerNationalCode!: string

	@ApiProperty({ enum: TobeShopStatus, enumName: "TobeShopStatus" })
	status!: TobeShopStatus

	/** Why "Check and Insert" failed; the suggested INFO of the rejection SMS. */
	@ApiProperty({ type: String, nullable: true })
	problem!: string | null

	@ApiProperty({ type: String, nullable: true })
	shopId!: string | null

	@ApiProperty({ type: String, format: "date-time", nullable: true })
	smsSentAt!: Date | null

	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date
}

export class ReadTobeShopsOutput {
	@ApiProperty({ type: TobeShopModel, isArray: true })
	data!: TobeShopModel[]

	@ApiProperty({ type: Number })
	count!: number

	@ApiProperty({ type: Number })
	pageSize!: number
}

/** Fields already used by an existing shop; the request is saved only when none is. */
export class SubmitTobeShopOutput {
	@ApiProperty({ type: Boolean })
	accepted!: boolean

	@ApiProperty({ type: Boolean })
	subdomainTaken!: boolean

	@ApiProperty({ type: Boolean })
	nationalCodeTaken!: boolean

	@ApiProperty({ type: Boolean })
	phoneNumberTaken!: boolean
}
