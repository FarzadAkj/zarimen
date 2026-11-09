/**
 * Where to land after logging in: `next` (set by the proxy when it bounced a panel link to the
 * login page) when it is one of our own /panel pages, else /panel. Anything else (another host,
 * `//evil.com`, the login page itself) is ignored.
 */
export function safeNextPath(next: string | null | undefined) {
    if (!next || !/^\/panel(?:[/?]|$)/.test(next) || next.startsWith("/panel/login"))
        return "/panel"
    return next
}
