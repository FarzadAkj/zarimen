import { beforeEach, describe, expect, it, vi } from "vitest"
import { GlobalError } from "~/libs/error/classes/global-error"
import { ErrorService } from "~/libs/error/error.service"
import { ticketNotice } from "./constants/ticket"
import { TicketService } from "./ticket.service"
import "reflect-metadata"

const BUCKET = "https://bucket.example/zar-imen/"
const ADMINS = ["09120000000", "09130000000"]

type Ticket = { id: string, shopId: string, title: string, status: string, noticeId: string | null, createdAt: Date, updatedAt: Date }
type Message = { id: string, ticketId: string, fromAdmin: boolean, body: string, imageUrls: string[], createdAt: Date }

/** In-memory stand-in for the Prisma calls TicketService makes. */
function createPrisma() {
	const tickets: Ticket[] = []
	const notices: { id: string, title: string, body: string, imageUrls: string[], shopCount: number, smsText: string | null, createdAt: Date }[] = []
	/** shop-1 is the owner's shop used throughout; shop-2 shares its owner's phone; shop-3 is disabled. */
	const shops = [
		{ id: "shop-1", isActive: true, ownerPhoneNumber: "09350000001" },
		{ id: "shop-2", isActive: true, ownerPhoneNumber: "09350000001" },
		{ id: "shop-4", isActive: true, ownerPhoneNumber: "09350000004" },
		{ id: "shop-3", isActive: false, ownerPhoneNumber: "09350000003" },
	]
	const messages: Message[] = []
	const shop = { name: "طلای ستوده", subdomain: "setoode", ownerPhoneNumber: "09350000001" }

	/** Supports the `where` shapes the service uses: plain equality and `{ not: value }`. */
	const match = (row: Record<string, unknown>, where: Record<string, unknown> = {}) =>
		Object.entries(where).every(([k, v]) => v === undefined
			|| (v !== null && typeof v === "object" && "not" in v ? row[k] !== v.not : row[k] === v))

	const withRelations = (t: Ticket) => ({
		...t,
		shop,
		messages: messages.filter(m => m.ticketId === t.id).map(({ ticketId: _, ...m }) => m),
	})

	const prisma = {
		tickets,
		messages,
		shops,
		shop: {
			findMany: async ({ where }: { where: { isActive: boolean } }) => shops.filter(shop => shop.isActive === where.isActive),
		},
		ticketNotice: {
			create: async ({ data }: { data: { title: string, body: string, imageUrls: string[], shopCount: number, smsText: string | null, tickets: { create: { shopId: string, title: string, status: string, messages: { create: Omit<Message, "id" | "ticketId" | "createdAt"> } }[] } } }) => {
				const { tickets: copies, ...fields } = data
				const notice = { id: `n-${notices.length + 1}`, createdAt: new Date(), ...fields }
				notices.push(notice)
				for (const copy of copies.create) {
					const ticket: Ticket = { id: `t-${tickets.length + 1}`, shopId: copy.shopId, title: copy.title, status: copy.status, noticeId: notice.id, createdAt: new Date(), updatedAt: new Date() }
					tickets.push(ticket)
					messages.push({ id: `m-${messages.length + 1}`, ticketId: ticket.id, createdAt: new Date(), ...copy.messages.create })
				}
				return notice
			},
			findManyAndCount: async () => ({ data: [...notices].reverse(), count: notices.length }),
		},
		$transaction: async (work: (tx: unknown) => unknown) => work(prisma),
		ticket: {
			create: async ({ data }: { data: { shopId: string, title: string, messages: { create: Omit<Message, "id" | "ticketId" | "createdAt"> } } }) => {
				const ticket: Ticket = { id: `t-${tickets.length + 1}`, shopId: data.shopId, title: data.title, status: "PENDING", noticeId: null, createdAt: new Date(), updatedAt: new Date() }
				tickets.push(ticket)
				messages.push({ id: `m-${messages.length + 1}`, ticketId: ticket.id, createdAt: new Date(), ...data.messages.create })
				return withRelations(ticket)
			},
			findFirst: async ({ where }: { where: Record<string, unknown> }) => {
				const ticket = tickets.find(t => match(t, where))
				return ticket ? withRelations(ticket) : null
			},
			findMany: async ({ where }: { where: Record<string, unknown> }) => tickets.filter(t => match(t, where)).map(withRelations),
			count: async ({ where }: { where: Record<string, unknown> }) => tickets.filter(t => match(t, where)).length,
			exists: async (where: Record<string, unknown>) => tickets.some(t => match(t, where)),
			updateMany: async ({ where, data }: { where: Record<string, unknown>, data: Partial<Ticket> }) => {
				const rows = tickets.filter(t => match(t, where))
				rows.forEach(t => Object.assign(t, data, { updatedAt: new Date() }))
				return { count: rows.length }
			},
		},
		ticketMessage: {
			create: async ({ data }: { data: Omit<Message, "id" | "createdAt"> }) => {
				const row = { id: `m-${messages.length + 1}`, createdAt: new Date(), ...data }
				messages.push(row)
				return row
			},
		},
	}
	return prisma
}

function errorCode(promise: Promise<unknown>) {
	return promise.then(
		() => "resolved",
		(e: unknown) => (e instanceof GlobalError ? e.errorContext.message : String(e)),
	)
}

describe("ticketService", () => {
	let prisma: ReturnType<typeof createPrisma>
	let sms: { sendBulkMessage: ReturnType<typeof vi.fn>, sendTicketAnswered: ReturnType<typeof vi.fn> }
	let service: TicketService

	const owner = { shopId: "shop-1" }
	const admin = { admin: true } as const

	beforeEach(() => {
		prisma = createPrisma()
		sms = { sendBulkMessage: vi.fn(async () => {}), sendTicketAnswered: vi.fn(async () => {}) }
		const images = { isOwnImageUrl: (url: string) => url.startsWith(BUCKET) }
		const config = { adminPhoneNumberList: () => ADMINS }
		service = new TicketService(prisma as never, images as never, sms as never, config as never, new ErrorService())
	})

	const open = () => service.createTicket(owner.shopId, { title: "  شارژ کیف پول ", body: "کار نمی‌کند", imageUrls: [`${BUCKET}a.jpg`] })

	it("opens a PENDING ticket with the first message and texts every admin", async () => {
		const ticket = await open()

		expect(ticket.status).toBe("PENDING")
		expect(ticket.title).toBe("شارژ کیف پول")
		expect(ticket.messages).toEqual([expect.objectContaining({ fromAdmin: false, body: "کار نمی‌کند", imageUrls: [`${BUCKET}a.jpg`] })])
		expect(sms.sendBulkMessage).toHaveBeenCalledWith(ADMINS, "تیکتی با موضوع شارژ کیف پول ارسال شده است.")
	})

	it("admin reply → ANSWERED and only the owner is texted; owner reply → back to PENDING, admins texted", async () => {
		const { id } = await open()
		sms.sendBulkMessage.mockClear()

		const answered = await service.sendMessage(id, admin, { body: "بررسی شد" })
		expect(answered.status).toBe("ANSWERED")
		expect(answered.messages.at(-1)).toMatchObject({ fromAdmin: true, body: "بررسی شد" })
		expect(sms.sendBulkMessage).not.toHaveBeenCalled()
		expect(sms.sendTicketAnswered).toHaveBeenCalledWith("09350000001", "setoode", id)

		const pending = await service.sendMessage(id, owner, { body: "هنوز مشکل دارد" })
		expect(pending.status).toBe("PENDING")
		expect(pending.messages).toHaveLength(3)
		expect(sms.sendBulkMessage).toHaveBeenCalledWith(ADMINS, ticketNotice("شارژ کیف پول"))
		expect(sms.sendTicketAnswered).toHaveBeenCalledTimes(1)
	})

	it("the admin's message stays sent when the owner's SMS fails", async () => {
		const { id } = await open()
		sms.sendTicketAnswered.mockRejectedValueOnce(new Error("sms.ir down"))
		expect((await service.sendMessage(id, admin, { body: "بررسی شد" })).status).toBe("ANSWERED")
	})

	it("owner can keep writing while PENDING", async () => {
		const { id } = await open()
		const ticket = await service.sendMessage(id, owner, { body: "توضیح بیشتر" })
		expect(ticket.status).toBe("PENDING")
		expect(sms.sendBulkMessage).toHaveBeenCalledTimes(2)
	})

	it("a CLOSED ticket takes no messages from anyone", async () => {
		const { id } = await open()
		expect((await service.closeTicket(id, owner.shopId)).status).toBe("CLOSED")

		expect(await errorCode(service.sendMessage(id, owner, { body: "x" }))).toBe("TicketClosed")
		expect(await errorCode(service.sendMessage(id, admin, { body: "x" }))).toBe("TicketClosed")
		expect(prisma.messages).toHaveLength(1)
		// closing again changes nothing
		expect((await service.closeTicket(id, owner.shopId)).status).toBe("CLOSED")
	})

	it("an owner cannot read, write to or close another shop's ticket", async () => {
		const { id } = await open()
		const other = { shopId: "shop-2" }

		expect(await errorCode(service.readTicket(id, other))).toBe("TicketNotFound")
		expect(await errorCode(service.sendMessage(id, other, { body: "x" }))).toBe("TicketNotFound")
		expect(await errorCode(service.closeTicket(id, other.shopId))).toBe("TicketNotFound")
		expect(prisma.tickets[0]!.status).toBe("PENDING")
	})

	it("refuses images that are not from our bucket folder", async () => {
		expect(await errorCode(service.createTicket(owner.shopId, { title: "t", body: "b", imageUrls: ["https://evil.example/x.jpg"] }))).toBe("InvalidTicketImage")
		const { id } = await open()
		expect(await errorCode(service.sendMessage(id, admin, { body: "b", imageUrls: ["https://bucket.example/other/x.jpg"] }))).toBe("InvalidTicketImage")
	})

	it("lists only the owner's own tickets, filtered by status", async () => {
		const { id } = await open()
		await service.createTicket("shop-2", { title: "دیگری", body: "b" })
		await service.sendMessage(id, admin, { body: "پاسخ" })

		expect((await service.readTickets({ shopId: owner.shopId })).count).toBe(1)
		expect((await service.readTickets({})).count).toBe(2)
		expect((await service.readTickets({ status: "ANSWERED" })).data.map(t => t.id)).toEqual([id])
	})

	describe("notices", () => {
		const notice = { title: " تعطیلی نوروز ", body: " پشتیبانی تا ۵ فروردین تعطیل است. ", imageUrls: [`${BUCKET}n.jpg`], smsText: " اطلاعیه جدید " }

		it("gives every enabled shop a CLOSED ticket with the one admin message", async () => {
			const sent = await service.sendNotice(notice)
			expect(sent).toMatchObject({ title: "تعطیلی نوروز", body: "پشتیبانی تا ۵ فروردین تعطیل است.", shopCount: 3, smsText: "اطلاعیه جدید" })
			expect(prisma.tickets.map(t => [t.shopId, t.status])).toEqual([["shop-1", "CLOSED"], ["shop-2", "CLOSED"], ["shop-4", "CLOSED"]])

			const copy = (await service.readTickets({ shopId: owner.shopId })).data[0]!
			expect(copy.isNotice).toBe(true)
			expect((await service.readTicket(copy.id, owner)).messages).toEqual([
				expect.objectContaining({ fromAdmin: true, body: "پشتیبانی تا ۵ فروردین تعطیل است.", imageUrls: [`${BUCKET}n.jpg`] }),
			])
			expect(await errorCode(service.sendMessage(copy.id, owner, { body: "سلام" }))).toBe("TicketClosed")
		})

		it("texts each owner once, with the admin's text", async () => {
			await service.sendNotice(notice)
			expect(sms.sendBulkMessage).toHaveBeenCalledWith(["09350000001", "09350000004"], "اطلاعیه جدید")
		})

		it("sends no SMS when the admin skips it", async () => {
			await service.sendNotice({ ...notice, smsText: undefined })
			await service.sendNotice({ ...notice, smsText: "   " })
			expect(sms.sendBulkMessage).not.toHaveBeenCalled()
			expect((await service.readNotices()).data.map(n => n.smsText)).toEqual([null, null])
		})

		it("keeps the copies out of the admins' ticket list, which shows the notice once", async () => {
			await open()
			await service.sendNotice(notice)
			expect((await service.readTickets({ noticeId: null })).count).toBe(1)
			expect((await service.readNotices()).count).toBe(1)
		})

		it("refuses a notice no shop would receive, and foreign images", async () => {
			expect(await errorCode(service.sendNotice({ ...notice, imageUrls: ["https://evil.example/x.jpg"] }))).toBe("InvalidTicketImage")
			prisma.shops.forEach(shop => shop.isActive = false)
			expect(await errorCode(service.sendNotice(notice))).toBe("NoShopsToNotify")
			expect(prisma.tickets).toHaveLength(0)
		})
	})
})
