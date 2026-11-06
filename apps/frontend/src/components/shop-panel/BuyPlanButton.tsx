"use client"
import { useState } from "react"
import { toast } from "sonner"
import { startSubscriptionPurchase } from "@/app/tenant/[subdomain]/panel/actions"
import { Button } from "@/components/shad/button"
import { Spinner } from "@/components/shad/spinner"

/** Sends the owner to Zarinpal for the plan; Zarinpal comes back through the backend to /panel/subscription?purchase=… */
export function BuyPlanButton({ planId }: { planId: string }) {
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
        <Button onClick={buy} disabled={pending} className="w-full">
            {pending && <Spinner />}
            خرید با زرین‌پال
        </Button>
    )
}
