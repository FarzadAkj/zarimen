"use client"
import type { ServiceCostSettingsModel } from "@/api/Api"
import { useState } from "react"
import { toast } from "sonner"
import { updateServiceCostSettings } from "@/app/panel/(admin)/settings/actions/action"
import { Button } from "@/components/shad/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { formatAmount, toLatinDigits } from "@/lib/format"

const FIELDS: { name: keyof ServiceCostSettingsModel, label: string, hint: string }[] = [
    { name: "shahkarCost", label: "هزینه هر استعلام شاهکار", hint: "برای هر استعلام موبایل/کد ملی و هر استعلام کارت بانکی مشتری" },
    { name: "smsCost", label: "هزینه هر پیامک", hint: "برای هر پیامک کد تأیید که برای مشتری ارسال می‌شود" },
]

/** Prices (whole Tomans) taken from a shop's wallet for each request its customers make. */
export function ServiceCostSettingSection({ data }: { data: ServiceCostSettingsModel }) {
    const [values, setValues] = useState({ shahkarCost: String(data.shahkarCost), smsCost: String(data.smsCost) })
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (FIELDS.some(f => !/^\d{1,10}$/.test(values[f.name]))) {
            toast.error("هزینه‌ها را به تومان و بدون اعشار وارد کنید.")
            return
        }
        setLoading(true)
        const { error } = await updateServiceCostSettings({
            shahkarCost: Number(values.shahkarCost),
            smsCost: Number(values.smsCost),
        })
        setLoading(false)
        if (error)
            toast.error(error.translation)
        else
            toast.success("هزینه‌ها ذخیره شد.")
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>هزینه خدمات</CardTitle>
                <CardDescription>
                    این مبالغ با هر درخواست مشتری از کیف پول همان فروشگاه کسر می‌شود. اگر موجودی کافی نباشد، درخواست انجام نمی‌شود. صفر یعنی رایگان.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-5">
                    {FIELDS.map(field => (
                        <div key={field.name} className="grid gap-2">
                            <Label htmlFor={field.name}>{field.label} (تومان)</Label>
                            <Input
                                id={field.name}
                                dir="ltr"
                                inputMode="numeric"
                                value={values[field.name]}
                                onChange={e => setValues(v => ({ ...v, [field.name]: toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 10) }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                {values[field.name] !== "" && <span className="text-foreground font-medium">{formatAmount(values[field.name])} — </span>}
                                {field.hint}
                            </p>
                        </div>
                    ))}
                    <Button type="submit" disabled={loading}>
                        {loading && <Spinner />}
                        ثبت تغییرات
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
