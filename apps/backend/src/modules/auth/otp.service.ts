import type { OtpSentModel } from "./model/otp-sent.model"
import { randomInt } from "node:crypto"
import { Injectable } from "@nestjs/common"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { SmsIrService } from "~/libs/sms-ir/sms-ir.service"
import { WalletService } from "../wallet/wallet.service"
import { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS } from "./constants/auth.constants"
import { AuthErrors } from "./constants/auth.errors"

/**
 * SMS one-time codes, keyed by phone number. Used by every login: admin, shop owner, customer.
 * Callers decide *who* may get a code; this only sends and checks it.
 */
@Injectable()
export class OtpService {
	constructor(
		private prisma: PrismaService,
		private sms: SmsIrService,
		private wallet: WalletService,
		private error: ErrorService,
	) { }

	/**
	 * Sends a fresh code to `phoneNumber`. With `billToShopId` the SMS is paid from that
	 * shop's wallet (customer codes); without it, it is free (admin / owner logins).
	 */
	async send(phoneNumber: string, billToShopId?: string): Promise<OtpSentModel> {
		if (await this.findActive(phoneNumber))
			throw this.error.throwErrorToClient(AuthErrors.OtpAlreadySent)

		const code = randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0")
		const otp = await this.prisma.authOtp.create({
			data: {
				phoneNumber,
				code,
				expireDate: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
			},
		})

		const sendSms = () => this.sms.sendOTPMessage(phoneNumber, code)
		try {
			await (billToShopId ? this.wallet.charge(billToShopId, "sms", sendSms) : sendSms())
		}
		catch (e) {
			// Nobody received this code, so it must not block a retry for OTP_TTL.
			await this.prisma.authOtp.delete({ where: { id: otp.id } })
			// e.g. the shop's wallet cannot pay for the SMS
			if (e instanceof GlobalError)
				throw e
			throw this.error.throwErrorToClient(AuthErrors.SmsFailure, e as Error)
		}

		return { phoneNumber, expiresInSeconds: OTP_TTL_SECONDS }
	}

	/** Marks the phone's active code used if `code` matches it; counts a wrong guess otherwise. */
	async consume(phoneNumber: string, code: string) {
		const otp = await this.findActive(phoneNumber)
		if (!otp)
			throw this.error.throwErrorToClient(AuthErrors.OtpIsNotValid)

		if (otp.code !== code) {
			const attempts = otp.attempts + 1
			await this.prisma.authOtp.update({
				where: { id: otp.id },
				data: { attempts, isUsed: attempts >= OTP_MAX_ATTEMPTS },
			})
			throw this.error.throwErrorToClient(AuthErrors.OtpIsNotValid)
		}

		await this.prisma.authOtp.update({ where: { id: otp.id }, data: { isUsed: true } })
	}

	private findActive(phoneNumber: string) {
		return this.prisma.authOtp.findFirst({
			where: { phoneNumber, isUsed: false, expireDate: { gt: new Date() } },
			orderBy: { createdAt: "desc" },
		})
	}
}
