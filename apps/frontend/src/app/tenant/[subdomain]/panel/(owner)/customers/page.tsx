import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shad/table"
import { formatDateTime } from "@/lib/format-date"
import { readMyCustomers } from "../../actions"

/** <subdomain>.zarimen.ir/panel/customers — customers who verified at this shop. */
export default async function ShopCustomersPage() {
    const { data: customers, error } = await readMyCustomers()

    return (
        <Card>
            <CardHeader>
                <CardTitle>مشتریان</CardTitle>
                <CardDescription>مشتریانی که در صفحه احراز هویت فروشگاه شما ثبت‌نام یا وارد شده‌اند.</CardDescription>
            </CardHeader>
            <CardContent>
                {!customers && <p className="text-destructive">{error?.translation}</p>}
                {customers && !customers.length && (
                    <p className="text-muted-foreground text-center py-8">هنوز مشتری‌ای احراز هویت نشده است.</p>
                )}
                {customers && customers.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>کد ملی</TableHead>
                                <TableHead>موبایل</TableHead>
                                <TableHead>تاریخ تولد</TableHead>
                                <TableHead>کارت‌های تأییدشده</TableHead>
                                <TableHead>اولین مراجعه</TableHead>
                                <TableHead>آخرین مراجعه</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map(customer => (
                                <TableRow key={customer.id} className="align-top">
                                    <TableCell dir="ltr" className="text-end font-mono">{customer.ssn}</TableCell>
                                    <TableCell dir="ltr" className="text-end font-mono">{customer.phoneNumber}</TableCell>
                                    <TableCell dir="ltr" className="text-end">{customer.birthDate}</TableCell>
                                    <TableCell>
                                        {customer.cards.length
                                            ? (
                                                <ul className="grid gap-1">
                                                    {customer.cards.map(card => (
                                                        <li key={card.id} className="flex gap-2 items-baseline">
                                                            <span dir="ltr" className="font-mono">{card.maskedNumber}</span>
                                                            {card.bankName && <span className="text-xs text-muted-foreground">{card.bankName}</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )
                                            : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell>{formatDateTime(customer.firstSeenAt)}</TableCell>
                                    <TableCell>{formatDateTime(customer.lastSeenAt)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
