"use client"
import type { PlanDiscountSettingsModel } from "@/api/Api"
import { useState } from "react"
import { toast } from "sonner"
import { discountedPrice } from "@zar-imen/shared"
import { updatePlanDiscountSettings } from "@/app/panel/(admin)/settings/actions/action"
import { Button } from "@/components/shad/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { formatAmount, toLatinDigits } from "@/lib/format"

const EXAMPLE_PRICE = 2_000_000
/** Same bound as the backend's PlanDiscountSettingsModel (a free plan cannot go through the gateway). */
const MAX_PERCENT = 99

/** Discount percent taken off every subscription plan; owners see the old price struck through. */
export function PlanDiscountSettingSection({ data }: { data: PlanDiscountSettingsModel }) {
    const [value, setValue] = useState(String(data.discountPercent))
    const [loading, setLoading] = useState(false)
    const percent = Number(value)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!/^\d{1,2}$/.test(value) || percent > MAX_PERCENT) {
            toast.error("درصد تخفیف را عددی صحیح بین ۰ تا ۹۹ وارد کنید.")
            return
        }
        setLoading(true)
        const { error } = await updatePlanDiscountSettings({ discountPercent: percent })
        setLoading(false)
        if (error)
            toast.error(error.translation)
        else
            toast.success(percent > 0 ? "تخفیف اشتراک‌ها ذخیره شد." : "تخفیف اشتراک‌ها برداشته شد.")
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>تخفیف اشتراک‌ها</CardTitle>
                <CardDescription>
                    این درصد از قیمت همه طرح‌های اشتراک کم می‌شود و مالیات بر ارزش افزوده روی قیمت تخفیف‌خورده حساب می‌شود. فروشندگان و صفحه اصلی قیمت قبلی را خط‌خورده می‌بینند. صفر یعنی بدون تخفیف.
                    مبلغ نهایی هر پرداخت باید دست‌کم ۱۰٬۰۰۰ تومان باشد (حداقل درگاه).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="discountPercent">درصد تخفیف</Label>
                        <Input
                            id="discountPercent"
                            dir="ltr"
                            inputMode="numeric"
                            value={value}
                            onChange={e => setValue(toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 2))}
                        />
                        {value !== "" && percent > 0 && (
                            <p className="text-xs text-muted-foreground">
                                مثال: طرح {formatAmount(String(EXAMPLE_PRICE))} → {formatAmount(String(discountedPrice(EXAMPLE_PRICE, percent)))}
                            </p>
                        )}
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading && <Spinner />}
                        ثبت تغییرات
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
