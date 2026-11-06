import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength } from "class-validator"
import { IsNationalCode, IsPhoneNumber, IsSubdomain } from "~/libs/validators/validators"

export class CreateShopInput {
	@ApiProperty({ type: String, description: "نام فروشگاه" })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	name!: string

	@ApiProperty({ type: String, description: "نام برند" })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	brandName!: string

	@ApiProperty({ type: String, example: "setoode", description: "setoode → setoode.zarimen.ir" })
	@IsSubdomain()
	subdomain!: string

	@ApiPropertyOptional({ type: String, description: "Public URL returned by createImageUpload" })
	@IsOptional()
	@IsUrl({ require_tld: false, protocols: ["https", "http"] })
	logoUrl?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	address?: string

	@ApiPropertyOptional({ type: String, example: "02112345678" })
	@IsOptional()
	@Matches(/^0\d{10}$/, { message: "landline must be 11 digits starting with 0" })
	landline?: string

	@ApiProperty({ type: String })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	ownerFullName!: string

	@ApiProperty({ type: String, example: "09120000000" })
	@IsPhoneNumber()
	ownerPhoneNumber!: string

	@ApiProperty({ type: String, example: "0499370899" })
	@IsNationalCode()
	ownerNationalCode!: string

	/** A string so no precision is lost on the way to the Decimal column. */
	@ApiPropertyOptional({ type: String, example: "1500000", description: "Initial wallet balance in Tomans. Defaults to 0." })
	@IsOptional()
	@Matches(/^\d{1,18}$/, { message: "initialWalletBalance must be a whole, non-negative number of Tomans" })
	initialWalletBalance?: string
}
