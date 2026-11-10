import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/shad/button"
import { cn } from "@/lib/utils"

/** «قبلی / صفحه n از m / بعدی» links under a paged table; hidden when there is one page. */
export function Pager({ page, pages, pageHref }: {
    page: number
    pages: number
    /** URL of another page, e.g. p => `/panel/transactions?page=${p}`. */
    pageHref: (page: number) => string
}) {
    if (pages <= 1)
        return null
    return (
        <div className="flex items-center justify-center gap-3 text-sm">
            <Button asChild variant="outline" size="sm" className={cn(page <= 1 && "pointer-events-none opacity-50")}>
                <Link href={pageHref(page - 1)}><ChevronRight />قبلی</Link>
            </Button>
            <span>صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span>
            <Button asChild variant="outline" size="sm" className={cn(page >= pages && "pointer-events-none opacity-50")}>
                <Link href={pageHref(page + 1)}>بعدی<ChevronLeft /></Link>
            </Button>
        </div>
    )
}
