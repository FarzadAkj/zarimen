"use client"
import { useState } from "react"
import { MessageSquareText, Megaphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { sendNotice } from "@/app/panel/(admin)/tickets/actions"
import { Button } from "@/components/shad/button"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { Switch } from "@/components/shad/switch"
import { Textarea } from "@/components/shad/textarea"
import { MAX_BODY, MAX_TITLE } from "./TicketComposer"
import { TicketImagesPicker } from "./TicketImagesPicker"

/**
 * An admins' notice: title, text and up to 2 photos go to every enabled shop as a CLOSED
 * ticket. With the SMS switch on, each owner gets the sms.ir notice template with the title.
 */
export function NoticeComposer() {
    const router = useRouter()
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [withSms, setWithSms] = useState(true)
    const [pending, setPending] = useState(false)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) return toast.error("موضوع اطلاعیه را بنویسید.")
        if (!body.trim()) return toast.error("متن اطلاعیه را بنویسید.")
        const confirmText = withSms
            ? "این اطلاعیه برای همه فروشگاه‌های فعال ثبت و پیامک آن برای مالکانشان ارسال می‌شود. ارسال شود؟"
            : "این اطلاعیه برای همه فروشگاه‌های فعال ثبت می‌شود (بدون پیامک). ارسال شود؟"
        if (!window.confirm(confirmText)) return

        setPending(true)
        const { data, error } = await sendNotice({
            title: title.trim(),
            body: body.trim(),
            imageUrls,
            sendSms: withSms,
        })
        setPending(false)
        if (!data) return toast.error(error?.translation)

        toast.success(`اطلاعیه برای ${data.shopCount.toLocaleString("fa-IR")} فروشگاه ارسال شد.`)
        router.push("/panel/tickets?view=notices")
    }

    return (
        <form onSubmit={submit} className="grid gap-4" noValidate>
            <div className="grid gap-2">
                <Label htmlFor="notice-title">موضوع</Label>
                <Input id="notice-title" value={title} maxLength={MAX_TITLE} onChange={e => setTitle(e.target.value)} placeholder="مثلاً: تعطیلی پشتیبانی در نوروز" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="notice-body">متن اطلاعیه</Label>
                <Textarea id="notice-body" value={body} maxLength={MAX_BODY} onChange={e => setBody(e.target.value)} className="min-h-32" />
            </div>

            <TicketImagesPicker side="admin" imageUrls={imageUrls} onChange={setImageUrls} onUploadingChange={setUploading} />

            <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm">
                    <MessageSquareText className="size-4 text-primary" />
                    <Label htmlFor="notice-with-sms" className="flex-1">پیامک به مالکان همه فروشگاه‌های فعال</Label>
                    <Switch id="notice-with-sms" checked={withSms} onCheckedChange={setWithSms} />
                </div>
                {withSms
                    ? (
                        <p className="text-sm text-muted-foreground">
                            پیامک اطلاع‌رسانی (قالب ثابت پیامکی) با موضوع
                            {" «"}
                            <span className="font-medium text-foreground">{title.trim() || "…"}</span>
                            {"» "}
                            برای مالک هر فروشگاه فعال ارسال می‌شود.
                        </p>
                    )
                    : <p className="text-sm text-muted-foreground">پیامکی ارسال نمی‌شود؛ اطلاعیه فقط در بخش پشتیبانی پنل فروشگاه‌ها دیده می‌شود.</p>}
            </div>

            <Button type="submit" className="justify-self-start" disabled={pending || uploading}>
                {pending ? <Spinner /> : <Megaphone />}
                ارسال اطلاعیه
            </Button>
        </form>
    )
}
