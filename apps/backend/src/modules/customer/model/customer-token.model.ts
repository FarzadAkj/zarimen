import { ApiProperty } from "@nestjs/swagger"

export class CustomerTokenModel {
	@ApiProperty({ type: String })
	token!: string

	@ApiProperty({ type: Number })
	expiresInSeconds!: number
}
