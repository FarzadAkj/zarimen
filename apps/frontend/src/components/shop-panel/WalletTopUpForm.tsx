"use client"
import { useState } from "react"
import { toast } from "sonner"
import { startWalletTopUp } from "@/app/tenant/[subdomain]/panel/actions"
import { Button } from "@/components/shad/button"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { formatAmount, toLatinDigits } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Same bounds as the backend's StartWalletTopUpInput. */
const MIN_TOP_UP = 2000
const MAX_TOP_UP = 200_000_000
const QUICK_AMOUNTS = [100_000, 500_000, 1_000_000, 5_000_000]

/** Amount + "pay" → Zarinpal; Zarinpal comes back through the backend to /panel/wallet?topUp=… */
export function WalletTopUpForm() {
    const [amount, setAmount] = useState("")
    const [pending, setPending] = useState(false)
    const value = Number(amount)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (value < MIN_TOP_UP || value > MAX_TOP_UP) {
            toast.error(`مبلغ باید بین ${formatAmount(String(MIN_TOP_UP))} و ${formatAmount(String(MAX_TOP_UP))} باشد.`)
            return
        }
        setPending(true)
        const { data, error } = await startWalletTopUp(value)
        if (!data) {
            setPending(false)
            toast.error(error?.translation)
            return
        }
        toast.success("در حال انتقال به درگاه پرداخت…")
        window.location.assign(data.url)
    }

    return (
        <form onSubmit={submit} className="grid gap-4" noValidate>
            <div className="grid gap-2">
                <Label htmlFor="amount">مبلغ افزایش موجودی (تومان)</Label>
                <Input
                    id="amount"
                    dir="ltr"
                    inputMode="numeric"
                    placeholder="500000"
                    className="h-12 text-lg"
                    value={amount}
                    onChange={e => setAmount(toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 9))}
                />
                <p className="text-sm text-muted-foreground min-h-5">{value > 0 && formatAmount(amount)}</p>
                <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map(quick => (
                        <button
                            key={quick}
                            type="button"
                            onClick={() => setAmount(String(quick))}
                            className={cn(
                                "rounded-full border px-3 py-1 text-xs transition",
                                value === quick ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted",
                            )}
                        >
                            {formatAmount(String(quick))}
                        </button>
                    ))}
                </div>
            </div>
            <Button type="submit" size="lg" disabled={pending}>
                {pending && <Spinner />}
                پرداخت با زرین‌پال
            </Button>
        </form>
    )
}
