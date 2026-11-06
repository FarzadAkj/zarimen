import { ApiProperty } from "@nestjs/swagger"
import { IsSubdomain } from "~/libs/validators/validators"

export class ReadShopPublicInfoInput {
	@ApiProperty({ type: String, example: "setoode" })
	@IsSubdomain()
	subdomain!: string
}
