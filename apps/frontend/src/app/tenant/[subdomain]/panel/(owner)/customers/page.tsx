import Link from "next/link"
import { Button } from "@/components/shad/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { CustomersBrowser } from "@/components/shop-panel/CustomersBrowser"
import { ManualCardCheckDialog } from "@/components/shop-panel/ManualCardCheckDialog"
import { checkCardManually, readMyCustomerCards, readMyCustomers, readServiceCosts } from "../../actions"

/** <subdomain>.zarimen.ir/panel/customers — customers who verified at this shop. */
export default async function ShopCustomersPage() {
    const [{ data: customers, error }, { data: costs }] = await Promise.all([readMyCustomers(), readServiceCosts()])

    return (
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
                {customers && <CustomersBrowser initial={customers} loadCustomers={readMyCustomers} loadCards={readMyCustomerCards} />}
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
    )
}
