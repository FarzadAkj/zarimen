export const OTP_LENGTH = 6
export const OTP_TTL_SECONDS = 2 * 60
/** A 6-digit code would fall to guessing without a cap; after this many wrong tries the code is burnt. */
export const OTP_MAX_ATTEMPTS = 5

export const ADMIN_ROLE = "admin"
export const SHOP_ROLE = "shop"

/** Admin token: zarimen.ir/panel. Shop token: <subdomain>.zarimen.ir/panel, for one shop. */
export type AuthJwtPayload
	= | { role: typeof ADMIN_ROLE, phoneNumber: string }
		| { role: typeof SHOP_ROLE, phoneNumber: string, shopId: string }
