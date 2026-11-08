import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/shad/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { parsePage } from "@/components/shop-panel/WalletTransactionsTable"
import { TicketsTable } from "@/components/ticket/TicketsTable"
import { readMyTickets } from "../../actions"

/** <subdomain>.zarimen.ir/panel/tickets — the owner's support tickets. */
export default async function ShopTicketsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const page = parsePage((await searchParams).page)
    const { data, error } = await readMyTickets(page)

    return (
        <Card>
            <CardHeader className="flex flex-wrap items-start gap-3">
                <div className="grid gap-1.5 flex-1">
                    <CardTitle>پشتیبانی</CardTitle>
                    <CardDescription>سؤال یا مشکل خود را در قالب تیکت برای پشتیبانی زر ایمن بفرستید.</CardDescription>
                </div>
                <Button asChild>
                    <Link href="/panel/tickets/new"><Plus />تیکت جدید</Link>
                </Button>
            </CardHeader>
            <CardContent>
                {data
                    ? <TicketsTable result={data} page={page} basePath="/panel/tickets" pageHref={p => `/panel/tickets?page=${p}`} />
                    : <p className="text-destructive">{error?.translation}</p>}
            </CardContent>
        </Card>
    )
}
