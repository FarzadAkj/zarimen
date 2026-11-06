/** The app's own hosts; a shop may not take one of these as its subdomain. */
export const RESERVED_SUBDOMAINS = ["www", "api", "panel", "admin", "app", "mail", "static", "cdn"] as const

export const SUBDOMAIN_MIN_LENGTH = 2
export const SUBDOMAIN_MAX_LENGTH = 30

/**
 * A shop's subdomain (`setoode` in setoode.zarimen.ir): lowercase latin letters,
 * digits and inner hyphens, 2-30 characters, not reserved.
 */
export function isValidSubdomain(value: string) {
	if (value.length < SUBDOMAIN_MIN_LENGTH || value.length > SUBDOMAIN_MAX_LENGTH)
		return false
	if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value))
		return false
	return !(RESERVED_SUBDOMAINS as readonly string[]).includes(value)
}
