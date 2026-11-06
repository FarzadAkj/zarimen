/** Iranian mobile number in `09xxxxxxxxx` format. */
export function isValidPhoneNumber(value: string) {
	return /^09\d{9}$/.test(value)
}
