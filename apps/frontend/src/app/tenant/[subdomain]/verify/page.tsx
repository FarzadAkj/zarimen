import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { DisabledShopNotice } from "@/components/shop/DisabledShopNotice"
import { ShopLogo } from "@/components/shop/ShopLogo"
import { VerifyFlow } from "@/components/verify/VerifyFlow"
import { getShopPublicInfo } from "@/lib/current-shop"
import { readMyCards } from "./actions"

/** <subdomain>.zarimen.ir/verify — customer verification, opened from the landing page's button. */
export default async function VerifyPage() {
    const shop = await getShopPublicInfo()
    if (!shop.isActive || !shop.hasActiveSubscription) return <DisabledShopNotice shop={shop} />

    // A customer still inside their 30-minute session goes straight to their cards.
    const { data: cards } = await readMyCards()

    return (
        <div className="min-h-dvh bg-gradient-to-b from-primary/10 to-background">
            <main className="w-full max-w-md mx-auto px-4 py-6 grid gap-6">
                <header className="flex items-center gap-3">
                    <Link href="/" aria-label="بازگشت" className="p-1 -ms-1 text-muted-foreground hover:text-foreground">
                        <ChevronRight className="size-6" />
                    </Link>
                    <ShopLogo logoUrl={shop.logoUrl} brandName={shop.brandName} className="size-10 text-lg rounded-xl" />
                    <div className="grid">
                        <h1 className="font-bold leading-tight">احراز هویت مشتری</h1>
                        <span className="text-xs text-muted-foreground">{shop.name}</span>
                    </div>
                </header>
                <VerifyFlow initialCards={cards ?? null} />
            </main>
        </div>
    )
}
