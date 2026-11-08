"use client"
import type { SignupDetails } from "@/app/tenant/[subdomain]/verify/actions"
import { useState } from "react"
import { isValidJalaliDate, isValidNationalCode, isValidPhoneNumber } from "@zar-imen/shared"
import { Button } from "@/components/shad/button"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { PersianCalendar } from "@/components/shared/PersianCalendar"
import { toLatinDigits } from "@/lib/format"
import { PhoneInput } from "./PhoneInput"

type Errors = Partial<Record<keyof SignupDetails, string>>

function validate(details: SignupDetails): Errors {
    const errors: Errors = {}
    if (!isValidNationalCode(details.ssn))
        errors.ssn = details.ssn.length === 10 ? "کد ملی معتبر نیست." : "کد ملی ۱۰ رقم است."
    if (!isValidPhoneNumber(details.phoneNumber))
        errors.phoneNumber = "شماره موبایل ۱۱ رقم و با ۰۹ شروع می‌شود."
    if (!isValidJalaliDate(details.birthDate))
        errors.birthDate = "تاریخ تولد را انتخاب کنید."
    return errors
}

/** Phase 1 (signup): national code, mobile, birth date. */
export function IdentityStep({ initial, pending, onSubmit }: { initial: SignupDetails, pending: boolean, onSubmit: (details: SignupDetails) => void }) {
    const [details, setDetails] = useState(initial)
    const [errors, setErrors] = useState<Errors>({})

    function submit(e: React.FormEvent) {
        e.preventDefault()
        const found = validate(details)
        setErrors(found)
        if (!Object.keys(found).length)
            onSubmit(details)
    }

    return (
        <form onSubmit={submit} className="grid gap-5" noValidate>
            <div className="grid gap-2">
                <Label htmlFor="ssn">کد ملی</Label>
                <Input
                    id="ssn"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0012345678"
                    className="tracking-widest"
                    value={details.ssn}
                    onChange={e => setDetails(d => ({ ...d, ssn: toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 10) }))}
                    autoFocus
                />
                {errors.ssn && <p className="text-sm text-destructive">{errors.ssn}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="phone">شماره موبایل</Label>
                <PhoneInput id="phone" value={details.phoneNumber} onChange={phoneNumber => setDetails(d => ({ ...d, phoneNumber }))} />
                {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
            </div>

            <div className="grid gap-2">
                <PersianCalendar
                    label="تاریخ تولد"
                    placeholder="انتخاب تاریخ"
                    value={details.birthDate}
                    onChange={birthDate => setDetails(d => ({ ...d, birthDate }))}
                />
                {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate}</p>}
            </div>

            <Button type="submit" size="lg" className="h-12 text-base" disabled={pending}>
                {pending && <Spinner />}
                استعلام و ادامه
            </Button>
            <p className="text-xs text-muted-foreground text-center">
                شماره موبایل باید به نام صاحب کد ملی باشد (استعلام از سامانه شاهکار).
            </p>
        </form>
    )
}
