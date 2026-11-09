import type { TicketStatus } from "@/api/Api"
import Link from "next/link"
import { Megaphone } from "lucide-react"
import { Button } from "@/components/shad/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { parsePage } from "@/components/shop-panel/WalletTransactionsTable"
import { NoticesList } from "@/components/ticket/NoticesList"
import { TICKET_STATUS_LABELS } from "@/components/ticket/TicketStatusBadge"
import { TicketsTable } from "@/components/ticket/TicketsTable"
import { cn } from "@/lib/utils"
import { readNotices, readTickets } from "./actions"

const STATUSES = Object.keys(TICKET_STATUS_LABELS) as TicketStatus[]

/** A filter chip: a ticket status, or the admins' notices. */
type View = TicketStatus | "notices" | undefined

function href(view: View, page = 1) {
    const query = new URLSearchParams({
        ...(view === "notices" ? { view } : view && { status: view }),
        ...(page > 1 && { page: String(page) }),
    }).toString()
    return `/panel/tickets${query && `?${query}`}`
}

/**
 * zarimen.ir/panel/tickets — every shop's tickets, optionally one status only (`?status=`),
 * or the notices sent to all shops (`?view=notices`; their per-shop copies are not listed).
 */
export default async function AdminTicketsPage({ searchParams }: { searchParams: Promise<{ page?: string, status?: string, view?: string }> }) {
    const query = await searchParams
    const page = parsePage(query.page)
    const view: View = query.view === "notices" ? "notices" : STATUSES.find(s => s === query.status)

    return (
        <Card>
            <CardHeader>
                <CardTitle>تیکت‌ها</CardTitle>
                <CardDescription>پیام‌های فروشندگان. با هر پیام فروشنده، پیامک اطلاع‌رسانی برای مدیران ارسال می‌شود.</CardDescription>
                <CardAction>
                    <Button asChild>
                        <Link href="/panel/tickets/notice"><Megaphone />ارسال اطلاعیه</Link>
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
                <nav className="flex flex-wrap gap-2 text-sm">
                    {([undefined, ...STATUSES, "notices"] as View[]).map(v => (
                        <Link
                            key={v ?? "all"}
                            href={href(v)}
                            className={cn("rounded-full border px-3 py-1 transition", v === view ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}
                        >
                            {v === "notices" ? "اطلاعیه‌ها" : v ? TICKET_STATUS_LABELS[v] : "همه"}
                        </Link>
                    ))}
                </nav>
                {view === "notices"
                    ? <Notices page={page} />
                    : <Tickets page={page} status={view} />}
            </CardContent>
        </Card>
    )
}

async function Tickets({ page, status }: { page: number, status?: TicketStatus }) {
    const { data, error } = await readTickets(page, status)
    return data
        ? <TicketsTable result={data} page={page} basePath="/panel/tickets" pageHref={p => href(status, p)} showShop />
        : <p className="text-destructive">{error?.translation}</p>
}

async function Notices({ page }: { page: number }) {
    const { data, error } = await readNotices(page)
    return data
        ? <NoticesList result={data} page={page} pageHref={p => href("notices", p)} />
        : <p className="text-destructive">{error?.translation}</p>
}
