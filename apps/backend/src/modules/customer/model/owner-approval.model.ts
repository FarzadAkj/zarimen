import { ApiProperty } from "@nestjs/swagger"

/** The shop owner was texted a code that the customer enters to approve one paid check. */
export class OwnerApprovalModel {
	/** false: no paid check will run (signup of an already verified customer); no code was sent. */
	@ApiProperty({ type: Boolean })
	approvalRequired!: boolean

	@ApiProperty({ type: Number, description: "Seconds until the owner's code expires (0 when none was sent)" })
	expiresInSeconds!: number
}
