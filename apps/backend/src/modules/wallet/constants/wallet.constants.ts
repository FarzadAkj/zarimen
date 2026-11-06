/** Smallest top-up, in Tomans (as in Darik). */
export const MIN_WALLET_TOP_UP = 2000
/** Largest top-up, in Tomans; Zarinpal's own per-payment ceiling is higher. */
export const MAX_WALLET_TOP_UP = 200_000_000

export const WALLET_TRANSACTIONS_PAGE_SIZE = 20

/** A top-up still PENDING this long after it was started is canceled (checked every 10 minutes). */
export const PENDING_TOP_UP_TTL_MINUTES = 20
