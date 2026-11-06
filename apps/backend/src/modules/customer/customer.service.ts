import type { OtpSentModel } from "../auth/model/otp-sent.model"
import type { CustomerJwtPayload, SignupTicketPayload } from "./constants/customer.constants"
import type { CustomerCardModel, CustomerCardsModel } from "./model/customer-card.model"
import type { CustomerTokenModel } from "./model/customer-token.model"
import type { ShopCustomerCardModel, ShopCustomerModel } from "./model/shop-customer.model"
import type { SignupStartedModel } from "./model/signup-started.model"
import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { ShahkarService } from "~/libs/shahkar/shahkar.service"
import { OtpService } from "../auth/otp.service"
import { WalletService } from "../wallet/wallet.service"
import { getBankName } from "./constants/bank-prefixes"
import { maskCardNumber, toCardMatchDate } from "./constants/card"
import { CUSTOMER_ROLE, CUSTOMER_TOKEN_TTL_SECONDS, SIGNUP_TICKET_TTL_SECONDS } from "./constants/customer.constants"
import { CustomerErrors } from "./constants/customer.errors"

type SignupDetails = { ssn: string, phoneNumber: string, birthDate: string }

/**
 * Customer verification on a shop's /verify page:
 * 1. startSignup: Shahkar (phone ↔ national code), then an SMS code
 * 2. completeSignup: the code → customer saved (unique by national code) + linked to the shop
 * 3. readMyCards / addCard: cards confirmed by CardMatch (card ↔ national code + birth date)
 * Returning customers skip 1-2 with startLogin / completeLogin (phone + SMS code).
 * Every Shahkar / CardMatch call and every SMS is paid from the shop's wallet (WalletService).
 */
@Injectable()
export class CustomerService {
	constructor(
		private prisma: PrismaService,
		private shahkar: ShahkarService,
		private otp: OtpService,
		private wallet: WalletService,
		private jwt: JwtService,
		private error: ErrorService,
	) { }

	async startSignup(subdomain: string, details: SignupDetails): Promise<SignupStartedModel> {
		const shop = await this.findActiveShop({ subdomain })

		const existing = await this.prisma.customer.findUnique({ where: { ssn: details.ssn }, select: { birthDate: true } })
		if (existing && existing.birthDate !== details.birthDate)
			throw this.error.throwErrorToClient(CustomerErrors.BirthDateMismatch)

		// Shahkar and the SMS are paid separately; check the wallet covers both before paying for either.
		await this.wallet.assertCanAfford(shop.id, ["shahkar", "sms"])
		await this.verify(shop.id, () => this.shahkar.verifyMobileNationalCode({ mobile: details.phoneNumber, nationalCode: details.ssn }), CustomerErrors.PhoneNationalCodeMismatch)

		const { expiresInSeconds } = await this.otp.send(details.phoneNumber, shop.id)

		const ticket: SignupTicketPayload = { kind: "customer-signup", ...details, shopId: shop.id }
		return {
			ticket: await this.jwt.signAsync(ticket, { expiresIn: SIGNUP_TICKET_TTL_SECONDS }),
			phoneNumber: details.phoneNumber,
			expiresInSeconds,
		}
	}

	/**
	 * Saves the customer once their phone is confirmed by the SMS code. A national code
	 * already on file gets no new row: only its phone (just verified) and its shops change.
	 */
	async completeSignup(ticket: string, code: string): Promise<CustomerTokenModel> {
		const details = await this.jwt.verifyAsync<SignupTicketPayload>(ticket).catch(() => null)
		if (details?.kind !== "customer-signup")
			throw this.error.throwErrorToClient(CustomerErrors.SignupExpired)

		await this.findActiveShop({ id: details.shopId })
		await this.otp.consume(details.phoneNumber, code)

		const existing = await this.prisma.customer.findUnique({ where: { ssn: details.ssn } })
		if (existing && existing.birthDate !== details.birthDate)
			throw this.error.throwErrorToClient(CustomerErrors.BirthDateMismatch)

		const customer = existing
			? await this.prisma.customer.update({ where: { id: existing.id }, data: { phoneNumber: details.phoneNumber } })
			: await this.prisma.customer.create({ data: { ssn: details.ssn, phoneNumber: details.phoneNumber, birthDate: details.birthDate } })

		return this.openSession(customer.id, details.shopId)
	}

	async startLogin(subdomain: string, phoneNumber: string): Promise<OtpSentModel> {
		const shop = await this.findActiveShop({ subdomain })
		await this.findCustomerByPhone(phoneNumber)
		return this.otp.send(phoneNumber, shop.id)
	}

	async completeLogin(subdomain: string, phoneNumber: string, code: string): Promise<CustomerTokenModel> {
		const shop = await this.findActiveShop({ subdomain })
		const customer = await this.findCustomerByPhone(phoneNumber)
		await this.otp.consume(phoneNumber, code)
		return this.openSession(customer.id, shop.id)
	}

	async readMyCards(customerId: string): Promise<CustomerCardsModel> {
		const customer = await this.prisma.customer.findUniqueOrThrow({
			where: { id: customerId },
			select: { phoneNumber: true, cards: { orderBy: { createdAt: "asc" } } },
		})
		return { phoneNumber: customer.phoneNumber, cards: customer.cards.map(card => this.toCardModel(card)) }
	}

	/**
	 * Adds the card once CardMatch confirms it belongs to the customer's national code +
	 * birth date. The check is paid by `shopId`, the shop the customer's session is on.
	 */
	async addCard(customerId: string, shopId: string, cardNumber: string): Promise<CustomerCardsModel> {
		await this.findActiveShop({ id: shopId })
		const customer = await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } })

		if (await this.prisma.customerCard.exists({ customerId, cardNumber }))
			throw this.error.throwErrorToClient(CustomerErrors.CardAlreadyAdded)

		await this.verify(shopId, () => this.shahkar.verifyCardMatch({
			nationalCode: customer.ssn,
			birthDate: toCardMatchDate(customer.birthDate),
			cardNumber,
		}), CustomerErrors.CardNotOwned)

		await this.prisma.customerCard.create({ data: { customerId, cardNumber } })
		return this.readMyCards(customerId)
	}

	/**
	 * The shop owner's customers, most recently seen first. `search` (digits) matches
	 * anywhere in the national code or the mobile number. Cards are only counted here.
	 */
	async readShopCustomers(shopId: string, search?: string): Promise<ShopCustomerModel[]> {
		const links = await this.prisma.customerShop.findMany({
			where: {
				shopId,
				...(search && { customer: { OR: [{ ssn: { contains: search, mode: "insensitive" } }, { phoneNumber: { contains: search, mode: "insensitive" } }] } }),
			},
			orderBy: { lastSeenAt: "desc" },
			select: {
				createdAt: true,
				lastSeenAt: true,
				customer: {
					select: { id: true, ssn: true, phoneNumber: true, birthDate: true, _count: { select: { cards: true } } },
				},
			},
		})
		return links.map(({ customer: { _count, ...customer }, createdAt, lastSeenAt }) => ({
			...customer,
			firstSeenAt: createdAt,
			lastSeenAt,
			cardCount: _count.cards,
		}))
	}

	/**
	 * Full card numbers of one of the shop's customers, for the owner who asks to see them.
	 * Only customers linked to `shopId`: an owner can never read another shop's customer.
	 */
	async readShopCustomerCards(shopId: string, customerId: string): Promise<ShopCustomerCardModel[]> {
		const link = await this.prisma.customerShop.findUnique({
			where: { customerId_shopId: { customerId, shopId } },
			select: { customer: { select: { cards: { orderBy: { createdAt: "asc" } } } } },
		})
		if (!link)
			throw this.error.throwErrorToClient(CustomerErrors.CustomerNotFound)

		return link.customer.cards.map(card => ({
			id: card.id,
			cardNumber: card.cardNumber,
			bankName: getBankName(card.cardNumber),
			createdAt: card.createdAt,
		}))
	}

	/** Links the customer to the shop (or refreshes the link) and issues a short session. */
	private async openSession(customerId: string, shopId: string): Promise<CustomerTokenModel> {
		await this.prisma.customerShop.upsert({
			where: { customerId_shopId: { customerId, shopId } },
			create: { customerId, shopId },
			update: { lastSeenAt: new Date() },
		})

		const payload: CustomerJwtPayload = { role: CUSTOMER_ROLE, customerId, shopId }
		return {
			token: await this.jwt.signAsync(payload, { expiresIn: CUSTOMER_TOKEN_TTL_SECONDS }),
			expiresInSeconds: CUSTOMER_TOKEN_TTL_SECONDS,
		}
	}

	private async findActiveShop(where: { subdomain: string } | { id: string }) {
		const shop = await this.prisma.shop.findUnique({ where, select: { id: true, isActive: true } })
		if (!shop)
			throw this.error.throwErrorToClient(CustomerErrors.ShopNotFound)
		if (!shop.isActive)
			throw this.error.throwErrorToClient(CustomerErrors.ShopDisabled)
		return shop
	}

	/** The phone may once have belonged to someone else; the latest verified owner wins. */
	private async findCustomerByPhone(phoneNumber: string) {
		const customer = await this.prisma.customer.findFirst({ where: { phoneNumber }, orderBy: { updatedAt: "desc" } })
		if (!customer)
			throw this.error.throwErrorToClient(CustomerErrors.NotRegistered)
		return customer
	}

	/**
	 * Runs a Shahkar / CardMatch check paid by the shop's wallet: `mismatch` when it says no
	 * (still paid: the check was done), unavailable when it cannot answer (refunded).
	 */
	private async verify(shopId: string, check: () => Promise<{ matched: boolean }>, mismatch: (typeof CustomerErrors)[keyof typeof CustomerErrors]) {
		let matched: boolean
		try {
			({ matched } = await this.wallet.charge(shopId, "shahkar", check))
		}
		catch (e) {
			// e.g. the shop's wallet cannot pay for the check
			if (e instanceof GlobalError)
				throw e
			throw this.error.throwErrorToClient(CustomerErrors.IdentityServiceUnavailable, e as Error)
		}
		if (!matched)
			throw this.error.throwErrorToClient(mismatch)
	}

	private toCardModel(card: { id: string, cardNumber: string, createdAt: Date }): CustomerCardModel {
		return {
			id: card.id,
			maskedNumber: maskCardNumber(card.cardNumber),
			bankName: getBankName(card.cardNumber),
			createdAt: card.createdAt,
		}
	}
}
