import type { ReadWalletTransactionsOutput, WalletTransactionModel } from "@/api/Api"
import { Pager } from "@/components/shared/Pager"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shad/table"
import { formatAmount } from "@/lib/format"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"

function describe(row: WalletTransactionModel) {
    switch (row.type) {
        case "TOP_UP": return "افزایش موجودی (زرین‌پال)"
        case "ADMIN_ADJUSTMENT": return "تنظیم موجودی توسط مدیر"
        case "SERVICE_CHARGE":
            switch (row.service) {
                case "SMS": return "پیامک"
                case "CARD_MATCH": return "استعلام کارت بانکی"
                default: return "استعلام شاهکار"
            }
    }
}

/**
 * A shop's wallet history, newest first, one page at a time (`?page=` in the URL).
 * Increases show date/time and amount; charges also show the service and the customer.
 */
export function WalletTransactionsTable({ result, page, pageHref }: {
    result: ReadWalletTransactionsOutput
    page: number
    /** URL of another page of the history, e.g. p => `/panel/transactions?page=${p}`. */
    pageHref: (page: number) => string
}) {
    const pages = Math.max(1, Math.ceil(result.count / result.pageSize))

    if (!result.count)
        return <p className="text-muted-foreground text-center py-8">هنوز تراکنشی ثبت نشده است.</p>

    return (
        <div className="grid gap-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>تاریخ و ساعت</TableHead>
                        <TableHead>شرح</TableHead>
                        <TableHead>مبلغ</TableHead>
                        <TableHead>کد ملی مشتری</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {result.data.map((row) => {
                        const increase = !row.amount.startsWith("-")
                        return (
                            <TableRow key={row.id}>
                                <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                                <TableCell>
                                    {describe(row)}
                                    {row.refId && <span className="block text-xs text-muted-foreground">کد پیگیری {row.refId}</span>}
                                </TableCell>
                                <TableCell className={cn("font-medium", increase ? "text-green-700" : "text-destructive")}>
                                    <span dir="ltr">{increase ? "+" : "−"}</span>
                                    {formatAmount(row.amount.replace("-", ""))}
                                </TableCell>
                                <TableCell dir="ltr" className="text-end font-mono">
                                    {row.customerSsn ?? <span className="text-muted-foreground">—</span>}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <Pager page={page} pages={pages} pageHref={pageHref} />
        </div>
    )
}

/** `?page=` → a page number ≥ 1. */
export function parsePage(value: string | string[] | undefined) {
    const page = Number(Array.isArray(value) ? value[0] : value)
    return Number.isInteger(page) && page > 0 ? page : 1
}
