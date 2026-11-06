import { describe, expect, it } from "vitest"
import { isValidBankCardNumber } from "./bank-card"
import { isValidJalaliDate } from "./jalali-date"
import { isValidNationalCode } from "./national-code"
import { isValidPhoneNumber } from "./phone-number"
import { isValidSubdomain } from "./subdomain"

describe("isValidNationalCode", () => {
	it("accepts codes with a correct check digit", () => {
		expect(isValidNationalCode("0499370899")).toBe(true) // remainder >= 2
		expect(isValidNationalCode("0790419904")).toBe(true)
	})

	it("handles the remainder < 2 branch", () => {
		// 3*3 + 1*2 = 11 → remainder 0 → check digit must be 0
		expect(isValidNationalCode("0000000310")).toBe(true)
		expect(isValidNationalCode("0000000319")).toBe(false)
		// 4*3 = 12 → remainder 1 → check digit must be 1
		expect(isValidNationalCode("0000000401")).toBe(true)
		expect(isValidNationalCode("0000000410")).toBe(false)
	})

	it("rejects a wrong check digit", () => {
		expect(isValidNationalCode("0499370898")).toBe(false)
	})

	it("rejects all-same-digit codes, wrong length and non-digits", () => {
		expect(isValidNationalCode("1111111111")).toBe(false)
		expect(isValidNationalCode("049937089")).toBe(false)
		expect(isValidNationalCode("04993708990")).toBe(false)
		expect(isValidNationalCode("04993708a9")).toBe(false)
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
