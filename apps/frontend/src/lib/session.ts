import { cookies } from "next/headers"

/**
 * The login token lives in an httpOnly `token` cookie. It is host-only (no `domain`
 * attribute), so the admin's cookie on zarimen.ir is never sent to a shop subdomain,
 * and one shop's cookie is never sent to another.
 */
export const TOKEN_COOKIE = "token"
const TOKEN_MAX_AGE = 60 * 60 * 24 * 10 // matches the backend's jwtExpire (10d)

export async function saveToken(token: string) {
    const cookie = await cookies()
    cookie.set(TOKEN_COOKIE, token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: TOKEN_MAX_AGE,
    })
}

export async function clearToken() {
    const cookie = await cookies()
    cookie.delete(TOKEN_COOKIE)
}

export async function hasToken() {
    const cookie = await cookies()
    return !!cookie.get(TOKEN_COOKIE)?.value
}
