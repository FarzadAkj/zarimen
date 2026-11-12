"use client"
import { useState } from "react"
import { toast } from "sonner"
import { startSubscriptionPurchase } from "@/app/tenant/[subdomain]/panel/actions"
import { Button } from "@/components/shad/button"
import { PaymentConfirmDialog } from "@/components/shop-panel/PaymentConfirmDialog"

/**
 * Shows the plan's price + VAT, then sends the owner to SePal for the total;
 * SePal posts the result back through the backend to /panel/subscription?purchase=…
 */
export function BuyPlanButton({ planId, planTitle, price, vatPercent }: { planId: string, planTitle: string, price: number, vatPercent: number }) {
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)

    async function buy() {
        setPending(true)
        const { data, error } = await startSubscriptionPurchase(planId)
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
            <Button onClick={() => setOpen(true)} className="w-full">
                خرید با سپال
            </Button>
            <PaymentConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title={`خرید «${planTitle}»`}
                amountLabel="قیمت اشتراک"
                amount={price}
                vatPercent={vatPercent}
                pending={pending}
                onConfirm={buy}
            />
        </>
    )
}
