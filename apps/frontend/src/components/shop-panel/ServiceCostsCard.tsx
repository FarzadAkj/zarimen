import type { ServiceCostSettingsModel } from "@/api/Api"
import { MessageSquareText, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { formatAmount } from "@/lib/format"

function price(value: number) {
    return value ? formatAmount(String(value)) : "رایگان"
}

/** The owner's dashboard: what each paid service costs their wallet, and when it is used. */
export function ServiceCostsCard({ costs }: { costs: ServiceCostSettingsModel }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>هزینه خدمات</CardTitle>
                <CardDescription>این مبالغ با هر درخواست مشتریان از موجودی کیف پول شما کسر می‌شود.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl border p-3">
                        <ShieldCheck className="size-6 shrink-0 text-primary" />
                        <div className="grid">
                            <span className="text-sm text-muted-foreground">هر استعلام شاهکار</span>
                            <span className="font-bold">{price(costs.shahkarCost)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border p-3">
                        <MessageSquareText className="size-6 shrink-0 text-primary" />
                        <div className="grid">
                            <span className="text-sm text-muted-foreground">هر پیامک</span>
                            <span className="font-bold">{price(costs.smsCost)}</span>
                        </div>
                    </div>
                </div>
                <ul className="grid gap-1 text-sm text-muted-foreground list-disc ps-5">
                    <li>ثبت‌نام مشتری جدید: یک استعلام شاهکار + یک پیامک ({price(costs.shahkarCost + costs.smsCost)})</li>
                    <li>ثبت‌نام دوباره با همان اطلاعات یا ورود مشتری: یک پیامک ({price(costs.smsCost)})</li>
                    <li>افزودن هر کارت بانکی: یک استعلام شاهکار ({price(costs.shahkarCost)})</li>
                </ul>
            </CardContent>
        </Card>
    )
}
