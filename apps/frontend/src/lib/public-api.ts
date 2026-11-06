import { Api } from "@/api/Api"

/**
 * API client that sends no cookies, for data that is the same for every visitor.
 * Unlike `takeApi`, using it does not make a page dynamic, so pages built on it
 * can be pre-rendered.
 */
export function publicApi() {
    return new Api({ baseUrl: process.env.NEXT_PUBLIC_SERVER_ADDRESS })
}
