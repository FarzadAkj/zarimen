import { describe, expect, it } from "vitest"
import { maskPhoneNumber } from "./format"

describe("maskPhoneNumber", () => {
    it("hides the 5th to 7th digits", () => {
        expect(maskPhoneNumber("09175194864")).toBe("0917***4864")
    })
})
