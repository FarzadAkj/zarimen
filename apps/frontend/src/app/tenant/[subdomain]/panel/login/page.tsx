import { DisabledShopNotice } from "@/components/shop/DisabledShopNotice"
import { OtpLoginCard } from "@/components/shared/OtpLoginCard"
import { getShopPublicInfo } from "@/lib/current-shop"
import { exchangeShopOtp, sendShopOtp } from "../actions"

/** <subdomain>.zarimen.ir/panel/login (rewritten here by src/proxy.ts). */
export default async function ShopLoginPage() {
    const shop = await getShopPublicInfo()
    if (!shop.isActive) return <DisabledShopNotice shop={shop} />

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
