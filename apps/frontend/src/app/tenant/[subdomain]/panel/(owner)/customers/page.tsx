import Link from "next/link"
import { Button } from "@/components/shad/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { CustomersBrowser } from "@/components/shop-panel/CustomersBrowser"
import { ManualCardCheckDialog } from "@/components/shop-panel/ManualCardCheckDialog"
import { ManualCardChecksTable } from "@/components/shop-panel/ManualCardChecksTable"
import { parsePage } from "@/components/shop-panel/WalletTransactionsTable"
import { checkCardManually, readMyCustomerCards, readMyCustomers, readMyManualCardChecks, readServiceCosts } from "../../actions"

/**
 * <subdomain>.zarimen.ir/panel/customers — customers who verified at this shop.
 * `?ssn=<national code>` (the link in the owner's "a customer added a card" SMS) opens the page
 * already filtered by it, with that customer's cards dialog open.
 * Below: the owner's «استعلام دستی» history, paged with `?checks=<page>`.
 */
export default async function ShopCustomersPage({ searchParams }: { searchParams: Promise<{ ssn?: string, checks?: string }> }) {
    const { ssn, checks } = await searchParams
    const linkedSsn = ssn && /^\d{10}$/.test(ssn) ? ssn : undefined
    const checksPage = parsePage(checks)
    const [{ data: customers, error }, { data: costs }, { data: manualChecks }] = await Promise.all([
        readMyCustomers(linkedSsn),
        readServiceCosts(),
        readMyManualCardChecks(checksPage),
    ])

    return (
        <div className="grid grid-cols-1 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>مشتریان</CardTitle>
                    <CardDescription>مشتریانی که در صفحه احراز هویت فروشگاه شما ثبت‌نام یا وارد شده‌اند.</CardDescription>
                    {customers && (
                        <CardAction>
                            <ManualCardCheckDialog cost={costs?.cardMatchCost} check={checkCardManually} />
                        </CardAction>
                    )}
                </CardHeader>
                <CardContent>
                    {customers && <CustomersBrowser initial={customers} initialQuery={linkedSsn} openCardsOfSsn={linkedSsn} loadCustomers={readMyCustomers} loadCards={readMyCustomerCards} />}
                    {error?.message === "SubscriptionInactive" && (
                        <div className="grid justify-items-center gap-3 py-8 text-center">
                            <p className="text-muted-foreground">برای مشاهده اطلاعات مشتریان، اشتراک فعال لازم است.</p>
                            <Button asChild>
                                <Link href="/panel/subscription">خرید اشتراک</Link>
                            </Button>
                        </div>
                    )}
                    {error && error.message !== "SubscriptionInactive" && <p className="text-destructive">{error.translation}</p>}
                </CardContent>
            </Card>

            {manualChecks && (
                <Card>
                    <CardHeader>
                        <CardTitle>سابقه استعلام‌های دستی</CardTitle>
                        <CardDescription>استعلام‌هایی که با «استعلام دستی» انجام داده‌اید.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ManualCardChecksTable result={manualChecks} page={checksPage} pageHref={p => `/panel/customers?checks=${p}`} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
