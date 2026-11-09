import type { SmsIrConfig } from "./config/sms-ir.module-builder"
import { Inject, Injectable } from "@nestjs/common"
import { logger } from "../logger"
import { MODULE_OPTIONS_TOKEN } from "./config/sms-ir.module-builder"

/**
 * sms.ir client (copied from Darik): OTP codes and plain-text bulk notices.
 */
@Injectable()
export class SmsIrService {
	constructor(@Inject(MODULE_OPTIONS_TOKEN) private config: SmsIrConfig) { }

	/**
	 * Sends `code` with the OTP template. Throws when sms.ir rejects the request, so the
	 * caller can tell the user instead of making them wait for a code that never comes.
	 * The code is always printed to the console; with `sendSms=false` nothing is sent.
	 */
	async sendOTPMessage(phoneNumber: string, code: string) {
		logger.log(`Sms OTP for ${phoneNumber} is: ${code}`)
		await this.sendTemplate(phoneNumber, this.config.otpTemplate, { CODE: code })
	}

	/** A canceled shop request (a failed check or the admin's decision); one `INFO` parameter. */
	sendShopRejected(phoneNumber: string, info: string) {
		return this.sendTemplate(phoneNumber, this.config.shopRejectedTemplate, { INFO: info })
	}

	/** A registered shop request; one `SUBDOMAIN` parameter. */
	sendShopWelcome(phoneNumber: string, subdomain: string) {
		return this.sendTemplate(phoneNumber, this.config.shopWelcomeTemplate, { SUBDOMAIN: subdomain })
	}

	/**
	 * Tells the shop owner a customer added a card; the template links to
	 * https://#SUBDOMAIN#.zarimen.ir/panel/customers?ssn=#SSN# (filtered, cards dialog open).
	 */
	sendCardAdded(phoneNumber: string, subdomain: string, ssn: string) {
		return this.sendTemplate(phoneNumber, this.config.cardAddedTemplate, { SUBDOMAIN: subdomain, SSN: ssn })
	}

	/** Tells the shop owner an admin wrote in their ticket; links to https://#SUBDOMAIN#.zarimen.ir/panel/tickets/#UUID#. */
	sendTicketAnswered(phoneNumber: string, subdomain: string, ticketId: string) {
		return this.sendTemplate(phoneNumber, this.config.ticketAnsweredTemplate, { SUBDOMAIN: subdomain, UUID: ticketId })
	}

	/**
	 * sms.ir "verify" send: `template` with its #NAME# parameters. Throws when sms.ir refuses,
	 * so the caller can tell the user. With `sendSms=false` it is only logged.
	 */
	private async sendTemplate(phoneNumber: string, template: string, parameters: Record<string, string>) {
		if (!this.config.sendSms) {
			logger.log(`Sms template ${template} to ${phoneNumber}: ${JSON.stringify(parameters)}`)
			return
		}

		const response = await fetch("https://api.sms.ir/v1/send/verify", {
			method: "POST",
			headers: {
				"x-api-key": this.config.secret,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				Mobile: phoneNumber,
				TemplateId: Number(template),
				Parameters: Object.entries(parameters).map(([Name, Value]) => ({ Name, Value })),
			}),
		})

		if (!response.ok) {
			logger.error(`[sms.ir] verify failed with HTTP ${response.status}`, await response.text().catch(() => ""))
			throw new Error(`sms.ir request failed (${response.status})`)
		}
	}

	/**
	 * Sends `text` to every number in `mobiles` (sms.ir bulk send, from `lineNumber`).
	 * A notice, not part of any flow: failures are logged, never thrown (like Darik's
	 * sendPurchasedNotifyMessage). With `sendSms=false` the text is only logged.
	 */
	async sendBulkMessage(mobiles: string[], text: string) {
		logger.log(`Sms to ${mobiles.join(", ")}: ${text}`)
		if (!this.config.sendSms)
			return

		try {
			const response = await fetch("https://api.sms.ir/v1/send/bulk", {
				method: "POST",
				headers: {
					"x-api-key": this.config.secret,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					lineNumber: Number(this.config.lineNumber),
					messageText: text,
					mobiles,
				}),
			})
			if (!response.ok)
				logger.error(`[sms.ir] bulk send failed with HTTP ${response.status}`, await response.text().catch(() => ""))
		}
		catch (error) {
			logger.error("[sms.ir] bulk send failed", error)
		}
	}
}
