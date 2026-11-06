/** 16-digit Iranian bank card number with a valid Luhn checksum. */
export function isValidBankCardNumber(value: string) {
	if (!/^\d{16}$/.test(value))
		return false

	let sum = 0
	for (let i = 0; i < 16; i++) {
		let digit = Number(value[i])
		if (i % 2 === 0) {
			digit *= 2
			if (digit > 9)
				digit -= 9
		}
		sum += digit
	}
	return sum % 10 === 0
}
