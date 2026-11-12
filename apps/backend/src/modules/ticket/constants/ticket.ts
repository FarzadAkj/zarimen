export const TICKETS_PAGE_SIZE = 20

/** Photos one message may carry. */
export const MAX_TICKET_IMAGES = 2

export const MAX_TICKET_TITLE_LENGTH = 150
export const MAX_TICKET_BODY_LENGTH = 4000

export const NOTICES_PAGE_SIZE = 20

/** What the admins get by SMS on every owner message (opening a ticket included). */
export function ticketNotice(title: string) {
	return `تیکتی با موضوع ${title} ارسال شده است.`
}
