import { CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { BuyPlanButton } from "@/components/shop-panel/BuyPlanButton"
import { SubscriptionPurchasesTable } from "@/components/shop-panel/SubscriptionPurchasesTable"
import { SubscriptionSummary } from "@/components/shop-panel/SubscriptionSummary"
import { parsePage } from "@/components/shop-panel/WalletTransactionsTable"
import { formatAmount, formatDuration } from "@/lib/format"
import { formatDate } from "@/lib/format-date"
import { readAvailablePlans, readMySubscription, readMySubscriptionPurchases } from "../../actions"

type Params = { purchase?: string, plan?: string, endsAt?: string, refId?: string, reason?: string, page?: string }

const FAILURE_REASONS: Record<string, string> = {
    Canceled: "پرداخت لغو شد و اشتراکی خریداری نشد.",
    Expired: "مهلت این پرداخت (۲۰ دقیقه) تمام شده بود و اشتراک اضافه نشد. اگر مبلغی کسر شده باشد، ظرف ۷۲ ساعت به حساب شما بازمی‌گردد.",
    GatewayUnavailable: "تأیید پرداخت با درگاه ممکن نشد. اگر مبلغی کسر شده باشد، ظرف ۷۲ ساعت به حساب شما بازمی‌گردد.",
}

/**
 * <subdomain>.zarimen.ir/panel/subscription — current subscription, plans to buy and past purchases.
 * Zarinpal returns here through the backend with ?purchase=success&plan=&endsAt=&refId= or ?purchase=failed&reason=.
 */
export default async function ShopSubscriptionPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams
    const page = parsePage(params.page)
    const [subscription, plans, purchases] = await Promise.all([
        readMySubscription(),
        readAvailablePlans(),
        readMySubscriptionPurchases(page),
    ])

    return (
        <div className="grid grid-cols-1 gap-4">
            {params.purchase === "success" && (
                <div className="flex gap-3 rounded-xl border border-green-600/30 bg-green-50 p-4 text-green-800">
                    <CheckCircle2 className="size-6 shrink-0" />
                    <div>
                        <p className="font-bold">«{params.plan}» خریداری شد.</p>
                        {params.endsAt && <p className="text-sm">اشتراک شما تا {formatDate(params.endsAt)} فعال است.</p>}
                        {params.refId && <p className="text-sm">کد پیگیری: <span dir="ltr">{params.refId}</span></p>}
                    </div>
                </div>
            )}
            {params.purchase === "failed" && (
                <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                    <XCircle className="size-6 shrink-0" />
                    <p>{FAILURE_REASONS[params.reason ?? ""] ?? "پرداخت ناموفق بود و اشتراکی خریداری نشد."}</p>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>اشتراک فعلی</CardTitle>
                </CardHeader>
                <CardContent>
                    {subscription.data
                        ? <SubscriptionSummary subscription={subscription.data} />
                        : <p className="text-destructive">{subscription.error?.translation}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>خرید اشتراک</CardTitle>
                    <CardDescription>اگر اشتراک فعال دارید، مدت طرح جدید به انتهای آن اضافه می‌شود.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!plans.data && <p className="text-destructive">{plans.error?.translation}</p>}
                    {plans.data && !plans.data.length && <p className="text-muted-foreground">در حال حاضر طرحی برای خرید وجود ندارد.</p>}
                    {plans.data && plans.data.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {plans.data.map(plan => (
                                <div key={plan.id} className="grid gap-3 rounded-xl border p-4">
                                    <div>
                                        <p className="font-bold">{plan.title}</p>
                                        <p className="text-sm text-muted-foreground">{formatDuration(plan.durationDays)}</p>
                                    </div>
                                    <p className="text-xl font-bold text-primary">{formatAmount(plan.price)}</p>
                                    <BuyPlanButton planId={plan.id} />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>سوابق خرید اشتراک</CardTitle>
                </CardHeader>
                <CardContent>
                    {purchases.data
                        ? <SubscriptionPurchasesTable result={purchases.data} page={page} pageHref={p => `/panel/subscription?page=${p}`} />
                        : <p className="text-destructive">{purchases.error?.translation}</p>}
                </CardContent>
            </Card>
        </div>
    )
}
