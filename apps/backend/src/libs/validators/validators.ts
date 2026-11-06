import type { ValidationOptions } from "class-validator"
import { isValidBankCardNumber, isValidJalaliDate, isValidNationalCode, isValidPhoneNumber, isValidSubdomain } from "@zar-imen/shared"
import { registerDecorator } from "class-validator"

/** Turns one of the shared string checks into a class-validator property decorator. */
function defineStringValidator(check: (value: string) => boolean, expected: string) {
	return (options?: ValidationOptions) => (object: object, propertyName: string) => {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options,
			validator: {
				validate: (value: unknown) => typeof value === "string" && check(value),
				defaultMessage: args => `${args?.property ?? "Field"} must be ${expected}`,
			},
		})
	}
}

export const IsPhoneNumber = defineStringValidator(isValidPhoneNumber, "a mobile number in 09xxxxxxxxx format")
export const IsNationalCode = defineStringValidator(isValidNationalCode, "a valid national code")
export const IsSubdomain = defineStringValidator(isValidSubdomain, "a valid, non-reserved subdomain")
export const IsJalaliDate = defineStringValidator(isValidJalaliDate, "a Jalali date in YYYY/MM/DD format")
export const IsBankCardNumber = defineStringValidator(isValidBankCardNumber, "a valid 16-digit bank card number")
