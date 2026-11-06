import type { Metadata } from "next"
import Link from "next/link"
import { Newspaper } from "lucide-react"
import { Button } from "@/components/shad/button"
import { SiteLogo } from "@/components/site/SiteLogo"

export const metadata: Metadata = {
    title: "وبلاگ | زر ایمن",
}

/** zarimen.ir/blog — placeholder until the blog is specified. */
export default function BlogPage() {
    return (
        <main className="min-h-dvh grid place-items-center p-6">
            <div className="grid justify-items-center gap-4 text-center">
                <Link href="/"><SiteLogo /></Link>
                <Newspaper className="size-12 text-primary" strokeWidth={1.5} />
                <h1 className="text-2xl font-bold">وبلاگ زر ایمن</h1>
                <p className="text-muted-foreground">مقاله‌ها به‌زودی منتشر می‌شوند.</p>
                <Button asChild variant="outline"><Link href="/">بازگشت به صفحه اصلی</Link></Button>
            </div>
        </main>
    )
}
