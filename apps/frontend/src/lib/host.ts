import { isValidSubdomain } from "@zar-imen/shared"

export type HostTarget =
    | { kind: "root" }
    | { kind: "shop", subdomain: string }
    | { kind: "unknown" }

/**
 * What a request's Host header points at. `rootDomain` is ROOT_DOMAIN
 * (`zarimen.ir`, or `localhost:3010` in development, port included):
 * - `zarimen.ir`, `www.zarimen.ir`       → the main site and the admin panel
 * - `setoode.zarimen.ir`                 → shop `setoode`
 * - anything else (other domains, `a.b.zarimen.ir`, reserved names) → unknown
 */
export function parseHost(host: string | null, rootDomain: string): HostTarget {
    if (!host) return { kind: "unknown" }
    const name = host.toLowerCase()

    if (name === rootDomain || name === `www.${rootDomain}`) return { kind: "root" }

    const suffix = `.${rootDomain}`
    if (!name.endsWith(suffix)) return { kind: "unknown" }

    const subdomain = name.slice(0, -suffix.length)
    return isValidSubdomain(subdomain) ? { kind: "shop", subdomain } : { kind: "unknown" }
}
