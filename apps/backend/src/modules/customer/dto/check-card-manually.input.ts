import { ApiProperty } from "@nestjs/swagger"
import { IsBankCardNumber, IsJalaliDate, IsNationalCode } from "~/libs/validators/validators"

/** The owner's «استعلام دستی»: is this card the person's with this national code + birth date? */
export class CheckCardManuallyInput {
	@ApiProperty({ type: String, example: "0499370899" })
	@IsNationalCode()
	ssn!: string

	@ApiProperty({ type: String, example: "1370/01/05", description: "Jalali YYYY/MM/DD" })
	@IsJalaliDate()
	birthDate!: string

	@ApiProperty({ type: String, example: "6037997599999993" })
	@IsBankCardNumber()
	cardNumber!: string
}
