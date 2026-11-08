"use client"
import type { ShopFormValues } from "@/components/shop/ShopForm"
import { useState } from "react"
import { CircleCheck } from "lucide-react"
import { toast } from "sonner"
import { ShopForm, TAKEN_MESSAGES } from "@/components/shop/ShopForm"
import { createTobeShopLogoUpload, submitTobeShop } from "@/lib/signup-api"

/**
 * zarimen.ir/signup: anyone asks for a shop with the admin's shop form (no wallet balance).
 * Values an existing shop already has are refused under their fields; Shahkar is checked
 * later, by the admin.
 */
export function ShopRequestForm({ rootDomain }: { rootDomain: string }) {
    const [sent, setSent] = useState(false)

    async function onSubmit(values: ShopFormValues) {
        // without `withWalletBalance` the form leaves initialWalletBalance undefined
        const { data, error } = await submitTobeShop(values)
        if (!data) {
            toast.error(error?.translation)
            return
        }
        if (!data.accepted) {
            toast.error("برخی از اطلاعات قبلاً برای فروشگاه دیگری ثبت شده است.")
            return {
                ...(data.subdomainTaken && { subdomain: TAKEN_MESSAGES.subdomain }),
                ...(data.nationalCodeTaken && { ownerNationalCode: TAKEN_MESSAGES.ownerNationalCode }),
                ...(data.phoneNumberTaken && { ownerPhoneNumber: TAKEN_MESSAGES.ownerPhoneNumber }),
            }
        }
        setSent(true)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    if (sent) {
        return (
            <div className="grid justify-items-center gap-3 py-10 text-center">
                <CircleCheck className="size-14 text-green-600" strokeWidth={1.5} />
                <h2 className="text-xl font-bold">درخواست شما ثبت شد</h2>
                <p className="max-w-md leading-7 text-muted-foreground">
                    اطلاعات شما را بررسی می‌کنیم و نتیجه را حداکثر تا ۲۴ ساعت آینده از طریق پیامک به شما اطلاع می‌دهیم.
                </p>
            </div>
        )
    }

    return <ShopForm rootDomain={rootDomain} signLogoUpload={createTobeShopLogoUpload} submitLabel="ارسال درخواست" onSubmit={onSubmit} />
}
