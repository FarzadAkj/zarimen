import type { ReadNoticesOutput } from "@/api/Api"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MessageSquareText } from "lucide-react"
import { Button } from "@/components/shad/button"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"

/** The admins' notices, newest first: each once, with how many shops got it and the SMS sent. */
export function NoticesList({ result, page, pageHref }: {
    result: ReadNoticesOutput
    page: number
    pageHref: (page: number) => string
}) {
    const pages = Math.max(1, Math.ceil(result.count / result.pageSize))

    if (!result.count)
        return <p className="text-muted-foreground text-center py-8">هنوز اطلاعیه‌ای ارسال نشده است.</p>

    return (
        <div className="grid gap-4">
            <ul className="grid gap-3">
                {result.data.map(notice => (
                    <li key={notice.id} className="grid gap-2 rounded-xl border p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-medium">{notice.title}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatDateTime(notice.createdAt)} · {notice.shopCount.toLocaleString("fa-IR")} فروشگاه
                            </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{notice.body}</p>
                        {!!notice.imageUrls.length && (
                            <div className="flex gap-2">
                                {notice.imageUrls.map(url => (
                                    <a key={url} href={url} target="_blank" rel="noreferrer" className="size-16 overflow-hidden rounded-lg border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="پیوست" className="size-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        )}
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MessageSquareText className="size-3.5" />
                            {notice.smsSent ? "پیامک برای مالکان ارسال شد" : "بدون پیامک"}
                        </p>
                    </li>
                ))}
            </ul>

            {pages > 1 && (
                <div className="flex items-center justify-center gap-3 text-sm">
                    <Button asChild variant="outline" size="sm" className={cn(page <= 1 && "pointer-events-none opacity-50")}>
                        <Link href={pageHref(page - 1)}><ChevronRight />قبلی</Link>
                    </Button>
                    <span>صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span>
                    <Button asChild variant="outline" size="sm" className={cn(page >= pages && "pointer-events-none opacity-50")}>
                        <Link href={pageHref(page + 1)}>بعدی<ChevronLeft /></Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
