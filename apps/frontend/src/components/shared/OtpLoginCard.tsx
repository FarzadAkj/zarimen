"use client"
import type { ServerResponse } from "@/app/types"
import type { OtpSentModel } from "@/api/Api"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { isValidPhoneNumber } from "@zar-imen/shared"
import { Button } from "@/components/shad/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { Input } from "@/components/shad/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/shad/input-otp"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { toLatinDigits } from "@/lib/format"

type Props = {
    title: string
    /** Shown on the phone step. */
    description: string
    logoUrl?: string | null
    sendOtp: (phoneNumber: string) => Promise<ServerResponse<OtpSentModel>>
    exchangeOtp: (phoneNumber: string, code: string) => Promise<ServerResponse<true>>
}

/** Two-step SMS login (phone → 6-digit code) for the admin panel and the shop panels. Lands on /panel. */
export function OtpLoginCard({ title, description, logoUrl, sendOtp, exchangeOtp }: Props) {
    const router = useRouter()
    const [phoneNumber, setPhoneNumber] = useState("")
    const [code, setCode] = useState("")
    const [step, setStep] = useState<"phone" | "code">("phone")
    const [secondsLeft, setSecondsLeft] = useState(0)
    const [pending, setPending] = useState(false)

    useEffect(() => {
        if (secondsLeft <= 0) return
        const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
        return () => clearTimeout(timer)
    }, [secondsLeft])

    async function requestCode() {
        if (!isValidPhoneNumber(phoneNumber)) {
            toast.error("شماره موبایل را با فرمت ۰۹xxxxxxxxx وارد کنید.")
            return
        }
        setPending(true)
        const { data, error } = await sendOtp(phoneNumber)
        setPending(false)
        if (!data) {
            toast.error(error?.translation)
            return
        }
        setCode("")
        setStep("code")
        setSecondsLeft(data.expiresInSeconds)
        toast.success("کد تأیید ارسال شد.")
    }

    async function verifyCode(value: string) {
        setPending(true)
        const { data, error } = await exchangeOtp(phoneNumber, value)
        if (!data) {
            setPending(false)
            setCode("")
            toast.error(error?.translation)
            return
        }
        router.replace("/panel")
        router.refresh()
    }

    return (
        <main className="min-h-dvh grid place-items-center p-4 bg-muted">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    {logoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt="" className="size-16 rounded-lg object-cover border mb-2" />
                    )}
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                        {step === "phone" ? description : `کد ۶ رقمی ارسال شده به ${phoneNumber} را وارد کنید.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === "phone"
                        ? (
                            <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); requestCode() }}>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">شماره موبایل</Label>
                                    <Input
                                        id="phone"
                                        dir="ltr"
                                        inputMode="numeric"
                                        autoComplete="tel"
                                        placeholder="09120000000"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(toLatinDigits(e.target.value.trim()))}
                                        autoFocus
                                    />
                                </div>
                                <Button type="submit" disabled={pending}>
                                    {pending && <Spinner />}
                                    ارسال کد
                                </Button>
                            </form>
                        )
                        : (
                            <div className="grid gap-4">
                                <div dir="ltr" className="flex justify-center">
                                    <InputOTP
                                        maxLength={6}
                                        value={code}
                                        onChange={v => setCode(toLatinDigits(v))}
                                        onComplete={verifyCode}
                                        disabled={pending}
                                        autoFocus
                                    >
                                        <InputOTPGroup>
                                            {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} />)}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                                {pending && <Spinner className="mx-auto" />}
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <button type="button" className="underline" onClick={() => setStep("phone")}>
                                        تغییر شماره
                                    </button>
                                    {secondsLeft > 0
                                        ? <span>ارسال مجدد تا {secondsLeft} ثانیه</span>
                                        : <button type="button" className="underline" onClick={requestCode} disabled={pending}>ارسال مجدد کد</button>}
                                </div>
                            </div>
                        )}
                </CardContent>
            </Card>
        </main>
    )
}
