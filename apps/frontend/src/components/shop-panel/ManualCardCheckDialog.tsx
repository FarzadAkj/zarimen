"use client"
import type { CheckCardManuallyInput, ManualCardCheckModel } from "@/api/Api"
import type { ServerResponse } from "@/app/types"
import { useState } from "react"
import Link from "next/link"
import { CircleCheck, CircleX, SearchCheck } from "lucide-react"
import { isValidBankCardNumber, isValidJalaliDate, isValidNationalCode } from "@zar-imen/shared"
import { Button } from "@/components/shad/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shad/dialog"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { PersianCalendar } from "@/components/shared/PersianCalendar"
import { formatAmount, formatCardNumber, toLatinDigits } from "@/lib/format"

type Errors = Partial<Record<keyof CheckCardManuallyInput, string>>

const EMPTY: CheckCardManuallyInput = { ssn: "", birthDate: "", cardNumber: "" }

function validate(input: CheckCardManuallyInput): Errors {
    const errors: Errors = {}
    if (!isValidNationalCode(input.ssn))
        errors.ssn = "کد ملی ۱۰ رقم است."
    if (!isValidJalaliDate(input.birthDate))
        errors.birthDate = "تاریخ تولد را انتخاب کنید."
    if (!isValidBankCardNumber(input.cardNumber))
        errors.cardNumber = input.cardNumber.length === 16 ? "شماره کارت معتبر نیست." : "شماره کارت ۱۶ رقم است."
    return errors
}

/**
 * «استعلام دستی» on the owner's customers page: does a card belong to a national code +
 * birth date? Paid from the wallet at the card-check price; the answer is only shown here,
 * nothing about the person is saved.
 */
export function ManualCardCheckDialog({ cost, check }: {
    /** Card-check price in Tomans, when known. */
    cost?: number
    check: (input: CheckCardManuallyInput) => Promise<ServerResponse<ManualCardCheckModel>>
}) {
    const [input, setInput] = useState(EMPTY)
    const [errors, setErrors] = useState<Errors>({})
    const [pending, setPending] = useState(false)
    const [result, setResult] = useState<ManualCardCheckModel>()
    const [error, setError] = useState<{ code: string, text?: string }>()

    function onOpenChange(open: boolean) {
        if (open) return
        setInput(EMPTY)
        setErrors({})
        setResult(undefined)
        setError(undefined)
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        const found = validate(input)
        setErrors(found)
        if (Object.keys(found).length) return

        setPending(true)
        setResult(undefined)
        setError(undefined)
        const response = await check(input)
        setPending(false)
        if (response.data)
            setResult(response.data)
        else
            setError({ code: response.error?.message ?? "", text: response.error?.translation })
    }

    /** Any edit hides the previous answer, so it is never shown next to other data. */
    function edit(change: Partial<CheckCardManuallyInput>) {
        setInput(i => ({ ...i, ...change }))
        setResult(undefined)
    }

    return (
        <Dialog onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <SearchCheck />
                    استعلام دستی
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>استعلام دستی کارت بانکی</DialogTitle>
                    <DialogDescription>
                        بررسی می‌شود که کارت بانکی به نام صاحب این کد ملی و تاریخ تولد باشد. این اطلاعات ذخیره نمی‌شود.
                    </DialogDescription>
                    {cost !== undefined && (
                        <DialogDescription>
                            هزینه هر استعلام: {cost ? formatAmount(String(cost)) : "رایگان"} (از کیف پول کسر می‌شود)
                        </DialogDescription>
                    )}
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4" noValidate>
                    <div className="grid gap-2">
                        <Label htmlFor="manual-ssn">کد ملی</Label>
                        <Input
                            id="manual-ssn"
                            dir="ltr"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="0012345678"
                            className="tracking-widest"
                            value={input.ssn}
                            onChange={e => edit({ ssn: toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 10) })}
                        />
                        {errors.ssn && <p className="text-sm text-destructive">{errors.ssn}</p>}
                    </div>

                    <div className="grid gap-2">
                        <PersianCalendar
                            label="تاریخ تولد"
                            placeholder="انتخاب تاریخ"
                            value={input.birthDate}
                            onChange={birthDate => edit({ birthDate })}
                        />
                        {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="manual-card">شماره کارت</Label>
                        <Input
                            id="manual-card"
                            dir="ltr"
                            inputMode="numeric"
                            placeholder="6037-9900-0000-0000"
                            className="font-mono tracking-wider"
                            value={formatCardNumber(input.cardNumber)}
                            onChange={e => edit({ cardNumber: toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 16) })}
                        />
                        {errors.cardNumber && <p className="text-sm text-destructive">{errors.cardNumber}</p>}
                    </div>

                    <Button type="submit" disabled={pending}>
                        {pending && <Spinner />}
                        استعلام
                    </Button>
                </form>

                {result && (
                    <div className={`flex items-center gap-3 rounded-xl border p-3 ${result.matched ? "border-green-600/40 bg-green-600/10" : "border-destructive/40 bg-destructive/10"}`}>
                        {result.matched
                            ? <CircleCheck className="size-6 shrink-0 text-green-600" />
                            : <CircleX className="size-6 shrink-0 text-destructive" />}
                        <div className="grid">
                            <span className="font-bold">
                                {result.matched ? "کارت تأیید شد" : "کارت تأیید نشد"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {result.matched
                                    ? "این کارت بانکی به نام صاحب این کد ملی و تاریخ تولد است."
                                    : "این کارت بانکی به نام صاحب این کد ملی و تاریخ تولد نیست."}
                            </span>
                            {result.bankName && <span className="text-xs text-muted-foreground">{result.bankName}</span>}
                        </div>
                    </div>
                )}

                {error?.code === "InsufficientBalance" && (
                    <p className="text-sm text-destructive">
                        موجودی کیف پول برای این استعلام کافی نیست.{" "}
                        <Link href="/panel/wallet" className="underline">شارژ کیف پول</Link>
                    </p>
                )}
                {error && error.code !== "InsufficientBalance" && <p className="text-sm text-destructive">{error.text}</p>}
            </DialogContent>
        </Dialog>
    )
}
