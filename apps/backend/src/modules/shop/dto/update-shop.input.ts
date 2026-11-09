import { ApiProperty, PickType } from "@nestjs/swagger"
import { IsUUID } from "class-validator"
import { CreateShopInput } from "./create-shop.input"

/**
 * The admin edits a shop. Not here, so never changed: the owner's mobile and national code
 * (their identity, checked by Shahkar at creation) and the subdomain (the shop's address, used
 * in links already sent by SMS). Optional fields left out are cleared.
 */
export class UpdateShopInput extends PickType(CreateShopInput, [
	"name",
	"brandName",
	"logoUrl",
	"address",
	"landline",
	"ownerFullName",
] as const) {
	@ApiProperty({ type: String })
	@IsUUID()
	shopId!: string
}
