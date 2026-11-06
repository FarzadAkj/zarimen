import Link from "next/link"
import { DisabledShopNotice } from "@/components/shop/DisabledShopNotice"
import { ShopLogo } from "@/components/shop/ShopLogo"
import { getShopPublicInfo } from "@/lib/current-shop"

/**
 * <subdomain>.zarimen.ir/verify — where the landing page's button leads.
 * Placeholder: the verification steps (phone, national code, bank card) are the next step.
 */
export default async function VerifyPage() {
    const shop = await getShopPublicInfo()
    if (!shop.isActive) return <DisabledShopNotice shop={shop} />

    return (
        <main className="min-h-dvh grid place-items-center p-6 bg-muted">
            <div className="w-full max-w-sm text-center grid justify-items-center gap-3">
                <ShopLogo logoUrl={shop.logoUrl} brandName={shop.brandName} className="size-16" />
                <h1 className="text-xl font-bold">احراز هویت مشتری — {shop.name}</h1>
                <p className="text-muted-foreground">این بخش به‌زودی راه‌اندازی می‌شود.</p>
                <Link href="/" className="text-sm underline">بازگشت</Link>
            </div>
        </main>
    )
}
