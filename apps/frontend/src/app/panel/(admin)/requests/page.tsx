import type { TobeShopModel, TobeShopStatus } from "@/api/Api"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { TobeShopActions } from "@/components/requests/TobeShopActions"
import { TOBE_SHOP_STATUS_LABELS, TobeShopStatusBadge } from "@/components/requests/TobeShopStatusBadge"
import { Button } from "@/components/shad/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { parsePage } from "@/components/shop-panel/WalletTransactionsTable"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { readTobeShops } from "./actions"

const STATUSES = Object.keys(TOBE_SHOP_STATUS_LABELS) as TobeShopStatus[]

function href(status: TobeShopStatus | undefined, page = 1) {
    const query = new URLSearchParams({ ...(status && { status }), ...(page > 1 && { page: String(page) }) }).toString()
    return `/panel/requests${query && `?${query}`}`
}

function Detail({ label, value, ltr }: { label: string, value: string | null, ltr?: boolean }) {
    return (
        <div className="grid">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span dir={ltr ? "ltr" : undefined} className={cn(ltr && "text-end font-mono")}>{value || "—"}</span>
        </div>
    )
}

function RequestCard({ request }: { request: TobeShopModel }) {
    return (
        <article className="grid gap-4 rounded-xl border bg-background p-4">
            <div className="flex flex-wrap items-center gap-3">
                {request.logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <a href={request.logoUrl} target="_blank" rel="noreferrer"><img src={request.logoUrl} alt="" className="size-12 rounded-md border object-cover" /></a>
                    : null}
                <div className="grid flex-1">
                    <span className="font-bold">{request.name}</span>
                    <span className="text-sm text-muted-foreground">{request.brandName} · {formatDateTime(request.createdAt)}</span>
                </div>
                <TobeShopStatusBadge status={request.status} />
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
                <Detail label="زیردامنه" value={request.subdomain} ltr />
                <Detail label="مالک" value={request.ownerFullName} />
                <Detail label="موبایل مالک" value={request.ownerPhoneNumber} ltr />
                <Detail label="کد ملی مالک" value={request.ownerNationalCode} ltr />
                <Detail label="تلفن ثابت" value={request.landline} ltr />
                <Detail label="آدرس" value={request.address} />
            </div>
            {request.problem && <p className="text-sm text-destructive">علت لغو: {request.problem}</p>}
            {request.smsSentAt && <p className="text-xs text-muted-foreground">پیامک در {formatDateTime(request.smsSentAt)} ارسال شد.</p>}
            <TobeShopActions request={request} />
        </article>
    )
}

/** zarimen.ir/panel/requests — shop requests from zarimen.ir/signup. */
export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ page?: string, status?: string }> }) {
    const query = await searchParams
    const page = parsePage(query.page)
    const status = STATUSES.find(s => s === query.status)
    const { data, error } = await readTobeShops(page, status)
    const pages = data ? Math.max(1, Math.ceil(data.count / data.pageSize)) : 1

    return (
        <Card>
            <CardHeader>
                <CardTitle>درخواست‌های راه‌اندازی</CardTitle>
                <CardDescription>فرم‌های ارسال‌شده از صفحه zarimen.ir/signup. با هر درخواست جدید پیامک اطلاع‌رسانی برای مدیران ارسال می‌شود.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
                <nav className="flex flex-wrap gap-2 text-sm">
                    {[undefined, ...STATUSES].map(s => (
                        <Link
                            key={s ?? "all"}
                            href={href(s)}
                            className={cn("rounded-full border px-3 py-1 transition", s === status ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted")}
                        >
                            {s ? TOBE_SHOP_STATUS_LABELS[s] : "همه"}
                        </Link>
                    ))}
                </nav>

                {!data && <p className="text-destructive">{error?.translation}</p>}
                {data && !data.count && <p className="text-muted-foreground text-center py-8">درخواستی وجود ندارد.</p>}
                {data?.data.map(request => <RequestCard key={request.id} request={request} />)}

                {pages > 1 && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                        <Button asChild variant="outline" size="sm" className={cn(page <= 1 && "pointer-events-none opacity-50")}>
                            <Link href={href(status, page - 1)}><ChevronRight />قبلی</Link>
                        </Button>
                        <span>صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span>
                        <Button asChild variant="outline" size="sm" className={cn(page >= pages && "pointer-events-none opacity-50")}>
                            <Link href={href(status, page + 1)}>بعدی<ChevronLeft /></Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
