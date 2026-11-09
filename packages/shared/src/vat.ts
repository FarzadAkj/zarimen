/** Iran's VAT («مالیات بر ارزش افزوده») default; the admin can change it on the settings page. */
export const DEFAULT_VAT_PERCENT = 10

/**
 * The VAT added on top of a payment of `amount` whole Tomans, rounded to a whole Toman.
 * The backend charges exactly this; the owner's confirmation dialog shows the same number.
 */
export function vatOf(amount: number, percent: number): number {
	return Math.round(amount * percent / 100)
}
