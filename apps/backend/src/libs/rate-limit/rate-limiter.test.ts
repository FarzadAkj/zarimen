import { describe, expect, it } from "vitest"
import { RateLimiter } from "./rate-limiter"

describe("rateLimiter", () => {
	it("allows `limit` hits per key per window, then refuses until the oldest ages out", () => {
		let now = 0
		const limiter = new RateLimiter(3, 1000, () => now)

		expect(limiter.hit("a")).toBe(true) // t=0
		now = 500
		expect([limiter.hit("a"), limiter.hit("a"), limiter.hit("a")]).toEqual([true, true, false])
		expect(limiter.hit("b")).toBe(true)

		now = 1000
		expect(limiter.hit("a")).toBe(true) // the t=0 hit aged out
		expect(limiter.hit("a")).toBe(false)
		now = 1501
		expect([limiter.hit("a"), limiter.hit("a"), limiter.hit("a")]).toEqual([true, true, false])
	})
})
