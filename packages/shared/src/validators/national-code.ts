/**
 * Iranian national code (کد ملی): 10 digits with a valid check digit.
 */
export function isValidNationalCode(value: string) {
	if (!/^\d{10}$/.test(value))
		return false

	// all-same-digit codes pass the checksum but are never issued
	if (/^(\d)\1{9}$/.test(value))
		return false

	const check = Number(value[9])
	let sum = 0
	for (let i = 0; i < 9; i++)
		sum += Number(value[i]) * (10 - i)

	const remainder = sum % 11
	return remainder < 2 ? check === remainder : check === 11 - remainder
}
