/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { ReadNoticesOutput, ReadTicketsOutput, SendNoticeInput, TicketModel, TicketNoticeModel, TicketStatus } from "@/api/Api"
import { takeApi } from "@/lib/take-api"
import { toErrorOutput } from "@/lib/errors"

export async function readTickets(page: number, status?: TicketStatus): Promise<ServerResponse<ReadTicketsOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.ticket.readTickets({ page, status })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readTicket(ticketId: string): Promise<ServerResponse<TicketModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.ticket.readTicket({ ticketId })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Bound to a ticket id by the page: `answerTicket.bind(null, id)`. The ticket becomes ANSWERED. */
export async function answerTicket(ticketId: string, input: { body: string, imageUrls: string[] }): Promise<ServerResponse<TicketModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.ticket.answerTicket({ ticketId, ...input })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** A CLOSED ticket with this message to every enabled shop; `smsText` (if any) is texted to the owners. */
export async function sendNotice(input: SendNoticeInput): Promise<ServerResponse<TicketNoticeModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.ticket.sendNotice(input)
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readNotices(page: number): Promise<ServerResponse<ReadNoticesOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.ticket.readNotices({ page })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}
