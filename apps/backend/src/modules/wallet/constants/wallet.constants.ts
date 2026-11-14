/** Smallest top-up, in Tomans: SePal takes at least 100,000 Rials. */
export const MIN_WALLET_TOP_UP = 10_000
/** Largest top-up, in Tomans; our own ceiling. */
export const MAX_WALLET_TOP_UP = 200_000_000

export const WALLET_TRANSACTIONS_PAGE_SIZE = 20

/** A top-up still PENDING this long after it was started is canceled (checked every 10 minutes). */
export const PENDING_TOP_UP_TTL_MINUTES = 20

/** The admins' SMS when a top-up is paid; `paid` is what the owner paid (amount + VAT), in Tomans. */
export function topUpNotice(subdomain: string, paid: number) {
	return `شارژ کیف پول فروشگاه ${subdomain} به مبلغ ${paid.toLocaleString("en-US")} تومان پرداخت شد.`
}
