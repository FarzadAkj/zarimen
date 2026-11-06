import { cookies } from "next/headers"

/**
 * The login token lives in an httpOnly `token` cookie. It is host-only (no `domain`
 * attribute), so the admin's cookie on zarimen.ir is never sent to a shop subdomain,
 * and one shop's cookie is never sent to another.
 */
export const TOKEN_COOKIE = "token"

/**
 * A customer's session on a shop's /verify page. Separate from TOKEN_COOKIE because the
 * customer often uses the shop's own device, where the owner may be logged in, and short
 * (the backend's token lives 30 minutes).
 */
export const CUSTOMER_TOKEN_COOKIE = "customer_token"
const TOKEN_MAX_AGE = 60 * 60 * 24 * 10 // matches the backend's jwtExpire (10d)

export async function saveToken(token: string, name = TOKEN_COOKIE, maxAge = TOKEN_MAX_AGE) {
    const cookie = await cookies()
    cookie.set(name, token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge,
    })
}

export async function clearToken(name = TOKEN_COOKIE) {
    const cookie = await cookies()
    cookie.delete(name)
}

export async function hasToken(name = TOKEN_COOKIE) {
    const cookie = await cookies()
    return !!cookie.get(name)?.value
}
