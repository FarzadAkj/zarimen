"use client"
import type { ShopModel } from "@/api/Api"
import type { ShopFormValues } from "@/components/shop/ShopForm"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createImageUpload, updateShop } from "@/app/panel/(admin)/shops/actions"
import { ShopForm } from "@/components/shop/ShopForm"

/** The admin edits a shop (zarimen.ir/panel/customers/<subdomain>/edit); subdomain, mobile and national code stay. */
export function EditShopForm({ shop, rootDomain }: { shop: ShopModel, rootDomain: string }) {
    const router = useRouter()
    const back = () => router.push(`/panel/customers/${shop.subdomain}`)

    async function onSubmit(values: ShopFormValues) {
        const { data, error } = await updateShop({
            shopId: shop.id,
            name: values.name,
            brandName: values.brandName,
            logoUrl: values.logoUrl,
            address: values.address,
            landline: values.landline,
            ownerFullName: values.ownerFullName,
        })
        if (!data) {
            toast.error(error?.translation)
            return
        }
        toast.success("اطلاعات فروشگاه ذخیره شد.")
        back()
    }

    return (
        <ShopForm
            rootDomain={rootDomain}
            shop={shop}
            signLogoUpload={createImageUpload}
            submitLabel="ذخیره تغییرات"
            onSubmit={onSubmit}
            onCancel={back}
        />
    )
}
