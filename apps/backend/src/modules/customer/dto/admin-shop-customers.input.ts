import { ApiProperty } from "@nestjs/swagger"
import { IsUUID } from "class-validator"
import { ReadMyCustomerCardsInput } from "./read-my-customer-cards.input"
import { ReadMyCustomersInput } from "./read-my-customers.input"

export class ReadShopCustomersInput extends ReadMyCustomersInput {
	@ApiProperty({ type: String })
	@IsUUID()
	shopId!: string
}

export class ReadShopCustomerCardsInput extends ReadMyCustomerCardsInput {
	@ApiProperty({ type: String })
	@IsUUID()
	shopId!: string
}
