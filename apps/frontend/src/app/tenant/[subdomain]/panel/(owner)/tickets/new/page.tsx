import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { TicketComposer } from "@/components/ticket/TicketComposer"
import { createTicket } from "../../../actions"

/**
 * <subdomain>.zarimen.ir/panel/tickets/new — `?title=` / `?body=` prefill the form (the payment
 * dialog sends the owner here while online payment is off).
 */
export default async function NewTicketPage({ searchParams }: { searchParams: Promise<{ title?: string, body?: string }> }) {
    const { title, body } = await searchParams
    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>تیکت جدید</CardTitle>
                <CardDescription>پاسخ پشتیبانی در همین بخش نمایش داده می‌شود.</CardDescription>
            </CardHeader>
            <CardContent>
                <TicketComposer side="owner" withTitle submitLabel="ارسال تیکت" initialTitle={title} initialBody={body} onSend={createTicket} />
            </CardContent>
        </Card>
    )
}
