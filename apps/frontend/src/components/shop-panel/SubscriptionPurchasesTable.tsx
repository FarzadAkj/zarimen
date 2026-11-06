import type { ReadSubscriptionPurchasesOutput } from "@/api/Api"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/shad/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shad/table"
import { formatAmount } from "@/lib/format"
import { formatDate, formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"

/** Paid subscription purchases, newest first, `?page=` paging. All dates Jalali. */
export function SubscriptionPurchasesTable({ result, page, pageHref }: {
    result: ReadSubscriptionPurchasesOutput
    page: number
    pageHref: (page: number) => string
}) {
    const pages = Math.max(1, Math.ceil(result.count / result.pageSize))

    if (!result.count)
        return <p className="text-muted-foreground text-center py-8">هنوز اشتراکی خریداری نشده است.</p>

    return (
        <div className="grid gap-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>طرح</TableHead>
                        <TableHead>مبلغ پرداختی</TableHead>
                        <TableHead>تاریخ خرید</TableHead>
                        <TableHead>دوره اشتراک</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {result.data.map(row => (
                        <TableRow key={row.id}>
                            <TableCell>
                                {row.planTitle}
                                <span className="block text-xs text-muted-foreground">{row.durationDays.toLocaleString("fa-IR")} روز</span>
                            </TableCell>
                            <TableCell>
                                {formatAmount(row.price)}
                                {row.refId && <span className="block text-xs text-muted-foreground">کد پیگیری {row.refId}</span>}
                            </TableCell>
                            <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                            <TableCell>{formatDate(row.startsAt)} تا {formatDate(row.endsAt)}</TableCell>
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
