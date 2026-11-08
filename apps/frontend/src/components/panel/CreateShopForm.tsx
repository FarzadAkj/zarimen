"use client"
import type { ShopFormField, ShopFormValues } from "@/components/shop/ShopForm"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createImageUpload, createShop } from "@/app/panel/(admin)/shops/actions"
import { ShopForm, TAKEN_MESSAGES } from "@/components/shop/ShopForm"

/** Backend errors that belong under one field of the form. */
const FIELD_ERRORS: Record<string, ShopFormField> = {
    SubdomainTaken: "subdomain",
    NationalCodeTaken: "ownerNationalCode",
    PhoneNumberTaken: "ownerPhoneNumber",
}

/** The admin adds a shop directly (zarimen.ir/panel/shops/new): checks, Shahkar included, run on submit. */
export function CreateShopForm({ rootDomain }: { rootDomain: string }) {
    const router = useRouter()

    async function onSubmit(values: ShopFormValues) {
        const { data, error } = await createShop(values)
        if (!data) {
            const field = error && FIELD_ERRORS[error.message]
            if (field)
                return { [field]: TAKEN_MESSAGES[field as keyof typeof TAKEN_MESSAGES] }
            toast.error(error?.translation)
            return
        }
        toast.success(`فروشگاه «${data.name}» ثبت شد.`)
        router.push("/panel")
    }

    return (
        <ShopForm
            rootDomain={rootDomain}
            withWalletBalance
            signLogoUpload={createImageUpload}
            submitLabel="ثبت فروشگاه"
            onSubmit={onSubmit}
            onCancel={() => router.push("/panel")}
        />
    )
}
