import type { Bill } from "../wallet/wallet.service"
import type { OtpSentModel } from "./model/otp-sent.model"
import { randomInt } from "node:crypto"
import { Injectable } from "@nestjs/common"
import { OtpPurpose, PaidService } from "@prisma/client"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { SmsIrService } from "~/libs/sms-ir/sms-ir.service"
import { WalletService } from "../wallet/wallet.service"
import { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS } from "./constants/auth.constants"
import { AuthErrors } from "./constants/auth.errors"

/**
 * An owner's approval code: for one customer (by phone) and one kind of paid check.
 * The owner can have one live code per customer, so several customers can be served at once.
 */
export type OwnerApproval = {
	purpose: typeof OtpPurpose.SIGNUP_APPROVAL | typeof OtpPurpose.CARD_APPROVAL
	customerPhoneNumber: string
}

/**
 * SMS one-time codes, keyed by phone number + purpose (+ customer phone for approval codes). LOGIN codes serve every login (admin, shop
 * owner, customer); approval codes (OwnerApproval) go to a shop owner to approve a customer's paid check, so
 * an approval code can never open the owner's panel (and the two never block each other).
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
	 * Sends a fresh code to `phoneNumber`. With `bill` the SMS is paid from that shop's
	 * wallet (customer codes); without it, it is free (admin / owner logins).
	 * With `approval` it is an owner's approval code (its own template), not a login code.
	 */
	async send(phoneNumber: string, bill?: Bill, approval?: OwnerApproval): Promise<OtpSentModel> {
		if (await this.findActive(phoneNumber, approval))
			throw this.error.throwErrorToClient(AuthErrors.OtpAlreadySent)

		const code = randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0")
		const otp = await this.prisma.authOtp.create({
			data: {
				phoneNumber,
				purpose: approval?.purpose ?? OtpPurpose.LOGIN,
				customerPhoneNumber: approval?.customerPhoneNumber,
				code,
				expireDate: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
			},
		})

		const sendSms = () => approval
			? this.sms.sendOwnerApproval(phoneNumber, code)
			: this.sms.sendOTPMessage(phoneNumber, code)
		try {
			await (bill ? this.wallet.charge(bill, PaidService.SMS, sendSms) : sendSms())
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
	async consume(phoneNumber: string, code: string, approval?: OwnerApproval) {
		const otp = await this.findActive(phoneNumber, approval)
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

	private findActive(phoneNumber: string, approval?: OwnerApproval) {
		return this.prisma.authOtp.findFirst({
			where: {
				phoneNumber,
				purpose: approval?.purpose ?? OtpPurpose.LOGIN,
				customerPhoneNumber: approval?.customerPhoneNumber ?? null,
				isUsed: false,
				expireDate: { gt: new Date() },
			},
			orderBy: { createdAt: "desc" },
		})
	}
}
