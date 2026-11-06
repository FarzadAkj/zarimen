import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { parsePage, WalletTransactionsTable } from "@/components/shop-panel/WalletTransactionsTable"
import { readMyWalletTransactions } from "../../actions"

/** <subdomain>.zarimen.ir/panel/transactions — the wallet's history. */
export default async function ShopTransactionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const page = parsePage((await searchParams).page)
    const { data, error } = await readMyWalletTransactions(page)

    return (
        <Card>
            <CardHeader>
                <CardTitle>تراکنش‌های کیف پول</CardTitle>
                <CardDescription>افزایش موجودی‌ها و هزینه استعلام‌ها و پیامک‌های مشتریان.</CardDescription>
            </CardHeader>
            <CardContent>
                {data
                    ? <WalletTransactionsTable result={data} page={page} pageHref={p => `/panel/transactions?page=${p}`} />
                    : <p className="text-destructive">{error?.translation}</p>}
            </CardContent>
        </Card>
    )
}
