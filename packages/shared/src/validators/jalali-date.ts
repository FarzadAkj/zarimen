/**
 * Jalali date in `YYYY/MM/DD` form, as the Persian calendar picker emits it ("1370/01/05").
 * Months 1-6 have 31 days, 7-11 have 30, Esfand has 29 or 30 (leap years are not
 * checked; CardMatch rejects a non-existent 30 Esfand anyway).
 */
export function isValidJalaliDate(value: string) {
	const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value)
	if (!match)
		return false

	const [, year, month, day] = match.map(Number) as [number, number, number, number]
	if (year < 1300 || year > 1500 || month < 1 || month > 12 || day < 1)
		return false

	return day <= (month <= 6 ? 31 : 30)
}
