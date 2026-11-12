"use client"
import type { SubscriptionPlanModel } from "@/api/Api"
import { useState } from "react"
import { toast } from "sonner"
import { createSubscriptionPlan, setSubscriptionPlanActive } from "@/app/panel/(admin)/settings/actions/action"
import { Button } from "@/components/shad/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { Switch } from "@/components/shad/switch"
import { PlanPrice } from "@/components/shared/PlanPrice"
import { DURATION_PRESETS, formatAmount, formatDuration, toLatinDigits } from "@/lib/format"
import { cn } from "@/lib/utils"

const digits = (value: string, max: number) => toLatinDigits(value).replace(/\D/g, "").slice(0, max)

/** Admin: the plans shop owners can buy. Plans are disabled, never deleted (purchases point at them). */
export function SubscriptionPlansSection({ plans }: { plans: SubscriptionPlanModel[] }) {
    const [title, setTitle] = useState("")
    const [price, setPrice] = useState("")
    const [days, setDays] = useState("30")
    const [loading, setLoading] = useState(false)

    async function add(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim() || Number(price) < 10_000 || Number(days) < 1) {
            toast.error("عنوان، قیمت (حداقل ۱۰٬۰۰۰ تومان) و مدت (روز) را وارد کنید.")
            return
        }
        setLoading(true)
        const { error } = await createSubscriptionPlan({ title: title.trim(), price: Number(price), durationDays: Number(days) })
        setLoading(false)
        if (error) {
            toast.error(error.translation)
            return
        }
        toast.success("طرح اشتراک اضافه شد.")
        setTitle("")
        setPrice("")
    }

    async function toggle(plan: SubscriptionPlanModel, isActive: boolean) {
        const { error } = await setSubscriptionPlanActive(plan.id, isActive)
        if (error)
            toast.error(error.translation)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>طرح‌های اشتراک</CardTitle>
                <CardDescription>
                    فروشگاه‌ها با خرید یکی از این طرح‌ها (پرداخت آنلاین با سپال) می‌توانند از خدمات استفاده کنند. خرید جدید به انتهای اشتراک فعلی اضافه می‌شود.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                {plans.length
                    ? (
                        <ul className="grid gap-2">
                            {plans.map(plan => (
                                <li key={plan.id} className={cn("flex items-center gap-3 rounded-lg border p-3", !plan.isActive && "opacity-60")}>
                                    <div className="flex-1 grid">
                                        <span className="font-medium">{plan.title}</span>
                                        <span className="text-sm text-muted-foreground">{formatDuration(plan.durationDays)}</span>
                                        <PlanPrice plan={plan} className="text-sm" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">{plan.isActive ? "فعال" : "غیرفعال"}</span>
                                    <Switch dir="ltr" checked={plan.isActive} onCheckedChange={v => toggle(plan, v)} />
                                </li>
                            ))}
                        </ul>
                    )
                    : <p className="text-sm text-muted-foreground">هنوز طرحی تعریف نشده است.</p>}

                <form onSubmit={add} className="grid gap-4 rounded-lg border border-dashed p-4">
                    <div className="grid gap-2">
                        <Label htmlFor="plan-title">عنوان طرح</Label>
                        <Input id="plan-title" placeholder="اشتراک یک‌ماهه" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="plan-price">قیمت (تومان)</Label>
                            <Input id="plan-price" dir="ltr" inputMode="numeric" placeholder="2000000" value={price} onChange={e => setPrice(digits(e.target.value, 9))} />
                            <span className="text-xs text-muted-foreground min-h-4">{price && formatAmount(price)}</span>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="plan-days">مدت (روز)</Label>
                            <Input id="plan-days" dir="ltr" inputMode="numeric" value={days} onChange={e => setDays(digits(e.target.value, 4))} />
                            <div className="flex flex-wrap gap-1">
                                {DURATION_PRESETS.map(preset => (
                                    <button
                                        key={preset.days}
                                        type="button"
                                        onClick={() => setDays(String(preset.days))}
                                        className={cn("rounded-full border px-2 py-0.5 text-xs", Number(days) === preset.days ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading && <Spinner />}
                        افزودن طرح
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
