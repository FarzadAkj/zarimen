import type { ReadManualCardChecksOutput } from "@/api/Api"
import { CircleCheck, CircleX } from "lucide-react"
import { Pager } from "@/components/shared/Pager"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shad/table"
import { formatCardNumber } from "@/lib/format"
import { formatDateTime } from "@/lib/format-date"

/**
 * A shop's «استعلام دستی» history, newest first, one page at a time. Shared by the owner's
 * customers page and the admin's view of the shop.
 */
export function ManualCardChecksTable({ result, page, pageHref }: {
    result: ReadManualCardChecksOutput
    page: number
    pageHref: (page: number) => string
}) {
    if (!result.count)
        return <p className="text-muted-foreground text-center py-8">هنوز استعلام دستی انجام نشده است.</p>

    return (
        <div className="grid gap-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>تاریخ و ساعت</TableHead>
                        <TableHead>کد ملی</TableHead>
                        <TableHead>تاریخ تولد</TableHead>
                        <TableHead>شماره کارت</TableHead>
                        <TableHead>نتیجه</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {result.data.map(row => (
                        <TableRow key={row.id}>
                            <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                            <TableCell dir="ltr" className="text-end font-mono">{row.ssn}</TableCell>
                            <TableCell dir="ltr" className="text-end">{row.birthDate}</TableCell>
                            <TableCell>
                                <span dir="ltr" className="block font-mono">{formatCardNumber(row.cardNumber)}</span>
                                {row.bankName && <span className="block text-xs text-muted-foreground">{row.bankName}</span>}
                            </TableCell>
                            <TableCell>
                                {row.matched
                                    ? <span className="flex items-center gap-1 text-green-700"><CircleCheck className="size-4" />تأیید شد</span>
                                    : <span className="flex items-center gap-1 text-destructive"><CircleX className="size-4" />تأیید نشد</span>}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Pager page={page} pages={Math.max(1, Math.ceil(result.count / result.pageSize))} pageHref={pageHref} />
        </div>
    )
}
