import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsOptional, Matches } from "class-validator"

export class ReadMyCustomersInput {
	/** Digits matched anywhere in the national code or the mobile number. Empty / missing: everyone. */
	@ApiPropertyOptional({ type: String, example: "0912" })
	@IsOptional()
	@Matches(/^\d{0,11}$/, { message: "search must be up to 11 digits" })
	search?: string
}
