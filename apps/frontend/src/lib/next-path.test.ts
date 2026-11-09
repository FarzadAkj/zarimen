import { describe, expect, it } from "vitest"
import { safeNextPath } from "./next-path"

describe("safeNextPath", () => {
    it("keeps our own panel pages, query string included", () => {
        expect(safeNextPath("/panel/customers?ssn=0499370899")).toBe("/panel/customers?ssn=0499370899")
        expect(safeNextPath("/panel")).toBe("/panel")
        expect(safeNextPath("/panel?x=1")).toBe("/panel?x=1")
    })

    it("falls back to /panel for anything else", () => {
        for (const next of [null, undefined, "", "https://evil.com/panel", "//evil.com/panel", "/panelx", "/verify", "/panel/login", "/panel/login?next=/panel"])
            expect(safeNextPath(next)).toBe("/panel")
    })
})
