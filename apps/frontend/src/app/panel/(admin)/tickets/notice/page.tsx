import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { NoticeComposer } from "@/components/ticket/NoticeComposer"

/** zarimen.ir/panel/tickets/notice — a notice to every enabled shop (a CLOSED ticket each). */
export default function NewNoticePage() {
    return (
        <div className="grid grid-cols-1 gap-4">
            <Link href="/panel/tickets?view=notices" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary w-fit">
                <ChevronRight className="size-4" />
                اطلاعیه‌ها
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle>ارسال اطلاعیه</CardTitle>
                    <CardDescription>
                        برای هر فروشگاه فعال یک تیکت بسته با همین پیام ثبت می‌شود. مالکان آن را در بخش پشتیبانی پنل خود می‌بینند و نمی‌توانند به آن پاسخ دهند.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <NoticeComposer />
                </CardContent>
            </Card>
        </div>
    )
}
