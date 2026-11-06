"use client"
import type { ShopCustomerCardModel, ShopCustomerModel } from "@/api/Api"
import type { ServerResponse } from "@/app/types"
import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/shad/input"
import { Spinner } from "@/components/shad/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shad/table"
import { toLatinDigits } from "@/lib/format"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { CustomerCardsDialog } from "./CustomerCardsDialog"

/** Search runs once typing has paused this long. */
const SEARCH_DELAY_MS = 1000

/**
 * Search box + customers table. Typing filters by any part of the national code or the
 * mobile number; only the table reloads. Used by the shop owner and by the admin viewing a
 * shop: each passes server actions that load *that* shop's customers and cards.
 */
export function CustomersBrowser({ initial, loadCustomers, loadCards }: {
    initial: ShopCustomerModel[]
    loadCustomers: (search: string) => Promise<ServerResponse<ShopCustomerModel[]>>
    loadCards: (customerId: string) => Promise<ServerResponse<ShopCustomerCardModel[]>>
}) {
    const [query, setQuery] = useState("")
    const [customers, setCustomers] = useState(initial)
    const [loading, setLoading] = useState(false)
    /** The search the table's rows are for (drives the "nothing found" text). */
    const [shownQuery, setShownQuery] = useState("")
    /** The search the table shows or is loading; a query equal to it needs no request. */
    const searched = useRef("")
    /** Bumped per search, so a slow older response cannot overwrite a newer one. */
    const latest = useRef(0)

    useEffect(() => {
        if (query === searched.current) return
        const timer = setTimeout(async () => {
            const search = query
            searched.current = search
            const id = ++latest.current
            setLoading(true)
            const { data, error } = await loadCustomers(search)
            if (id !== latest.current) return
            setLoading(false)
            if (data) {
                setCustomers(data)
                setShownQuery(search)
            }
            else
                toast.error(error?.translation)
        }, SEARCH_DELAY_MS)
        return () => clearTimeout(timer)
    }, [query, loadCustomers])

    return (
        <div className="grid gap-4">
            <div className="relative max-w-sm">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    className="ps-9"
                    inputMode="numeric"
                    placeholder="جستجو با کد ملی یا شماره موبایل"
                    value={query}
                    onChange={e => setQuery(toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 11))}
                />
                {loading && <Spinner className="absolute end-3 top-1/2 -translate-y-1/2" />}
            </div>

            {!customers.length
                ? (
                    <p className="text-muted-foreground text-center py-8">
                        {shownQuery ? "مشتری‌ای با این مشخصات یافت نشد." : "هنوز مشتری‌ای احراز هویت نشده است."}
                    </p>
                )
                : (
                    <Table className={cn("transition-opacity", loading && "opacity-50")}>
                        <TableHeader>
                            <TableRow>
                                <TableHead>کد ملی</TableHead>
                                <TableHead>موبایل</TableHead>
                                <TableHead>تاریخ تولد</TableHead>
                                <TableHead>کارت‌های تأییدشده</TableHead>
                                <TableHead>اولین مراجعه</TableHead>
                                <TableHead>آخرین مراجعه</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell dir="ltr" className="text-end font-mono">{customer.ssn}</TableCell>
                                    <TableCell dir="ltr" className="text-end font-mono">{customer.phoneNumber}</TableCell>
                                    <TableCell dir="ltr" className="text-end">{customer.birthDate}</TableCell>
                                    <TableCell>
                                        <CustomerCardsDialog customerId={customer.id} ssn={customer.ssn} cardCount={customer.cardCount} loadCards={loadCards} />
                                    </TableCell>
                                    <TableCell>{formatDateTime(customer.firstSeenAt)}</TableCell>
                                    <TableCell>{formatDateTime(customer.lastSeenAt)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
        </div>
    )
}
