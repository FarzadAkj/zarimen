"use client"
import type { SubscriptionPlanModel } from "@/api/Api"
import { useState } from "react"
import { toast } from "sonner"
import { startSubscriptionPurchase } from "@/app/tenant/[subdomain]/panel/actions"
import { Button } from "@/components/shad/button"
import { PaymentConfirmDialog } from "@/components/shop-panel/PaymentConfirmDialog"

/**
 * Shows the plan's price (after the admin's discount) + VAT, then sends the owner to SePal for the total;
 * SePal posts the result back through the backend to /panel/subscription?purchase=…
 */
export function BuyPlanButton({ plan, vatPercent }: { plan: SubscriptionPlanModel, vatPercent: number }) {
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)

    async function buy() {
        setPending(true)
        const { data, error } = await startSubscriptionPurchase(plan.id)
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
                title={`خرید «${plan.title}»`}
                amountLabel="قیمت اشتراک"
                amount={Number(plan.finalPrice)}
                discount={plan.discountPercent > 0 ? { fullAmount: Number(plan.price), percent: plan.discountPercent } : undefined}
                vatPercent={vatPercent}
                pending={pending}
                onConfirm={buy}
            />
        </>
    )
}
