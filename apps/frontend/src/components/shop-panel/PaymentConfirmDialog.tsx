"use client"
import Link from "next/link"
import { Headset } from "lucide-react"
import { vatOf } from "@zar-imen/shared"
import { Button } from "@/components/shad/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shad/dialog"
import { Spinner } from "@/components/shad/spinner"
import { formatAmount, formatRials } from "@/lib/format"

/**
 * `NEXT_PUBLIC_ZARINPAL_ENABLED=true` turns online payment on. Until the Zarinpal account is
 * registered it is off: the dialog shows the amounts and sends the owner to a support ticket
 * (subject and amounts prefilled) instead of the gateway.
 */
const ZARINPAL_ENABLED = process.env.NEXT_PUBLIC_ZARINPAL_ENABLED === "true"

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
    const ticketHref = `/panel/tickets/new?${new URLSearchParams({
        title,
        body: `${amountLabel}: ${formatAmount(String(amount))}\nمالیات بر ارزش افزوده: ${formatAmount(String(vat))}\nمبلغ قابل پرداخت: ${formatAmount(String(total))}`,
    })}`

    return (
        <Dialog open={open} onOpenChange={next => !pending && onOpenChange(next)}>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {!ZARINPAL_ENABLED
                            ? "پرداخت آنلاین فعلاً فعال نیست. برای پرداخت، از طریق تیکت با پشتیبانی در ارتباط باشید."
                            : vatPercent > 0
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
                    {ZARINPAL_ENABLED && (
                        <p className="text-xs text-muted-foreground">
                            در درگاه پرداخت: {formatRials(total)}
                        </p>
                    )}
                </dl>
                {ZARINPAL_ENABLED
                    ? (
                        <Button onClick={onConfirm} disabled={pending} size="lg">
                            {pending && <Spinner />}
                            پرداخت با زرین‌پال
                        </Button>
                    )
                    : (
                        <Button asChild size="lg">
                            <Link href={ticketHref}>
                                <Headset />
                                ثبت تیکت به پشتیبانی
                            </Link>
                        </Button>
                    )}
            </DialogContent>
        </Dialog>
    )
}
