import { describe, expect, it } from "vitest"
import { discountedPrice } from "./discount"

describe("discountedPrice", () => {
	it("takes the percentage off the price", () => {
		expect(discountedPrice(2_000_000, 20)).toBe(1_600_000)
		expect(discountedPrice(2_000_000, 0)).toBe(2_000_000)
	})

	it("rounds the discount to a whole Toman", () => {
		expect(discountedPrice(10_005, 10)).toBe(9_004)
		expect(discountedPrice(10_004, 10)).toBe(9_004)
	})
})
