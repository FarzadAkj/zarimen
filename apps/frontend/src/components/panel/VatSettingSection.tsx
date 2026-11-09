"use client"
import type { VatSettingsModel } from "@/api/Api"
import { useState } from "react"
import { toast } from "sonner"
import { vatOf } from "@zar-imen/shared"
import { updateVatSettings } from "@/app/panel/(admin)/settings/actions/action"
import { Button } from "@/components/shad/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { formatAmount, toLatinDigits } from "@/lib/format"

const EXAMPLE_AMOUNT = 50_000

/** VAT percent added on top of every Zarinpal payment (wallet top-ups and subscriptions). */
export function VatSettingSection({ data }: { data: VatSettingsModel }) {
    const [value, setValue] = useState(String(data.vatPercent))
    const [loading, setLoading] = useState(false)
    const percent = Number(value)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!/^\d{1,3}$/.test(value) || percent > 100) {
            toast.error("درصد را عددی صحیح بین ۰ تا ۱۰۰ وارد کنید.")
            return
        }
        setLoading(true)
        const { error } = await updateVatSettings({ vatPercent: percent })
        setLoading(false)
        if (error)
            toast.error(error.translation)
        else
            toast.success("درصد مالیات بر ارزش افزوده ذخیره شد.")
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>مالیات بر ارزش افزوده</CardTitle>
                <CardDescription>
                    این درصد هنگام شارژ کیف پول و خرید اشتراک به مبلغ پرداختی فروشنده اضافه می‌شود. به کیف پول فقط مبلغ بدون مالیات اضافه می‌شود. صفر یعنی بدون مالیات.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="vatPercent">درصد مالیات بر ارزش افزوده</Label>
                        <Input
                            id="vatPercent"
                            dir="ltr"
                            inputMode="numeric"
                            value={value}
                            onChange={e => setValue(toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 3))}
                        />
                        {value !== "" && percent <= 100 && (
                            <p className="text-xs text-muted-foreground">
                                مثال: شارژ {formatAmount(String(EXAMPLE_AMOUNT))} → پرداخت {formatAmount(String(EXAMPLE_AMOUNT + vatOf(EXAMPLE_AMOUNT, percent)))}
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
