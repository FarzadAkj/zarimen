"use client"
import type { TobeShopModel } from "@/api/Api"
import { useState } from "react"
import { MessageSquareText } from "lucide-react"
import { toast } from "sonner"
import { sendTobeShopSms } from "@/app/panel/(admin)/requests/actions"
import { Button } from "@/components/shad/button"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"

/** Prefilled INFO when the admin cancels a request without a failed check. */
const DEFAULT_REJECTION = "درخواست شما توسط پشتیبانی تأیید نشد"

/** The template a decided request's SMS uses, its variable and the suggested value. */
export function smsDraft(request: TobeShopModel) {
    return request.status === "REGISTERED"
        ? { template: "خوش‌آمد (ثبت فروشگاه)", variable: "SUBDOMAIN", value: request.subdomain }
        : { template: "رد درخواست", variable: "INFO", value: request.problem ?? DEFAULT_REJECTION }
}

/**
 * Shows which template goes to the owner's mobile and the value of its variable, which the
 * admin may edit. «ارسال نشود» skips the SMS (it can still be sent later from the list).
 */
export function TobeShopSmsForm({ request, onDone }: { request: TobeShopModel, onDone: () => void }) {
    const draft = smsDraft(request)
    const [value, setValue] = useState(draft.value)
    const [pending, setPending] = useState(false)

    async function send() {
        if (!value.trim()) return toast.error(`مقدار ${draft.variable} را وارد کنید.`)
        setPending(true)
        const { data, error } = await sendTobeShopSms(request.id, value)
        setPending(false)
        if (!data) return toast.error(error?.translation)
        toast.success("پیامک ارسال شد.")
        onDone()
    }

    return (
        <div className="grid gap-4 rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm">
                <MessageSquareText className="size-4 text-primary" />
                <span>پیامک با قالب «{draft.template}» به</span>
                <span dir="ltr" className="font-mono">{request.ownerPhoneNumber}</span>
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`sms-${request.id}`}>
                    متغیر قالب: <span dir="ltr" className="font-mono">{draft.variable}</span>
                </Label>
                <Input
                    id={`sms-${request.id}`}
                    value={value}
                    maxLength={300}
                    dir={draft.variable === "SUBDOMAIN" ? "ltr" : undefined}
                    onChange={e => setValue(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                <Button onClick={send} disabled={pending}>
                    {pending && <Spinner />}
                    ارسال پیامک
                </Button>
                <Button variant="outline" onClick={onDone} disabled={pending}>ارسال نشود</Button>
            </div>
        </div>
    )
}
