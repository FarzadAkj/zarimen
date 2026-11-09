import { describe, expect, it } from "vitest"
import { vatOf } from "./vat"

describe("vatOf", () => {
	it("takes the percentage of the amount", () => {
		expect(vatOf(10_000_000, 10)).toBe(1_000_000)
		expect(vatOf(50_000, 10)).toBe(5_000)
	})

	it("rounds to a whole Toman", () => {
		expect(vatOf(2_005, 10)).toBe(201)
		expect(vatOf(2_004, 10)).toBe(200)
	})

	it("is zero when the admin sets 0%", () => {
		expect(vatOf(50_000, 0)).toBe(0)
	})
})
