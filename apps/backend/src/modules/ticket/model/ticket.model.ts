import { ApiProperty } from "@nestjs/swagger"
import { TicketStatus } from "@prisma/client"

export class TicketSummaryModel {
	@ApiProperty({ type: String })
	id!: string

	@ApiProperty({ type: String })
	title!: string

	@ApiProperty({ enum: TicketStatus, enumName: "TicketStatus" })
	status!: TicketStatus

	@ApiProperty({ type: String })
	shopName!: string

	@ApiProperty({ type: String })
	shopSubdomain!: string

	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date

	/** Time of the last message. */
	@ApiProperty({ type: String, format: "date-time" })
	updatedAt!: Date
}

export class TicketMessageModel {
	@ApiProperty({ type: String })
	id!: string

	/** False: the shop owner wrote it. */
	@ApiProperty({ type: Boolean })
	fromAdmin!: boolean

	@ApiProperty({ type: String })
	body!: string

	@ApiProperty({ type: String, isArray: true })
	imageUrls!: string[]

	@ApiProperty({ type: String, format: "date-time" })
	createdAt!: Date
}

export class TicketModel extends TicketSummaryModel {
	/** Oldest first. */
	@ApiProperty({ type: TicketMessageModel, isArray: true })
	messages!: TicketMessageModel[]
}

export class ReadTicketsOutput {
	@ApiProperty({ type: TicketSummaryModel, isArray: true })
	data!: TicketSummaryModel[]

	@ApiProperty({ type: Number })
	count!: number

	@ApiProperty({ type: Number })
	pageSize!: number
}
