import { Injectable } from "@nestjs/common"
import { Config } from "~/config"
import { logger } from "~/libs/logger"

/**
 * Standard api.ir envelope (`ResultDataOf<T>`).
 */
export type ApiIrResponse<T> = {
	/** Whether the request itself was executed successfully. */
	success: boolean
	/** The actual result (for match services: `true` when the data matches). */
	data: T | null
	code?: number | string | null
	message?: string | null
}

export type ShahkarRequest = {
	/** کد ملی */
	nationalCode: string
	/** شماره موبایل با فرمت 09xxxxxxxxx */
	mobile: string
	isCompany?: boolean
}

export type CardMatchRequest = {
	/** کد ملی */
	nationalCode: string
	/** تاریخ تولد شمسی با فرمت 1370/1/1 */
	birthDate: string
	/** شماره ۱۶ رقمی کارت بانکی */
	cardNumber: string
}

export type IdentityCheckResult = {
	/** `true` when api.ir confirmed the data belongs to the same person. */
	matched: boolean
	/** Raw message returned by api.ir, useful for logging / support. */
	message: string | null
	/** `true` when the check was not performed (identityCheck=false). */
	skipped: boolean
}

/**
 * Wrapper around the api.ir identity services (s.api.ir):
 * - Shahkar: mobile number <-> national code
 * - CardMatch: bank card <-> national code + birth date
 */
@Injectable()
export class ShahkarService {
	private readonly baseUrl = "https://s.api.ir/api/sw1"

	constructor(private readonly config: Config) { }

	/**
	 * Checks that `mobile` is registered under `nationalCode` (سامانه شاهکار).
	 */
	async verifyMobileNationalCode(request: ShahkarRequest): Promise<IdentityCheckResult> {
		return this.call("Shahkar", {
			nationalCode: request.nationalCode,
			mobile: request.mobile,
			isCompany: request.isCompany ?? false,
		})
	}

	/**
	 * Checks that the 16-digit `cardNumber` belongs to the person identified by
	 * `nationalCode` + `birthDate` (تطبیق کد ملی با کارت بانکی).
	 */
	async verifyCardMatch(request: CardMatchRequest): Promise<IdentityCheckResult> {
		return this.call("CardMatch", {
			nationalCode: request.nationalCode,
			birthDate: request.birthDate,
			cardNumber: request.cardNumber,
		})
	}

	get isEnabled() {
		return this.config.identityCheck === "true"
	}

	private async call(path: "Shahkar" | "CardMatch", body: Record<string, unknown>): Promise<IdentityCheckResult> {
		if (!this.isEnabled) {
			logger.warn(`[api.ir] identityCheck is disabled, skipping ${path} check.`)
			return { matched: true, message: null, skipped: true }
		}

		const token = this.config.ApiIRToken
		if (!token) {
			throw new Error("ApiIRToken is not set")
		}

		const response = await fetch(`${this.baseUrl}/${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json, text/plain, text/json",
				"Authorization": `Bearer ${token}`,
			},
			body: JSON.stringify(body),
		})

		const json = (await response.json().catch(() => null)) as ApiIrResponse<boolean> | null

		if (!response.ok || !json) {
			logger.error(`[api.ir] ${path} failed with HTTP ${response.status}`, json)
			throw new Error(`api.ir ${path} request failed (${response.status})`)
		}

		if (!json.success) {
			// The service itself could not run the check (bad token, no credit, upstream outage ...).
			logger.error(`[api.ir] ${path} unsuccessful: ${json.message}`, json)
			throw new Error(`api.ir ${path} unsuccessful: ${json.message ?? json.code ?? "unknown"}`)
		}

		return {
			matched: json.data === true,
			message: json.message ?? null,
			skipped: false,
		}
	}
}
