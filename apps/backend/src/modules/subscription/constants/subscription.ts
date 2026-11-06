const DAY_MS = 24 * 60 * 60 * 1000

/** A purchase still PENDING this long after it started is canceled (checked every 10 minutes). */
export const PENDING_PURCHASE_TTL_MINUTES = 20

export const SUBSCRIPTION_PURCHASES_PAGE_SIZE = 20

/** Plan price bounds in Tomans (Zarinpal takes at least 1,000). */
export const MIN_PLAN_PRICE = 1000
export const MAX_PLAN_PRICE = 200_000_000

/**
 * The period a purchase of `durationDays` adds: it starts when the current subscription ends,
 * or now if there is none / it already ended.
 */
export function extendSubscription(currentEnd: Date | null, now: Date, durationDays: number) {
	const startsAt = currentEnd && currentEnd > now ? currentEnd : now
	return { startsAt, endsAt: new Date(startsAt.getTime() + durationDays * DAY_MS) }
}

/** Customers can use a shop's pages while this is true. */
export function hasActiveSubscription(subscriptionEndsAt: Date | null, now = new Date()) {
	return !!subscriptionEndsAt && subscriptionEndsAt > now
}
