import { afterEach, describe, expect, it, vi } from "vitest"
import { SepalService } from "./sepal.service"

const sepal = new SepalService({ apiKey: "KEY" })

/** Stubs fetch with one JSON answer; returns the mock to read what was sent. */
function answer(body: unknown) {
	const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(JSON.stringify(body)))
	vi.stubGlobal("fetch", fetchMock)
	return fetchMock
}

function sentBody(fetchMock: ReturnType<typeof answer>) {
	const [, init] = fetchMock.mock.calls[0]!
	return JSON.parse(init.body as string)
}

afterEach(() => vi.unstubAllGlobals())

describe("sepalService", () => {
	it("requests the amount in Rials with a POST callback and returns the payment number", async () => {
		const fetchMock = answer({ status: true, message: "", paymentNumber: "123456789012345" })
		const result = await sepal.requestPayment({ amount: 55_000, invoiceNumber: "tx-1", callbackUrl: "https://api.zarimen.ir/wallet/topUpCallback", description: "d" })

		expect(result).toEqual({ ok: true, paymentNumber: "123456789012345" })
		expect(fetchMock.mock.calls[0]![0]).toBe("https://payment.sepal.ir/api/request.json")
		expect(sentBody(fetchMock)).toMatchObject({ apiKey: "KEY", amount: 550_000, invoiceNumber: "tx-1", callbackMethod: "post" })
		expect(sepal.gatewayUrl("123456789012345")).toBe("https://payment.sepal.ir/api/payment/123456789012345/")
	})

	it("refuses an amount below SePal's minimum without calling it", async () => {
		const fetchMock = answer({ status: true, paymentNumber: "1" })
		expect(await sepal.requestPayment({ amount: 9_999, invoiceNumber: "tx-1", callbackUrl: "x", description: "d" })).toMatchObject({ ok: false })
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it("reports a refused request", async () => {
		answer({ status: false, message: "مبلغ نامعتبر" })
		expect(await sepal.requestPayment({ amount: 10_000, invoiceNumber: "tx-1", callbackUrl: "x", description: "d" }))
			.toEqual({ ok: false, message: "SePal request: مبلغ نامعتبر" })
	})

	it("accepts a verified payment of exactly the expected amount (already verified too)", async () => {
		const fetchMock = answer({ status: true, referenceNumber: "1234567890123456", cardNumber: "621986******1234", amount: 550_000, alreadyVerified: true })
		expect(await sepal.verifyPayment({ paymentNumber: "123", invoiceNumber: "tx-1", amount: 55_000 }))
			.toEqual({ ok: true, refId: "1234567890123456", cardPan: "621986******1234" })
		expect(sentBody(fetchMock)).toEqual({ apiKey: "KEY", paymentNumber: "123", invoiceNumber: "tx-1" })
	})

	it("refuses a verified payment of a different amount", async () => {
		answer({ status: true, referenceNumber: "1", cardNumber: "6219**1234", amount: 100_000 })
		expect(await sepal.verifyPayment({ paymentNumber: "123", invoiceNumber: "tx-1", amount: 55_000 }))
			.toMatchObject({ ok: false })
	})

	it("refuses an unpaid payment", async () => {
		answer({ status: false, message: "پرداخت انجام نشده" })
		expect(await sepal.verifyPayment({ paymentNumber: "123", invoiceNumber: "tx-1", amount: 55_000 }))
			.toEqual({ ok: false, message: "SePal verify: پرداخت انجام نشده" })
	})
})
