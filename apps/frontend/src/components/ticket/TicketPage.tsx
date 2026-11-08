import type { ServerResponse } from "@/app/types"
import type { TicketModel } from "@/api/Api"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { formatDateTime } from "@/lib/format-date"
import { CloseTicketButton } from "./CloseTicketButton"
import { TicketComposer } from "./TicketComposer"
import { TicketStatusBadge } from "./TicketStatusBadge"
import { TicketThread } from "./TicketThread"

/** One ticket for the owner or an admin: header, messages, and the reply form until it is closed. */
export function TicketPage({ ticket, error, viewer, onReply }: {
    ticket?: TicketModel
    error?: { translation: string }
    viewer: "owner" | "admin"
    /** The reply server action bound to this ticket's id. */
    onReply: (message: { body: string, imageUrls: string[] }) => Promise<ServerResponse<TicketModel>>
}) {
    const back = (
        <Link href="/panel/tickets" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary w-fit">
            <ChevronRight className="size-4" />
            همه تیکت‌ها
        </Link>
    )
    if (!ticket)
        return <div className="grid gap-4">{back}<p className="text-destructive">{error?.translation}</p></div>

    const closed = ticket.status === "CLOSED"
    return (
        <div className="grid gap-4">
            {back}
            <Card>
                <CardHeader className="flex flex-wrap items-start gap-3">
                    <div className="grid gap-1.5 flex-1">
                        <CardTitle className="flex flex-wrap items-center gap-2">
                            {ticket.title}
                            <TicketStatusBadge status={ticket.status} />
                        </CardTitle>
                        <CardDescription>
                            {viewer === "admin" && `${ticket.shopName} · `}
                            ثبت شده در {formatDateTime(ticket.createdAt)}
                        </CardDescription>
                    </div>
                    {viewer === "owner" && !closed && <CloseTicketButton ticketId={ticket.id} />}
                </CardHeader>
                <CardContent>
                    <TicketThread ticket={ticket} viewer={viewer} />
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    {closed
                        ? <p className="text-center text-muted-foreground">این تیکت بسته شده است و پیام جدیدی نمی‌پذیرد.</p>
                        : <TicketComposer side={viewer} submitLabel={viewer === "admin" ? "ارسال پاسخ" : "ارسال پیام"} onSend={onReply} />}
                </CardContent>
            </Card>
        </div>
    )
}
