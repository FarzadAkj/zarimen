"use client"
import type { TobeShopModel } from "@/api/Api"
import { useState } from "react"
import { Ban, CircleAlert, CircleCheck, MessageSquareText, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cancelTobeShop, checkAndInsertTobeShop } from "@/app/panel/(admin)/requests/actions"
import { Button } from "@/components/shad/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shad/dialog"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { toLatinDigits } from "@/lib/format"
import { TobeShopSmsForm } from "./TobeShopSmsForm"

type Step = "check" | "cancel" | "sms"

/**
 * One request's buttons and their dialog:
 * - PENDING: «بررسی و ثبت» (wallet balance → Shahkar + shop checks → result + SMS) and «لغو درخواست».
 * - decided, no SMS yet: «ارسال پیامک».
 */
export function TobeShopActions({ request }: { request: TobeShopModel }) {
    const router = useRouter()
    const [step, setStep] = useState<Step | null>(null)
    /** The request after this dialog's action; its status picks the SMS template. */
    const [decided, setDecided] = useState<TobeShopModel | null>(null)
    const [balance, setBalance] = useState("")
    const [pending, setPending] = useState(false)

    function open(next: Step) {
        setDecided(next === "sms" ? request : null)
        setBalance("")
        setStep(next)
    }

    function close() {
        setStep(null)
        router.refresh()
    }

    async function checkAndInsert() {
        setPending(true)
        const { data, error } = await checkAndInsertTobeShop(request.id, balance || undefined)
        setPending(false)
        if (!data) return toast.error(error?.translation)
        setDecided(data)
    }

    async function cancel() {
        setPending(true)
        const { data, error } = await cancelTobeShop(request.id)
        setPending(false)
        if (!data) return toast.error(error?.translation)
        setDecided(data)
    }

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {request.status === "PENDING" && (
                    <>
                        <Button size="sm" onClick={() => open("check")}><ShieldCheck />بررسی و ثبت</Button>
                        <Button size="sm" variant="outline" onClick={() => open("cancel")}><Ban />لغو درخواست</Button>
                    </>
                )}
                {request.status !== "PENDING" && !request.smsSentAt && (
                    <Button size="sm" variant="outline" onClick={() => open("sms")}><MessageSquareText />ارسال پیامک</Button>
                )}
            </div>

            <Dialog open={step !== null} onOpenChange={next => !next && !pending && close()}>
                <DialogContent className="max-w-lg" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>
                            {step === "check" ? "بررسی و ثبت" : step === "cancel" ? "لغو درخواست" : "ارسال پیامک"}
                            {" — "}
                            {request.name}
                        </DialogTitle>
                        {!decided && (
                            <DialogDescription className="leading-6">
                                {step === "check"
                                    ? "تطبیق موبایل و کد ملی مالک با شاهکار و تکراری نبودن زیردامنه، کد ملی و موبایل بررسی می‌شود. اگر مشکلی نباشد فروشگاه ساخته می‌شود؛ در غیر این صورت درخواست لغو می‌شود."
                                    : "درخواست لغو می‌شود. سپس می‌توانید پیامک رد درخواست را بفرستید یا از ارسال آن صرف‌نظر کنید."}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {!decided && step === "check" && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`balance-${request.id}`}>موجودی اولیه کیف پول به تومان (اختیاری)</Label>
                                <Input
                                    id={`balance-${request.id}`}
                                    dir="ltr"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={balance}
                                    onChange={e => setBalance(toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 18))}
                                />
                            </div>
                            <Button onClick={checkAndInsert} disabled={pending}>
                                {pending ? <Spinner /> : <ShieldCheck />}
                                بررسی و ثبت
                            </Button>
                        </div>
                    )}

                    {!decided && step === "cancel" && (
                        <Button variant="destructive" onClick={cancel} disabled={pending}>
                            {pending && <Spinner />}
                            لغو درخواست
                        </Button>
                    )}

                    {decided && (
                        <div className="grid gap-4">
                            {step === "check" && (decided.status === "REGISTERED"
                                ? (
                                    <p className="flex items-center gap-2 text-green-700">
                                        <CircleCheck className="size-5 shrink-0" />
                                        فروشگاه ثبت شد:
                                        <span dir="ltr" className="font-mono">{decided.subdomain}</span>
                                    </p>
                                )
                                : (
                                    <p className="flex items-start gap-2 text-destructive">
                                        <CircleAlert className="size-5 shrink-0 mt-0.5" />
                                        <span>بررسی ناموفق بود و درخواست لغو شد: {decided.problem}</span>
                                    </p>
                                ))}
                            {step === "cancel" && <p className="text-muted-foreground">درخواست لغو شد.</p>}
                            <TobeShopSmsForm request={decided} onDone={close} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
