import { OtpLoginCard } from "@/components/shared/OtpLoginCard"
import { exchangeAdminOtp, sendAdminOtp } from "./actions"

export default function AdminLoginPage() {
    return (
        <OtpLoginCard
            title="ورود به پنل مدیریت زر ایمن"
            description="کد ورود به شماره موبایل مدیر پیامک می‌شود."
            sendOtp={sendAdminOtp}
            exchangeOtp={exchangeAdminOtp}
        />
    )
}
