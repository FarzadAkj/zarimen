import type { PaymentModel } from "@/api/Api"
import Link from "next/link"
import { Pager } from "@/components/shared/Pager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shad/table"
import { parsePage } from "@/components/shop-panel/WalletTransactionsTable"
import { formatAmount } from "@/lib/format"
import { formatDateTime } from "@/lib/format-date"
import { readPayments } from "./actions"

function describe(payment: PaymentModel) {
    return payment.kind === "TOP_UP" ? "شارژ کیف پول" : `اشتراک «${payment.planTitle}»`
}

/** zarimen.ir/panel/payments — every shop's paid top-ups and plan purchases, newest first. */
export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const page = parsePage((await searchParams).page)
    const { data, error } = await readPayments(page)
    const pages = data ? Math.max(1, Math.ceil(data.count / data.pageSize)) : 1

    return (
        <Card>
            <CardHeader>
                <CardTitle>گزارش پرداخت‌ها</CardTitle>
                <CardDescription>پرداخت‌های موفق فروشگاه‌ها: شارژ کیف پول و خرید اشتراک. مبلغ با مالیات بر ارزش افزوده است.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
                {!data && <p className="text-destructive">{error?.translation}</p>}
                {data && !data.count && <p className="text-muted-foreground text-center py-8">هنوز پرداختی ثبت نشده است.</p>}
                {data && data.count > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>تاریخ و ساعت</TableHead>
                                <TableHead>فروشگاه</TableHead>
                                <TableHead>زیردامنه</TableHead>
                                <TableHead>موبایل مالک</TableHead>
                                <TableHead>نوع</TableHead>
                                <TableHead>مبلغ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.map(payment => (
                                <TableRow key={payment.id}>
                                    <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                                    <TableCell>{payment.shopName}</TableCell>
                                    <TableCell dir="ltr" className="text-end font-mono">
                                        <Link href={`/panel/customers/${payment.subdomain}`} className="hover:text-primary hover:underline">{payment.subdomain}</Link>
                                    </TableCell>
                                    <TableCell dir="ltr" className="text-end font-mono">{payment.ownerPhoneNumber}</TableCell>
                                    <TableCell>{describe(payment)}</TableCell>
                                    <TableCell className="font-medium">{formatAmount(payment.amount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                <Pager page={page} pages={pages} pageHref={p => `/panel/payments${p > 1 ? `?page=${p}` : ""}`} />
            </CardContent>
        </Card>
    )
}
