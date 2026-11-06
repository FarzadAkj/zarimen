import { describe, expect, it } from "vitest"
import { extendSubscription, hasActiveSubscription } from "./subscription"

const NOW = new Date("2026-11-06T12:00:00Z")
const days = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000)

describe("extendSubscription", () => {
	it("starts now when the shop never subscribed", () => {
		expect(extendSubscription(null, NOW, 30)).toEqual({ startsAt: NOW, endsAt: days(30) })
	})

	it("starts now when the subscription already ended", () => {
		expect(extendSubscription(days(-3), NOW, 30)).toEqual({ startsAt: NOW, endsAt: days(30) })
	})

	it("adds to the end of a running subscription (2 weeks left + 1 month = 1 month and 2 weeks)", () => {
		expect(extendSubscription(days(14), NOW, 30)).toEqual({ startsAt: days(14), endsAt: days(44) })
	})
})

describe("hasActiveSubscription", () => {
	it("is active only before the end date", () => {
		expect(hasActiveSubscription(null, NOW)).toBe(false)
		expect(hasActiveSubscription(days(-1), NOW)).toBe(false)
		expect(hasActiveSubscription(NOW, NOW)).toBe(false)
		expect(hasActiveSubscription(days(1), NOW)).toBe(true)
	})
})
