import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { TicketStatus } from "@prisma/client"
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min } from "class-validator"
import { MAX_TICKET_BODY_LENGTH, MAX_TICKET_IMAGES, MAX_TICKET_TITLE_LENGTH } from "../constants/ticket"

export class TicketMessageInput {
	@ApiProperty({ type: String })
	@IsString()
	@IsNotEmpty()
	@MaxLength(MAX_TICKET_BODY_LENGTH)
	body!: string

	/** Public URLs from createMyImageUpload / createImageUpload, at most 2. */
	@ApiPropertyOptional({ type: String, isArray: true })
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(MAX_TICKET_IMAGES)
	@IsUrl({ require_tld: false, protocols: ["https", "http"] }, { each: true })
	imageUrls?: string[]
}

export class CreateTicketInput extends TicketMessageInput {
	@ApiProperty({ type: String, example: "مشکل در شارژ کیف پول" })
	@IsString()
	@IsNotEmpty()
	@MaxLength(MAX_TICKET_TITLE_LENGTH)
	title!: string
}

export class SendTicketMessageInput extends TicketMessageInput {
	@ApiProperty({ type: String })
	@IsUUID()
	ticketId!: string
}

export class TicketIdInput {
	@ApiProperty({ type: String })
	@IsUUID()
	ticketId!: string
}

export class ReadTicketsInput {
	/** 1-based; latest activity first. */
	@ApiPropertyOptional({ type: Number, default: 1 })
	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number

	@ApiPropertyOptional({ enum: TicketStatus, enumName: "TicketStatus" })
	@IsOptional()
	@IsEnum(TicketStatus)
	status?: TicketStatus
}
