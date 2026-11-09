import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { WalletTopUpForm } from "@/components/shop-panel/WalletTopUpForm"
import { formatAmount } from "@/lib/format"
import { readMyShop } from "../../actions"

type Params = { topUp?: string, amount?: string, refId?: string, reason?: string }

const FAILURE_REASONS: Record<string, string> = {
    Canceled: "پرداخت لغو شد و مبلغی از حساب شما کسر نشد.",
    Expired: "مهلت این پرداخت (۲۰ دقیقه) تمام شده بود و به کیف پول اضافه نشد. اگر مبلغی کسر شده باشد، ظرف ۷۲ ساعت به حساب شما بازمی‌گردد.",
    GatewayUnavailable: "تأیید پرداخت با درگاه ممکن نشد. اگر مبلغی کسر شده باشد، ظرف ۷۲ ساعت به حساب شما بازمی‌گردد.",
}

/**
 * <subdomain>.zarimen.ir/panel/wallet — balance and top-up. Zarinpal returns here through the
 * backend with ?topUp=success&amount=&refId= or ?topUp=failed&reason=.
 */
export default async function ShopWalletPage({ searchParams }: { searchParams: Promise<Params> }) {
    const params = await searchParams
    const { data: shop } = await readMyShop()
    if (!shop) redirect("/panel/login")

    return (
        <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
            {params.topUp === "success" && (
                <div className="flex gap-3 rounded-xl border border-green-600/30 bg-green-50 p-4 text-green-800">
                    <CheckCircle2 className="size-6 shrink-0" />
                    <div>
                        <p className="font-bold">{formatAmount(params.amount ?? "0")} به کیف پول اضافه شد.</p>
                        {params.refId && <p className="text-sm">کد پیگیری: <span dir="ltr">{params.refId}</span></p>}
                    </div>
                </div>
            )}
            {params.topUp === "failed" && (
                <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                    <XCircle className="size-6 shrink-0" />
                    <p>{FAILURE_REASONS[params.reason ?? ""] ?? "پرداخت ناموفق بود و مبلغی به کیف پول اضافه نشد."}</p>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardDescription>موجودی کیف پول</CardDescription>
                    <CardTitle className="text-3xl">{formatAmount(shop.walletBalance)}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    هزینه استعلام‌ها و پیامک‌های مشتریان از این موجودی کسر می‌شود.{" "}
                    <Link href="/panel/transactions" className="text-primary underline">مشاهده تراکنش‌ها</Link>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>افزایش موجودی</CardTitle>
                </CardHeader>
                <CardContent>
                    <WalletTopUpForm />
                </CardContent>
            </Card>
        </div>
    )
}
