"use client"
import { useState } from "react"
import { toast } from "sonner"
import { startWalletTopUp } from "@/app/tenant/[subdomain]/panel/actions"
import { Button } from "@/components/shad/button"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { PaymentConfirmDialog } from "@/components/shop-panel/PaymentConfirmDialog"
import { formatAmount, toLatinDigits } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Same bounds as the backend's StartWalletTopUpInput. */
const MIN_TOP_UP = 10_000
const MAX_TOP_UP = 200_000_000
const QUICK_AMOUNTS = [100_000, 500_000, 1_000_000, 5_000_000]

/**
 * Amount + "pay" → a dialog with the amount + VAT → SePal for the total (only the amount reaches
 * the wallet); SePal posts the result back through the backend to /panel/wallet?topUp=…
 */
export function WalletTopUpForm({ vatPercent }: { vatPercent: number }) {
    const [amount, setAmount] = useState("")
    const [confirming, setConfirming] = useState(false)
    const [pending, setPending] = useState(false)
    const value = Number(amount)

    function submit(e: React.FormEvent) {
        e.preventDefault()
        if (value < MIN_TOP_UP || value > MAX_TOP_UP) {
            toast.error(`مبلغ باید بین ${formatAmount(String(MIN_TOP_UP))} و ${formatAmount(String(MAX_TOP_UP))} باشد.`)
            return
        }
        setConfirming(true)
    }

    async function pay() {
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
        <>
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
                <Button type="submit" size="lg">
                    پرداخت با سپال
                </Button>
            </form>
            <PaymentConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title="افزایش موجودی کیف پول"
                amountLabel="مبلغ افزوده به کیف پول"
                amount={value}
                vatPercent={vatPercent}
                pending={pending}
                onConfirm={pay}
            />
        </>
    )
}
