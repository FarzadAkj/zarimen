import type { TicketStatus } from "@/api/Api"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { parsePage } from "@/components/shop-panel/WalletTransactionsTable"
import { TICKET_STATUS_LABELS } from "@/components/ticket/TicketStatusBadge"
import { TicketsTable } from "@/components/ticket/TicketsTable"
import { cn } from "@/lib/utils"
import { readTickets } from "./actions"

const STATUSES = Object.keys(TICKET_STATUS_LABELS) as TicketStatus[]

function href(status: TicketStatus | undefined, page = 1) {
    const query = new URLSearchParams({ ...(status && { status }), ...(page > 1 && { page: String(page) }) }).toString()
    return `/panel/tickets${query && `?${query}`}`
}

/** zarimen.ir/panel/tickets — every shop's tickets, optionally one status only (`?status=`). */
export default async function AdminTicketsPage({ searchParams }: { searchParams: Promise<{ page?: string, status?: string }> }) {
    const query = await searchParams
    const page = parsePage(query.page)
    const status = STATUSES.find(s => s === query.status)
    const { data, error } = await readTickets(page, status)

    return (
        <Card>
            <CardHeader>
                <CardTitle>تیکت‌ها</CardTitle>
                <CardDescription>پیام‌های فروشندگان. با هر پیام فروشنده، پیامک اطلاع‌رسانی برای مدیران ارسال می‌شود.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <nav className="flex flex-wrap gap-2 text-sm">
                    {[undefined, ...STATUSES].map(s => (
                        <Link
                            key={s ?? "all"}
                            href={href(s)}
                            className={cn("rounded-full border px-3 py-1 transition", s === status ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}
                        >
                            {s ? TICKET_STATUS_LABELS[s] : "همه"}
                        </Link>
                    ))}
                </nav>
                {data
                    ? <TicketsTable result={data} page={page} basePath="/panel/tickets" pageHref={p => href(status, p)} showShop />
                    : <p className="text-destructive">{error?.translation}</p>}
            </CardContent>
        </Card>
    )
}
