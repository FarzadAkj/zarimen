"use client"
import { useEffect, useState } from "react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/shad/input-otp"
import { Spinner } from "@/components/shad/spinner"
import { maskPhoneNumber, toLatinDigits } from "@/lib/format"

type Props = {
    phoneNumber: string
    expiresInSeconds: number
    pending: boolean
    onSubmit: (code: string) => Promise<boolean>
    onResend: () => void
    onBack: () => void
}

/** Phase 2: the 6-digit SMS code sent to the customer's phone. Remounted (new `key`) on every send, which restarts the countdown. */
export function CodeStep({ phoneNumber, expiresInSeconds, pending, onSubmit, onResend, onBack }: Props) {
    const [code, setCode] = useState("")
    const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds)

    useEffect(() => {
        if (secondsLeft <= 0) return
        const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
        return () => clearTimeout(timer)
    }, [secondsLeft])

    async function complete(value: string) {
        if (!await onSubmit(value))
            setCode("")
    }

    return (
        <div className="grid gap-5">
            <p className="text-center text-sm">
                کد ۶ رقمی به شماره <span dir="ltr" className="font-bold">{maskPhoneNumber(phoneNumber)}</span> ارسال شده است.
            </p>
            <div dir="ltr" className="flex justify-center">
                <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={v => setCode(toLatinDigits(v))}
                    onComplete={complete}
                    disabled={pending}
                    autoFocus
                >
                    <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} className="size-12 text-lg" />)}
                    </InputOTPGroup>
                </InputOTP>
            </div>
            {pending && <Spinner className="mx-auto" />}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <button type="button" className="underline" onClick={onBack} disabled={pending}>اصلاح اطلاعات</button>
                {secondsLeft > 0
                    ? <span>ارسال مجدد تا {secondsLeft.toLocaleString("fa-IR")} ثانیه</span>
                    : <button type="button" className="underline" onClick={onResend} disabled={pending}>ارسال مجدد کد</button>}
            </div>
        </div>
    )
}
