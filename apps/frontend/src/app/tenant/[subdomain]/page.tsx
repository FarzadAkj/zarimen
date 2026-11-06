import Link from "next/link"
import { ChevronLeft, MapPin, Phone, ShieldCheck } from "lucide-react"
import { DisabledShopNotice } from "@/components/shop/DisabledShopNotice"
import { ShopLogo } from "@/components/shop/ShopLogo"
import { getShopPublicInfo } from "@/lib/current-shop"

/**
 * <subdomain>.zarimen.ir — the shop's landing page (rewritten here by src/proxy.ts).
 * Customers open it in the shop; its one job is the big button that starts verification.
 */
export default async function ShopLandingPage() {
    const shop = await getShopPublicInfo()
    if (!shop.isActive || !shop.hasActiveSubscription) return <DisabledShopNotice shop={shop} />

    return (
        <div className="min-h-dvh flex flex-col bg-gradient-to-b from-primary/15 via-background to-background">
            <main className="flex-1 w-full max-w-md mx-auto px-6 pt-12 pb-8 flex flex-col">
                <section className="grid justify-items-center text-center gap-3">
                    <ShopLogo logoUrl={shop.logoUrl} brandName={shop.brandName} className="size-28 shadow-md" />
                    <h1 className="text-2xl font-bold mt-2">{shop.name}</h1>
                    <p className="text-muted-foreground">{shop.brandName}</p>
                </section>

                <section className="pt-10">
                    <Link
                        href="/verify"
                        className="group flex items-center gap-4 w-full rounded-3xl bg-primary text-primary-foreground px-6 py-7 shadow-xl shadow-primary/30 ring-4 ring-primary/20 transition hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-primary/50"
                    >
                        <ShieldCheck className="size-12 shrink-0" strokeWidth={1.5} />
                        <span className="flex-1 grid gap-1 text-start">
                            <span className="text-2xl font-bold">احراز هویت مشتری</span>
                            <span className="text-sm opacity-90">برای ادامه خرید، هویت خود را تأیید کنید</span>
                        </span>
                        <ChevronLeft className="size-8 shrink-0 transition group-hover:-translate-x-1" />
                    </Link>
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        با شماره موبایل، کد ملی و کارت بانکی خود
                    </p>
                </section>

                {(shop.address || shop.landline) && (
                    <section className="mt-8 grid gap-3 rounded-2xl border bg-background/80 p-4 text-sm">
                        {shop.address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="size-5 shrink-0 text-primary" />
                                <span>{shop.address}</span>
                            </div>
                        )}
                        {shop.landline && (
                            <a href={`tel:${shop.landline}`} className="flex items-center gap-3 hover:text-primary">
                                <Phone className="size-5 shrink-0 text-primary" />
                                <span dir="ltr">{shop.landline}</span>
                            </a>
                        )}
                    </section>
                )}
            </main>

            <footer className="py-4 text-center text-xs text-muted-foreground flex justify-center gap-4">
                <span>زر ایمن</span>
                <Link href="/panel" className="hover:text-primary">ورود فروشنده</Link>
            </footer>
        </div>
    )
}
