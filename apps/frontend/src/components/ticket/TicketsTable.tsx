import type { ReadTicketsOutput } from "@/api/Api"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/shad/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shad/table"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { TicketStatusBadge } from "./TicketStatusBadge"

/** Tickets, latest activity first, one page at a time. Each row opens `${basePath}/<id>`. */
export function TicketsTable({ result, page, pageHref, basePath, showShop }: {
    result: ReadTicketsOutput
    page: number
    pageHref: (page: number) => string
    /** "/panel/tickets" */
    basePath: string
    /** Admins see which shop sent each ticket. */
    showShop?: boolean
}) {
    const pages = Math.max(1, Math.ceil(result.count / result.pageSize))

    if (!result.count)
        return <p className="text-muted-foreground text-center py-8">تیکتی وجود ندارد.</p>

    return (
        <div className="grid gap-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>موضوع</TableHead>
                        {showShop && <TableHead>فروشگاه</TableHead>}
                        <TableHead>وضعیت</TableHead>
                        <TableHead>آخرین پیام</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {result.data.map(ticket => (
                        <TableRow key={ticket.id}>
                            <TableCell className="font-medium">
                                <Link href={`${basePath}/${ticket.id}`} className="hover:text-primary hover:underline">{ticket.title}</Link>
                            </TableCell>
                            {showShop && (
                                <TableCell>
                                    {ticket.shopName}
                                    <span dir="ltr" className="block text-xs text-muted-foreground text-end">{ticket.shopSubdomain}</span>
                                </TableCell>
                            )}
                            <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                            <TableCell>{formatDateTime(ticket.updatedAt)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {pages > 1 && (
                <div className="flex items-center justify-center gap-3 text-sm">
                    <Button asChild variant="outline" size="sm" className={cn(page <= 1 && "pointer-events-none opacity-50")}>
                        <Link href={pageHref(page - 1)}><ChevronRight />قبلی</Link>
                    </Button>
                    <span>صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span>
                    <Button asChild variant="outline" size="sm" className={cn(page >= pages && "pointer-events-none opacity-50")}>
                        <Link href={pageHref(page + 1)}>بعدی<ChevronLeft /></Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
