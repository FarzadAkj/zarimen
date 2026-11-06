import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { formatAmount } from "@/lib/format"
import { readMyShop } from "../actions"

/** <subdomain>.zarimen.ir/panel — the shop's dashboard. Customer checks come in a later step. */
export default async function ShopDashboardPage() {
    const { data: shop } = await readMyShop()
    if (!shop) redirect("/panel/login")

    return (
        <div className="grid gap-4 sm:grid-cols-2">
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
            </Card>
        </div>
    )
}
