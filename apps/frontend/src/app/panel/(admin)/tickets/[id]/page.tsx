import { TicketPage } from "@/components/ticket/TicketPage"
import { answerTicket, readTicket } from "../actions"

/** zarimen.ir/panel/tickets/<id> */
export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data, error } = await readTicket(id)
    return <TicketPage ticket={data} error={error} viewer="admin" onReply={answerTicket.bind(null, id)} />
}
