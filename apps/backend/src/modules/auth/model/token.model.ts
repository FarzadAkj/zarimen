import { ApiProperty } from "@nestjs/swagger"
import { MeModel } from "./me.model"

export class TokenModel {
	@ApiProperty({ type: String })
	token!: string

	@ApiProperty({ type: MeModel })
	me!: MeModel
}
