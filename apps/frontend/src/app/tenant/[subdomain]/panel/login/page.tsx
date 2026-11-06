import { notFound } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { OtpLoginCard } from "@/components/shared/OtpLoginCard"
import { exchangeShopOtp, readShopLoginInfo, sendShopOtp } from "../actions"

/** <subdomain>.zarimen.ir/panel/login (rewritten here by src/proxy.ts). */
export default async function ShopLoginPage() {
    const { data: shop, error } = await readShopLoginInfo()
    if (error?.message === "NotFound") notFound()
    if (!shop) throw new Error(error?.translation)

    if (!shop.isActive) {
        return (
            <main className="min-h-dvh grid place-items-center p-4 bg-muted">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>{shop.name}</CardTitle>
                        <CardDescription>پنل این فروشگاه غیرفعال شده است. برای فعال‌سازی با پشتیبانی زر ایمن تماس بگیرید.</CardDescription>
                    </CardHeader>
                </Card>
            </main>
        )
    }

    return (
        <OtpLoginCard
            title={`ورود به پنل ${shop.name}`}
            description="کد ورود به شماره موبایل مالک فروشگاه پیامک می‌شود."
            logoUrl={shop.logoUrl}
            sendOtp={sendShopOtp}
            exchangeOtp={exchangeShopOtp}
        />
    )
}
