export const CUSTOMER_ROLE = "customer"

/**
 * Customers verify on the shop's own device, often logged in on top of the owner's
 * browser, so their session is short: long enough to add a card, no longer.
 */
export const CUSTOMER_TOKEN_TTL_SECONDS = 30 * 60

/** Time between passing Shahkar (phase 1) and entering the SMS code (phase 2). */
export const SIGNUP_TICKET_TTL_SECONDS = 10 * 60

/** Customer session token. */
export type CustomerJwtPayload = {
	role: typeof CUSTOMER_ROLE
	customerId: string
	shopId: string
}

/**
 * Signed proof that phase 1 passed Shahkar for exactly these details. Phase 2 sends it
 * back with the SMS code, so the national code / birth date cannot be swapped in between.
 * Has no `role`, so no guard accepts it as a session.
 */
export type SignupTicketPayload = {
	kind: "customer-signup"
	ssn: string
	phoneNumber: string
	birthDate: string
	shopId: string
}
