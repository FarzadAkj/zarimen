import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { me } from "./app/panel/login/actions"
import { readMyShop } from "./app/tenant/[subdomain]/panel/actions"
import { parseHost } from "./lib/host"
import { TOKEN_COOKIE } from "./lib/session"

/** zarimen.ir in production, localhost:3010 in development. Shops live on <subdomain>.ROOT_DOMAIN. */
const ROOT_DOMAIN = process.env.ROOT_DOMAIN!

const LOGIN_PATH = "/panel/login"

/** A shop subdomain's pages anyone may open: the landing page and the customer verification. */
const SHOP_PUBLIC_PATHS = ["/", "/verify"]

/**
 * Routes by host:
 * - zarimen.ir/panel/*           → the admin panel (src/app/panel)
 * - <sub>.zarimen.ir, /verify    → that shop's public pages, rewritten to src/app/tenant/<sub>
 * - <sub>.zarimen.ir/panel/*     → that shop's panel, rewritten to src/app/tenant/<sub>/panel
 * Everything under /panel except the login page needs a valid token for that host.
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const target = parseHost(request.headers.get("host"), ROOT_DOMAIN)

    // /tenant/* is only reachable through the rewrite below, never by URL.
    if (target.kind === "unknown" || pathname === "/tenant" || pathname.startsWith("/tenant/"))
        return notFound()

    const isPanel = pathname === "/panel" || pathname.startsWith("/panel/")

    if (target.kind === "root")
        return isPanel ? guard(request, async () => !(await me()).error) : NextResponse.next()

    const rewriteTo = new URL(`/tenant/${target.subdomain}${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url)

    // A shop subdomain serves its public pages and its panel, nothing else.
    if (SHOP_PUBLIC_PATHS.includes(pathname))
        return NextResponse.rewrite(rewriteTo)
    if (!isPanel)
        return notFound()

    return guard(
        request,
        async () => (await readMyShop()).data?.subdomain === target.subdomain,
        () => NextResponse.rewrite(rewriteTo),
    )
}

/**
 * Logged in → the login page bounces to /panel, other pages are served.
 * Not logged in → the login page is served, other pages bounce to the login page
 * (dropping a stale / invalid token).
 */
async function guard(request: NextRequest, isLoggedIn: () => Promise<boolean>, serve = () => NextResponse.next()) {
    const loggedIn = request.cookies.has(TOKEN_COOKIE) && await isLoggedIn()

    if (request.nextUrl.pathname === LOGIN_PATH)
        return loggedIn ? NextResponse.redirect(new URL("/panel", request.url)) : serve()

    if (!loggedIn) {
        const res = NextResponse.redirect(new URL(LOGIN_PATH, request.url))
        res.cookies.delete(TOKEN_COOKIE)
        return res
    }

    return serve()
}

function notFound() {
    return new NextResponse(null, { status: 404 })
}

export const config = {
    // everything except Next's own assets and static files
    matcher: ["/((?!_next/|favicon.ico|fonts/).*)"],
}
