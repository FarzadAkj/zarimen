import { describe, expect, it } from "vitest"
import { isValidBankCardNumber } from "./bank-card"
import { isValidJalaliDate } from "./jalali-date"
import { isValidNationalCode } from "./national-code"
import { isValidPhoneNumber } from "./phone-number"
import { isValidSubdomain } from "./subdomain"

describe("isValidNationalCode", () => {
	it("accepts any 10 digits (the rest is Shahkar's job)", () => {
		expect(isValidNationalCode("0499370899")).toBe(true)
		expect(isValidNationalCode("0499370898")).toBe(true)
		expect(isValidNationalCode("1111111111")).toBe(true)
	})

	it("rejects wrong length and non-digits", () => {
		expect(isValidNationalCode("049937089")).toBe(false)
		expect(isValidNationalCode("04993708990")).toBe(false)
		expect(isValidNationalCode("04993708a9")).toBe(false)
		expect(isValidNationalCode("")).toBe(false)
	})
})

describe("isValidPhoneNumber", () => {
	it("accepts 09 + 9 digits only", () => {
		expect(isValidPhoneNumber("09121234567")).toBe(true)
		expect(isValidPhoneNumber("9121234567")).toBe(false)
		expect(isValidPhoneNumber("+989121234567")).toBe(false)
		expect(isValidPhoneNumber("091212345678")).toBe(false)
	})
})

describe("isValidSubdomain", () => {
	it("accepts lowercase names with inner hyphens", () => {
		expect(isValidSubdomain("setoode")).toBe(true)
		expect(isValidSubdomain("gold-rahimi2")).toBe(true)
	})

	it("rejects leading/trailing hyphens, uppercase, dots and other characters", () => {
		expect(isValidSubdomain("-setoode")).toBe(false)
		expect(isValidSubdomain("setoode-")).toBe(false)
		expect(isValidSubdomain("Setoode")).toBe(false)
		expect(isValidSubdomain("a.b")).toBe(false)
		expect(isValidSubdomain("ستوده")).toBe(false)
	})

	it("enforces the length bounds", () => {
		expect(isValidSubdomain("a")).toBe(false)
		expect(isValidSubdomain("ab")).toBe(true)
		expect(isValidSubdomain("a".repeat(30))).toBe(true)
		expect(isValidSubdomain("a".repeat(31))).toBe(false)
	})

	it("rejects reserved names", () => {
		expect(isValidSubdomain("panel")).toBe(false)
		expect(isValidSubdomain("www")).toBe(false)
	})
})

describe("isValidJalaliDate", () => {
	it("accepts padded YYYY/MM/DD dates", () => {
		expect(isValidJalaliDate("1370/01/05")).toBe(true)
		expect(isValidJalaliDate("1402/12/30")).toBe(true)
	})

	it("applies the month lengths", () => {
		expect(isValidJalaliDate("1370/06/31")).toBe(true)
		expect(isValidJalaliDate("1370/07/31")).toBe(false)
		expect(isValidJalaliDate("1370/12/31")).toBe(false)
	})

	it("rejects bad format and out-of-range parts", () => {
		expect(isValidJalaliDate("1370/1/5")).toBe(false)
		expect(isValidJalaliDate("1370-01-05")).toBe(false)
		expect(isValidJalaliDate("1370/13/01")).toBe(false)
		expect(isValidJalaliDate("1370/00/10")).toBe(false)
		expect(isValidJalaliDate("1370/01/00")).toBe(false)
		expect(isValidJalaliDate("1299/01/01")).toBe(false)
	})
})

describe("isValidBankCardNumber", () => {
	it("accepts a Luhn-valid 16-digit number", () => {
		expect(isValidBankCardNumber("6037997599999993")).toBe(true)
	})

	it("rejects a wrong check digit, wrong length and non-digits", () => {
		expect(isValidBankCardNumber("6037997599999992")).toBe(false)
		expect(isValidBankCardNumber("603799759999999")).toBe(false)
		expect(isValidBankCardNumber("60379975999999a3")).toBe(false)
	})
})
