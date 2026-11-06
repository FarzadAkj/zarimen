"use client"
import { useState } from "react"
import { isValidPhoneNumber } from "@zar-imen/shared"
import { Button } from "@/components/shad/button"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { PhoneInput } from "./PhoneInput"

/** Phase 1 (returning customer): just the mobile number. */
export function LoginStep({ initial, pending, onSubmit }: { initial: string, pending: boolean, onSubmit: (phoneNumber: string) => void }) {
    const [phoneNumber, setPhoneNumber] = useState(initial)
    const [error, setError] = useState<string>()

    function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!isValidPhoneNumber(phoneNumber)) {
            setError("۹ رقم بعد از ۰۹ را وارد کنید.")
            return
        }
        setError(undefined)
        onSubmit(phoneNumber)
    }

    return (
        <form onSubmit={submit} className="grid gap-5" noValidate>
            <div className="grid gap-2">
                <Label htmlFor="login-phone">شماره موبایلی که با آن ثبت‌نام کرده‌اید</Label>
                <PhoneInput id="login-phone" value={phoneNumber} onChange={setPhoneNumber} autoFocus />
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button type="submit" size="lg" className="h-12 text-base" disabled={pending}>
                {pending && <Spinner />}
                ارسال کد ورود
            </Button>
        </form>
    )
}
