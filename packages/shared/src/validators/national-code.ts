/**
 * Iranian national code (کد ملی): exactly 10 digits. Whether it is real and belongs to the
 * given mobile is left to Shahkar.
 */
export function isValidNationalCode(value: string) {
	return /^\d{10}$/.test(value)
}
