import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/shad/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { ShopLogo } from "@/components/shop/ShopLogo"
import { SubscriptionStatus } from "@/components/shared/SubscriptionStatus"
import { CustomersBrowser } from "@/components/shop-panel/CustomersBrowser"
import { parsePage, WalletTransactionsTable } from "@/components/shop-panel/WalletTransactionsTable"
import { formatAmount } from "@/lib/format"
import { readShopBySubdomain, readShopCustomerCards, readShopCustomers, readShopWalletTransactions } from "../../shops/actions"

type Props = {
    params: Promise<{ subdomain: string }>
    searchParams: Promise<{ page?: string }>
}

/**
 * zarimen.ir/panel/customers/<subdomain> — the admin's view of one shop's panel:
 * the shop, its customers (search + cards) and its wallet history.
 */
export default async function AdminShopPage({ params, searchParams }: Props) {
    const { subdomain } = await params
    const page = parsePage((await searchParams).page)

    const { data: shop, error } = await readShopBySubdomain(subdomain)
    if (error?.message === "NotFound") notFound()
    if (!shop) return <p className="text-destructive">{error?.translation}</p>

    const [customers, transactions] = await Promise.all([
        readShopCustomers(shop.id, ""),
        readShopWalletTransactions(shop.id, page),
    ])

    return (
        <div className="grid gap-4">
            <Link href="/panel" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
                <ChevronRight className="size-4" />
                فروشگاه‌ها
            </Link>

            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <ShopLogo logoUrl={shop.logoUrl} brandName={shop.brandName} className="size-16 text-2xl" />
                    <div className="grid gap-1">
                        <CardTitle className="flex items-center gap-2">
                            {shop.name}
                            <Badge variant={shop.isActive ? "default" : "secondary"}>{shop.isActive ? "فعال" : "غیرفعال"}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {shop.brandName} — <span dir="ltr">{shop.subdomain}.{process.env.ROOT_DOMAIN}</span>
                        </CardDescription>
                        <CardDescription>
                            مالک: {shop.ownerFullName} — <span dir="ltr">{shop.ownerPhoneNumber}</span>
                        </CardDescription>
                        <CardDescription>
                            پایان اشتراک: <SubscriptionStatus endsAt={shop.subscriptionEndsAt} />
                        </CardDescription>
                    </div>
                    <div className="ms-auto text-end">
                        <div className="text-sm text-muted-foreground">موجودی کیف پول</div>
                        <div className="text-xl font-bold">{formatAmount(shop.walletBalance)}</div>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>مشتریان</CardTitle>
                </CardHeader>
                <CardContent>
                    {customers.data
                        ? (
                            <CustomersBrowser
                                initial={customers.data}
                                loadCustomers={readShopCustomers.bind(null, shop.id)}
                                loadCards={readShopCustomerCards.bind(null, shop.id)}
                            />
                        )
                        : <p className="text-destructive">{customers.error?.translation}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>تراکنش‌های کیف پول</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.data
                        ? <WalletTransactionsTable result={transactions.data} page={page} pageHref={p => `/panel/customers/${shop.subdomain}?page=${p}`} />
                        : <p className="text-destructive">{transactions.error?.translation}</p>}
                </CardContent>
            </Card>
        </div>
    )
}
