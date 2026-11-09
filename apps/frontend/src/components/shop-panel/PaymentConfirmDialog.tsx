"use client"
import { vatOf } from "@zar-imen/shared"
import { Button } from "@/components/shad/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shad/dialog"
import { Spinner } from "@/components/shad/spinner"
import { formatAmount, formatRials } from "@/lib/format"

/**
 * Shown before the owner goes to Zarinpal: the amount, the VAT added on top of it (the admin's
 * percent, computed like the backend does) and the total charged at the gateway.
 */
export function PaymentConfirmDialog({ open, onOpenChange, title, amountLabel, amount, vatPercent, pending, onConfirm }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    /** e.g. «مبلغ شارژ کیف پول», «قیمت اشتراک» */
    amountLabel: string
    /** Whole Tomans, without VAT. */
    amount: number
    vatPercent: number
    pending: boolean
    onConfirm: () => void
}) {
    const vat = vatOf(amount, vatPercent)
    const total = amount + vat

    return (
        <Dialog open={open} onOpenChange={next => !pending && onOpenChange(next)}>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {vatPercent > 0
                            ? `${vatPercent.toLocaleString("fa-IR")}٪ مالیات بر ارزش افزوده به این مبلغ اضافه می‌شود.`
                            : "مبلغ زیر در درگاه زرین‌پال از شما دریافت می‌شود."}
                    </DialogDescription>
                </DialogHeader>
                <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{amountLabel}</dt>
                        <dd>{formatAmount(String(amount))}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">مالیات بر ارزش افزوده ({vatPercent.toLocaleString("fa-IR")}٪)</dt>
                        <dd>{formatAmount(String(vat))}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t pt-2 text-base font-bold">
                        <dt>مبلغ قابل پرداخت</dt>
                        <dd className="text-primary">{formatAmount(String(total))}</dd>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        در درگاه پرداخت: {formatRials(total)}
                    </p>
                </dl>
                <Button onClick={onConfirm} disabled={pending} size="lg">
                    {pending && <Spinner />}
                    پرداخت با زرین‌پال
                </Button>
            </DialogContent>
        </Dialog>
    )
}
