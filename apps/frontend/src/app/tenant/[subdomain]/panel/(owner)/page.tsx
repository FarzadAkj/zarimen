import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/shad/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { formatAmount } from "@/lib/format"
import { ServiceCostsCard } from "@/components/shop-panel/ServiceCostsCard"
import { SubscriptionSummary } from "@/components/shop-panel/SubscriptionSummary"
import { readMyShop, readMySubscription, readServiceCosts } from "../actions"

/** <subdomain>.zarimen.ir/panel — the shop's dashboard. Customer checks come in a later step. */
export default async function ShopDashboardPage() {
    const [{ data: shop }, { data: subscription }, { data: costs }] = await Promise.all([readMyShop(), readMySubscription(), readServiceCosts()])
    if (!shop) redirect("/panel/login")

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="sm:col-span-2">
                <CardHeader>
                    <CardDescription>اشتراک</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    {subscription && <SubscriptionSummary subscription={subscription} />}
                    <Button asChild size="sm" variant={subscription?.isActive ? "outline" : "default"}>
                        <Link href="/panel/subscription">{subscription?.isActive ? "تمدید اشتراک" : "خرید اشتراک"}</Link>
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardDescription>فروشگاه</CardDescription>
                    <CardTitle>{shop.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    مالک: {shop.ownerFullName}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardDescription>موجودی کیف پول</CardDescription>
                    <CardTitle>{formatAmount(shop.walletBalance)}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button asChild size="sm">
                        <Link href="/panel/wallet">افزایش موجودی</Link>
                    </Button>
                </CardContent>
            </Card>
            {costs && (
                <div className="sm:col-span-2">
                    <ServiceCostsCard costs={costs} />
                </div>
            )}
        </div>
    )
}
