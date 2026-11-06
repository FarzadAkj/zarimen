import { describe, expect, it } from "vitest"
import { parseHost } from "./host"

describe("parseHost", () => {
    it("treats the root domain and www as the main site", () => {
        expect(parseHost("zarimen.ir", "zarimen.ir")).toEqual({ kind: "root" })
        expect(parseHost("www.zarimen.ir", "zarimen.ir")).toEqual({ kind: "root" })
        expect(parseHost("ZARIMEN.IR", "zarimen.ir")).toEqual({ kind: "root" })
    })

    it("extracts a shop subdomain, also with a port in development", () => {
        expect(parseHost("setoode.zarimen.ir", "zarimen.ir")).toEqual({ kind: "shop", subdomain: "setoode" })
        expect(parseHost("Rahimi.localhost:3010", "localhost:3010")).toEqual({ kind: "shop", subdomain: "rahimi" })
    })

    it("rejects other domains, nested and reserved subdomains, and a missing host", () => {
        expect(parseHost("evil.com", "zarimen.ir")).toEqual({ kind: "unknown" })
        expect(parseHost("notzarimen.ir", "zarimen.ir")).toEqual({ kind: "unknown" })
        expect(parseHost("a.setoode.zarimen.ir", "zarimen.ir")).toEqual({ kind: "unknown" })
        expect(parseHost("panel.zarimen.ir", "zarimen.ir")).toEqual({ kind: "unknown" })
        expect(parseHost("setoode.localhost:3011", "localhost:3010")).toEqual({ kind: "unknown" })
        expect(parseHost(null, "zarimen.ir")).toEqual({ kind: "unknown" })
    })
})
