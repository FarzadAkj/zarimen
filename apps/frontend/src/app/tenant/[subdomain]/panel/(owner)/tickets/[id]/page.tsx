import { TicketPage } from "@/components/ticket/TicketPage"
import { readMyTicket, sendMyTicketMessage } from "../../../actions"

/** <subdomain>.zarimen.ir/panel/tickets/<id> */
export default async function ShopTicketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data, error } = await readMyTicket(id)
    return <TicketPage ticket={data} error={error} viewer="owner" onReply={sendMyTicketMessage.bind(null, id)} />
}
