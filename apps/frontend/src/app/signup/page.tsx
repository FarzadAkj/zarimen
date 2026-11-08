import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { ShopRequestForm } from "@/components/site/ShopRequestForm"
import { SiteLogo } from "@/components/site/SiteLogo"

export const metadata: Metadata = { title: "درخواست راه‌اندازی | زر ایمن" }

/** zarimen.ir/signup — anyone asks for a shop; the admin checks and registers it. */
export default function SignupPage() {
    return (
        <div className="min-h-dvh bg-muted/50">
            <header className="border-b bg-background">
                <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
                    <Link href="/"><SiteLogo /></Link>
                </div>
            </header>
            <main className="mx-auto max-w-3xl px-4 py-10">
                <Card>
                    <CardHeader>
                        <CardTitle>درخواست راه‌اندازی فروشگاه</CardTitle>
                        <CardDescription className="leading-7">
                            اطلاعات فروشگاه و مالک آن را وارد کنید. پس از بررسی، صفحه اختصاصی و پنل فروشگاه شما راه‌اندازی می‌شود و نتیجه از طریق پیامک به موبایل مالک اطلاع داده می‌شود.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ShopRequestForm rootDomain={process.env.ROOT_DOMAIN!} />
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
