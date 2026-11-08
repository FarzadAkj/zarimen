import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { TicketComposer } from "@/components/ticket/TicketComposer"
import { createTicket } from "../../../actions"

/** <subdomain>.zarimen.ir/panel/tickets/new */
export default function NewTicketPage() {
    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>تیکت جدید</CardTitle>
                <CardDescription>پاسخ پشتیبانی در همین بخش نمایش داده می‌شود.</CardDescription>
            </CardHeader>
            <CardContent>
                <TicketComposer side="owner" withTitle submitLabel="ارسال تیکت" onSend={createTicket} />
            </CardContent>
        </Card>
    )
}
