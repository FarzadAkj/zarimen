import { ApiProperty } from "@nestjs/swagger"
import { IsUUID } from "class-validator"

export class ReadMyCustomerCardsInput {
	@ApiProperty({ type: String })
	@IsUUID()
	customerId!: string
}
