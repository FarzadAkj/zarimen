/** "6037991234567893" → "6037-99**-****-7893": what bank receipts show. */
export function maskCardNumber(cardNumber: string) {
	return `${cardNumber.slice(0, 4)}-${cardNumber.slice(4, 6)}**-****-${cardNumber.slice(12)}`
}

/** "1370/01/05" → "1370/1/5", the form CardMatch takes. */
export function toCardMatchDate(jalaliDate: string) {
	return jalaliDate.split("/").map(Number).join("/")
}
