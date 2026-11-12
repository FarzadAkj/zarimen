/**
 * A plan's price after the admin's subscription discount, in whole Tomans (the discount is
 * rounded to a whole Toman). The backend charges exactly this; the pages show the same number.
 */
export function discountedPrice(price: number, percent: number): number {
	return price - Math.round(price * percent / 100)
}
