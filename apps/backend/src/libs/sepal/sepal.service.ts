import type { SepalConfig } from "./config/sepal.module-builder"
import { Inject, Injectable } from "@nestjs/common"
import { MODULE_OPTIONS_TOKEN } from "./config/sepal.module-builder"

type RequestOutput = { status: boolean, message?: string, paymentNumber?: string | number }

type VerifyOutput = {
	status: boolean
	message?: string
	referenceNumber?: string | number
	cardNumber?: string
	/** Rials */
	amount?: number
	alreadyVerified?: boolean
}

const DEFAULT_BASE_URL = "https://payment.sepal.ir"

/** SePal works in Rials; the app in whole Tomans. */
const RIALS_PER_TOMAN = 10

export type PaymentRequest
	= | { ok: true, paymentNumber: string }
		| { ok: false, message: string }

export type PaymentVerification
	= | { ok: true, refId: string, cardPan: string | null }
		| { ok: false, message: string }

/**
 * SePal payment gateway. The app's amounts are whole Tomans; they are sent as Rials.
 * Network failures (and non-JSON answers) throw; gateway refusals come back as `{ ok: false }`.
 *
 * Flow: requestPayment → the payer's browser opens gatewayUrl (SePal checks the Origin / Referer,
 * so it must be a navigation from our site) → SePal POSTs the result to `callbackUrl` →
 * verifyPayment.
 */
@Injectable()
export class SepalService {
	constructor(@Inject(MODULE_OPTIONS_TOKEN) private config: SepalConfig) { }

	/**
	 * `amount` in Tomans. `invoiceNumber`: our row id, sent back in the callback.
	 * `callbackUrl`: the backend endpoint SePal posts the result to (one per payment kind).
	 */
	async requestPayment(input: { amount: number, invoiceNumber: string, callbackUrl: string, description: string, payerMobile?: string }): Promise<PaymentRequest> {
		const output = await this.post<RequestOutput>("/api/request.json", {
			apiKey: this.config.apiKey,
			amount: input.amount * RIALS_PER_TOMAN,
			callbackUrl: input.callbackUrl,
			callbackMethod: "post",
			invoiceNumber: input.invoiceNumber,
			description: input.description,
			payerMobile: input.payerMobile,
		})

		if (!output.status || !output.paymentNumber)
			return { ok: false, message: `SePal request: ${output.message || "no paymentNumber"}` }
		return { ok: true, paymentNumber: String(output.paymentNumber) }
	}

	/** Where to send the payer's browser for `paymentNumber` (SePal answers with a form that auto-submits to the bank). */
	gatewayUrl(paymentNumber: string) {
		return `${this.baseUrl}/api/payment/${encodeURIComponent(paymentNumber)}/`
	}

	/**
	 * Paid only if SePal confirms it and the amount it took is `amount` Tomans.
	 * A payment verified before (`alreadyVerified`) counts as paid too.
	 */
	async verifyPayment(input: { paymentNumber: string, invoiceNumber: string, amount: number }): Promise<PaymentVerification> {
		const output = await this.post<VerifyOutput>("/api/verify.json", {
			apiKey: this.config.apiKey,
			paymentNumber: input.paymentNumber,
			invoiceNumber: input.invoiceNumber,
		})

		if (!output.status)
			return { ok: false, message: `SePal verify: ${output.message || "not paid"}` }
		const expected = input.amount * RIALS_PER_TOMAN
		if (Number(output.amount) !== expected)
			return { ok: false, message: `SePal verify: paid ${output.amount} Rials, expected ${expected}` }
		return { ok: true, refId: String(output.referenceNumber ?? ""), cardPan: output.cardNumber || null }
	}

	private get baseUrl() {
		return (this.config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "")
	}

	private async post<T>(path: string, body: unknown): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			method: "POST",
			headers: { "Accept": "application/json", "Content-Type": "application/json" },
			body: JSON.stringify(body),
		})
		return await response.json() as T
	}
}
