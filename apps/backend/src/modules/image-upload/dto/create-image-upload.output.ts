import { ApiProperty } from "@nestjs/swagger"

export class CreateImageUploadOutput {
	/** Presigned URL to PUT the file to, valid for 5 minutes. */
	@ApiProperty()
	uploadUrl!: string

	/** Headers the PUT must carry exactly as given. */
	@ApiProperty({ type: Object, additionalProperties: { type: "string" } })
	headers!: Record<string, string>

	/** Public URL of the image once uploaded; save this as the shop logo. */
	@ApiProperty()
	publicUrl!: string
}
