"use client"
import type { CustomerCardsModel } from "@/api/Api"
import { useState } from "react"
import { CreditCard, Plus } from "lucide-react"
import { isValidBankCardNumber } from "@zar-imen/shared"
import { Button } from "@/components/shad/button"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { formatCardNumber, toLatinDigits } from "@/lib/format"

type Props = {
    data: CustomerCardsModel
    pending: boolean
    onAdd: (cardNumber: string) => Promise<boolean>
    onFinish: () => void
}

/** Phase 3: the customer's verified cards, and adding another (checked by CardMatch). */
export function CardsStep({ data, pending, onAdd, onFinish }: Props) {
    const [cardNumber, setCardNumber] = useState("")
    const [error, setError] = useState<string>()

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!isValidBankCardNumber(cardNumber)) {
            setError(cardNumber.length === 16 ? "شماره کارت معتبر نیست." : "شماره کارت ۱۶ رقم است.")
            return
        }
        setError(undefined)
        if (await onAdd(cardNumber))
            setCardNumber("")
    }

    return (
        <div className="grid gap-6">
            <section className="grid gap-3">
                <h2 className="font-bold">کارت‌های بانکی تأییدشده</h2>
                {data.cards.length
                    ? (
                        <ul className="grid gap-2">
                            {data.cards.map(card => (
                                <li key={card.id} className="flex items-center gap-3 rounded-xl border bg-background p-3 animate-in fade-in slide-in-from-top-1">
                                    <CreditCard className="size-6 text-primary shrink-0" />
                                    <div className="flex-1 grid">
                                        <span dir="ltr" className="font-mono tracking-wider text-end">{card.maskedNumber}</span>
                                        {card.bankName && <span className="text-xs text-muted-foreground">{card.bankName}</span>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )
                    : <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-4 text-center">هنوز کارتی ثبت نکرده‌اید.</p>}
            </section>

            <form onSubmit={submit} className="grid gap-2" noValidate>
                <Label htmlFor="card">افزودن کارت جدید</Label>
                <div className="flex gap-2">
                    <Input
                        id="card"
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="0000 0000 0000 0000"
                        className="font-mono tracking-wider"
                        value={formatCardNumber(cardNumber)}
                        onChange={e => setCardNumber(toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 16))}
                    />
                    <Button type="submit" disabled={pending}>
                        {pending ? <Spinner /> : <Plus />}
                        افزودن
                    </Button>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <p className="text-xs text-muted-foreground">کارت باید به نام خودتان باشد؛ با کد ملی و تاریخ تولد شما استعلام می‌شود.</p>
            </form>

            <Button type="button" variant="outline" size="lg" onClick={onFinish}>پایان</Button>
        </div>
    )
}
