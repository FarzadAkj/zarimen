import type { ZarinpalConfig } from "./config/zarinpal.module-builder"
import { Inject, Injectable } from "@nestjs/common"
import { MODULE_OPTIONS_TOKEN } from "./config/zarinpal.module-builder"

/** Zarinpal reports failures as `{ data: [], errors: { code, message } }`. */
type ZarinpalError = { code: number, message: string }

type RequestOutput = {
	data: { code: number, message: string, authority: string } | []
	errors: ZarinpalError | []
}

type VerifyOutput = {
	data: { code: number, message: string, card_pan: string, ref_id: number } | []
	errors: ZarinpalError | []
}

/** Verification codes meaning "paid": 100 verified now, 101 already verified before. */
const PAID_CODES = [100, 101]

const DEFAULT_BASE_URL = "https://payment.zarinpal.com"

export type PaymentRequest
	= | { ok: true, authority: string }
		| { ok: false, code: number | null, message: string }

export type PaymentVerification
	= | { ok: true, code: number, refId: string, cardPan: string | null }
		| { ok: false, code: number | null, message: string }

/**
 * Zarinpal payment gateway, v4 API (trimmed from Darik's client). Amounts are in Tomans (IRT).
 * Network failures throw; gateway refusals come back as `{ ok: false }`.
 */
@Injectable()
export class ZarinpalService {
	constructor(@Inject(MODULE_OPTIONS_TOKEN) private config: ZarinpalConfig) { }

	async requestPayment(input: { amount: number, description: string, orderId: string, mobile?: string }): Promise<PaymentRequest> {
		const output = await this.post<RequestOutput>("/pg/v4/payment/request.json", {
			merchant_id: this.config.merchantId,
			amount: input.amount,
			currency: "IRT",
			description: input.description,
			callback_url: this.config.callbackUrl,
			metadata: { order_id: input.orderId, mobile: input.mobile },
		})

		if (Array.isArray(output.data) || !output.data.authority)
			return this.refusal(output.errors)
		return { ok: true, authority: output.data.authority }
	}

	/** Where to send the payer's browser for `authority`. */
	gatewayUrl(authority: string) {
		return `${this.baseUrl}/pg/StartPay/${authority}`
	}

	async verifyPayment(input: { amount: number, authority: string }): Promise<PaymentVerification> {
		const output = await this.post<VerifyOutput>("/pg/v4/payment/verify.json", {
			merchant_id: this.config.merchantId,
			amount: input.amount,
			authority: input.authority,
		})

		if (Array.isArray(output.data))
			return this.refusal(output.errors)
		if (!PAID_CODES.includes(output.data.code))
			return { ok: false, code: output.data.code, message: `Zarinpal ${output.data.code}: ${output.data.message}` }
		return { ok: true, code: output.data.code, refId: String(output.data.ref_id), cardPan: output.data.card_pan || null }
	}

	private get baseUrl() {
		return (this.config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "")
	}

	private refusal(errors: ZarinpalError | []): { ok: false, code: number | null, message: string } {
		const error = Array.isArray(errors) ? null : errors
		return { ok: false, code: error?.code ?? null, message: `Zarinpal ${error?.code ?? "?"}: ${error?.message ?? "no data"}` }
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
