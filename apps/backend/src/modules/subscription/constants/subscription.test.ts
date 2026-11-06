import { describe, expect, it } from "vitest"
import { adminExtension, extendSubscription, hasActiveSubscription } from "./subscription"

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

describe("adminExtension", () => {
	it("refuses a date at or before the running subscription's end", () => {
		expect(adminExtension(days(14), NOW, days(10))).toBeNull()
		expect(adminExtension(days(14), NOW, days(14))).toBeNull()
	})

	it("refuses a date in the past for an ended or missing subscription", () => {
		expect(adminExtension(days(-10), NOW, days(-5))).toBeNull()
		expect(adminExtension(null, NOW, days(-1))).toBeNull()
	})

	it("adds the time after the current end", () => {
		expect(adminExtension(days(14), NOW, days(44))).toEqual({ startsAt: days(14), endsAt: days(44), durationDays: 30 })
	})

	it("starts from now when there is no running subscription", () => {
		expect(adminExtension(null, NOW, days(30))).toEqual({ startsAt: NOW, endsAt: days(30), durationDays: 30 })
	})
})
