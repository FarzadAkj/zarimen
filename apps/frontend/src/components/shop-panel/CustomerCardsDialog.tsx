"use client"
import type { ShopCustomerCardModel } from "@/api/Api"
import type { ServerResponse } from "@/app/types"
import { useEffect, useState } from "react"
import { CreditCard, Eye } from "lucide-react"
import { Button } from "@/components/shad/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shad/dialog"
import { Spinner } from "@/components/shad/spinner"
import { formatCardNumber } from "@/lib/format"

/**
 * The card count in the customers table, with an eye button that opens the customer's
 * cards with their full numbers. The numbers are fetched only when the dialog opens.
 * `openOnMount`: opened as soon as the row appears (the owner came from an SMS link).
 */
export function CustomerCardsDialog({ customerId, ssn, cardCount, loadCards, openOnMount = false }: {
    customerId: string
    ssn: string
    cardCount: number
    loadCards: (customerId: string) => Promise<ServerResponse<ShopCustomerCardModel[]>>
    openOnMount?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [cards, setCards] = useState<ShopCustomerCardModel[]>()
    const [error, setError] = useState<string>()

    useEffect(() => {
        if (openOnMount && cardCount)
            onOpenChange(true)
        // only on arrival: later searches must not reopen it
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function onOpenChange(next: boolean) {
        setOpen(next)
        if (!next) return
        setCards(undefined)
        setError(undefined)
        const result = await loadCards(customerId)
        if (result.data)
            setCards(result.data)
        else
            setError(result.error?.translation)
    }

    if (!cardCount)
        return <span className="text-muted-foreground">۰</span>

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <div className="flex items-center gap-1">
                <span>{cardCount.toLocaleString("fa-IR")}</span>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7" aria-label="نمایش کارت‌ها">
                        <Eye className="size-4" />
                    </Button>
                </DialogTrigger>
            </div>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>کارت‌های بانکی مشتری</DialogTitle>
                    <DialogDescription>
                        کد ملی {ssn}
                    </DialogDescription>
                    <DialogDescription>
                        تمامی کارت‌های زیر با استعلام بانکی، به نام این مشتری تأیید شده‌اند.
                    </DialogDescription>
                </DialogHeader>
                {error && <p className="text-destructive text-sm">{error}</p>}
                {!cards && !error && <Spinner className="mx-auto my-4" />}
                {cards && (
                    <ul className="grid gap-2">
                        {cards.map(card => (
                            <li key={card.id} className="flex items-center gap-3 rounded-xl border p-3">
                                <CreditCard className="size-6 text-primary shrink-0" />
                                <div className="flex-1 grid">
                                    <span dir="ltr" className="font-mono text-lg tracking-wider text-end select-all">{formatCardNumber(card.cardNumber)}</span>
                                    {card.bankName && <span className="text-xs text-muted-foreground">{card.bankName}</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </DialogContent>
        </Dialog>
    )
}
