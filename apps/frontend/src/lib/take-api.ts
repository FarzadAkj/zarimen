"use server"
import { cookies } from "next/headers"
import { Api } from "@/api/Api"
import { TOKEN_COOKIE } from "@/lib/session"

/** API client that sends the session token from `tokenCookie` (the admin / shop owner one by default). */
export async function takeApi(tokenCookie: string = TOKEN_COOKIE) {
    const cookie = await cookies()
    const api = new Api({
        customFetch: createCustomFetch(),
        baseUrl: process.env.NEXT_PUBLIC_SERVER_ADDRESS,
    })

    function createCustomFetch() {
        async function customFetch(input: RequestInfo | URL, init: RequestInit | undefined) {
            const tokenValue = cookie.get(tokenCookie)?.value
            init ??= {}
            init.headers ??= {}

            if (tokenValue) {
                init.headers = {
                    ...init.headers,
                    authorization: tokenValue,
                }
                init.cache = "no-cache"
            }

            const response = await fetch(input, init)
            return response
        }

        return customFetch
    }

    return api
}
