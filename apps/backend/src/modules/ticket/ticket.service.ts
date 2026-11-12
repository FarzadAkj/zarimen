import type { Prisma } from "@prisma/client"
import type { CreateTicketInput, SendNoticeInput, TicketMessageInput } from "./dto/ticket.input"
import type { ReadNoticesOutput, ReadTicketsOutput, TicketModel, TicketNoticeModel, TicketSummaryModel } from "./model/ticket.model"
import { Injectable } from "@nestjs/common"
import { TicketStatus } from "@prisma/client"
import { Config } from "~/config"
import { ErrorService } from "~/libs/error/error.service"
import { ImageBucketService } from "~/libs/image-bucket/image-bucket.service"
import { logger } from "~/libs/logger"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { SmsIrService } from "~/libs/sms-ir/sms-ir.service"
import { NOTICES_PAGE_SIZE, ticketNotice, TICKETS_PAGE_SIZE } from "./constants/ticket"
import { TicketErrors } from "./constants/ticket.errors"

/** Who is writing: an admin, or the owner of `shopId` (who only reaches their own tickets). */
export type TicketAuthor = { admin: true } | { shopId: string }

const summarySelect = {
	id: true,
	title: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	noticeId: true,
	shop: { select: { name: true, subdomain: true } },
} satisfies Prisma.TicketSelect

const ticketSelect = {
	...summarySelect,
	messages: {
		orderBy: { createdAt: "asc" },
		select: { id: true, fromAdmin: true, body: true, imageUrls: true, createdAt: true },
	},
} satisfies Prisma.TicketSelect

type SummaryRow = Prisma.TicketGetPayload<{ select: typeof summarySelect }>
type TicketRow = Prisma.TicketGetPayload<{ select: typeof ticketSelect }>

/**
 * Support tickets between shop owners and the admins.
 * Owner message (opening one included) → PENDING and an SMS to every admin.
 * Admin message → ANSWERED and an SMS to the shop owner with a link to the ticket (free: the
 * admins' doing, not a customer's). Only the owner closes;
 * Notices (sendNotice): one admin message to every enabled shop, each as its own CLOSED ticket. a CLOSED ticket takes no more messages.
 */
@Injectable()
export class TicketService {
	constructor(
		private prisma: PrismaService,
		private images: ImageBucketService,
		private sms: SmsIrService,
		private config: Config,
		private error: ErrorService,
	) { }

	async createTicket(shopId: string, input: CreateTicketInput): Promise<TicketModel> {
		const imageUrls = this.checkImages(input.imageUrls)
		const ticket = await this.prisma.ticket.create({
			data: {
				shopId,
				title: input.title.trim(),
				messages: { create: { fromAdmin: false, body: input.body.trim(), imageUrls } },
			},
			select: ticketSelect,
		})
		await this.notifyAdmins(ticket.title)
		return this.toModel(ticket)
	}

	/**
	 * Latest activity first. Owners pass their `shopId` (their notice copies included); admins
	 * pass `noticeId: null` to see every shop's real tickets (notices are read with readNotices).
	 */
	async readTickets(filter: { shopId?: string, status?: TicketStatus, noticeId?: null }, page = 1): Promise<ReadTicketsOutput> {
		const [data, count] = await Promise.all([
			this.prisma.ticket.findMany({
				where: filter,
				orderBy: { updatedAt: "desc" },
				skip: (page - 1) * TICKETS_PAGE_SIZE,
				take: TICKETS_PAGE_SIZE,
				select: summarySelect,
			}),
			this.prisma.ticket.count({ where: filter }),
		])
		return { data: data.map(row => this.toSummary(row)), count, pageSize: TICKETS_PAGE_SIZE }
	}

	async readTicket(ticketId: string, author: TicketAuthor): Promise<TicketModel> {
		const ticket = await this.prisma.ticket.findFirst({ where: this.whereFor(ticketId, author), select: ticketSelect })
		if (!ticket)
			throw this.error.throwErrorToClient(TicketErrors.TicketNotFound)
		return this.toModel(ticket)
	}

	async sendMessage(ticketId: string, author: TicketAuthor, input: TicketMessageInput): Promise<TicketModel> {
		const imageUrls = this.checkImages(input.imageUrls)
		const fromAdmin = "admin" in author
		const ticket = await this.prisma.ticket.findFirst({ where: this.whereFor(ticketId, author), select: { title: true, status: true, shop: { select: { subdomain: true, ownerPhoneNumber: true } } } })
		if (!ticket)
			throw this.error.throwErrorToClient(TicketErrors.TicketNotFound)

		await this.prisma.$transaction(async (tx) => {
			// conditional on "not closed", so a close that lands meanwhile still wins
			const { count } = await tx.ticket.updateMany({
				where: { id: ticketId, status: { not: TicketStatus.CLOSED } },
				data: { status: fromAdmin ? TicketStatus.ANSWERED : TicketStatus.PENDING },
			})
			if (!count)
				throw this.error.throwErrorToClient(TicketErrors.TicketClosed)
			await tx.ticketMessage.create({ data: { ticketId, fromAdmin, body: input.body.trim(), imageUrls } })
		})

		if (fromAdmin)
			await this.notifyOwner(ticket.shop, ticketId)
		else
			await this.notifyAdmins(ticket.title)
		return this.readTicket(ticketId, author)
	}

	/**
	 * Sends a notice: a CLOSED ticket with this one admin message to every enabled shop, all
	 * written together, then (when `sendSms`) the notice SMS template, with the title, to each owner.
	 */
	async sendNotice(input: SendNoticeInput): Promise<TicketNoticeModel> {
		const imageUrls = this.checkImages(input.imageUrls)
		const shops = await this.prisma.shop.findMany({ where: { isActive: true }, select: { id: true, ownerPhoneNumber: true } })
		if (!shops.length)
			throw this.error.throwErrorToClient(TicketErrors.NoShopsToNotify)

		const title = input.title.trim()
		const body = input.body.trim()
		const notice = await this.prisma.ticketNotice.create({
			data: {
				title,
				body,
				imageUrls,
				shopCount: shops.length,
				smsText: input.sendSms ? title : null,
				tickets: {
					create: shops.map(shop => ({
						shopId: shop.id,
						title,
						status: TicketStatus.CLOSED,
						messages: { create: { fromAdmin: true, body, imageUrls } },
					})),
				},
			},
		})

		if (input.sendSms)
			await this.textOwners([...new Set(shops.map(shop => shop.ownerPhoneNumber))], title)
		return this.toNoticeModel(notice)
	}

	/** The admins' notices, newest first. */
	async readNotices(page = 1): Promise<ReadNoticesOutput> {
		const { data, count } = await this.prisma.ticketNotice.findManyAndCount({
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * NOTICES_PAGE_SIZE,
			take: NOTICES_PAGE_SIZE,
		})
		return { data: data.map(row => this.toNoticeModel(row)), count, pageSize: NOTICES_PAGE_SIZE }
	}

	/** Owner only. Closing a closed ticket changes nothing. */
	async closeTicket(ticketId: string, shopId: string): Promise<TicketModel> {
		const { count } = await this.prisma.ticket.updateMany({
			where: { id: ticketId, shopId, status: { not: TicketStatus.CLOSED } },
			data: { status: TicketStatus.CLOSED },
		})
		if (!count && !await this.prisma.ticket.exists({ id: ticketId, shopId }))
			throw this.error.throwErrorToClient(TicketErrors.TicketNotFound)
		return this.readTicket(ticketId, { shopId })
	}

	private whereFor(ticketId: string, author: TicketAuthor): Prisma.TicketWhereInput {
		return "admin" in author ? { id: ticketId } : { id: ticketId, shopId: author.shopId }
	}

	/** Only images uploaded through our own presigned URLs may be attached. */
	private checkImages(imageUrls: string[] = []) {
		if (imageUrls.some(url => !this.images.isOwnImageUrl(url)))
			throw this.error.throwErrorToClient(TicketErrors.InvalidTicketImage)
		return imageUrls
	}

	/** A notice only: if sms.ir fails, the admin's message stays sent. */
	private async notifyOwner(shop: { subdomain: string, ownerPhoneNumber: string }, ticketId: string) {
		try {
			await this.sms.sendTicketAnswered(shop.ownerPhoneNumber, shop.subdomain, ticketId)
		}
		catch (e) {
			logger.warn(`[ticket] answer SMS to shop ${shop.subdomain} failed: ${(e as Error).message}`)
		}
	}

	/**
	 * The notice SMS to each owner, one sms.ir request per number (templates take one number).
	 * Free, like every admin-triggered SMS. A failed number is logged and the rest still go out.
	 */
	private async textOwners(phoneNumbers: string[], title: string) {
		let failed = 0
		for (const phoneNumber of phoneNumbers) {
			try {
				await this.sms.sendNoticeAdded(phoneNumber, title)
			}
			catch {
				failed++
			}
		}
		logger.info(`[ticket] notice SMS sent to ${phoneNumbers.length - failed} of ${phoneNumbers.length} owner(s)`)
	}

	private notifyAdmins(title: string) {
		return this.sms.sendBulkMessage(this.config.adminPhoneNumberList(), ticketNotice(title))
	}

	private toSummary({ shop, noticeId, ...row }: SummaryRow): TicketSummaryModel {
		return { ...row, shopName: shop.name, shopSubdomain: shop.subdomain, isNotice: noticeId !== null }
	}

	private toNoticeModel(row: { id: string, title: string, body: string, imageUrls: string[], shopCount: number, smsText: string | null, createdAt: Date }): TicketNoticeModel {
		const { id, title, body, imageUrls, shopCount, smsText, createdAt } = row
		return { id, title, body, imageUrls, shopCount, smsSent: smsText !== null, createdAt }
	}

	private toModel({ messages, ...row }: TicketRow): TicketModel {
		return { ...this.toSummary(row), messages }
	}
}
