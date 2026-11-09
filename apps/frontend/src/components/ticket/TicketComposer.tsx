"use client"
import type { ServerResponse } from "@/app/types"
import type { TicketModel } from "@/api/Api"
import { useState } from "react"
import { Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/shad/button"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { Textarea } from "@/components/shad/textarea"
import { TicketImagesPicker } from "./TicketImagesPicker"

/** Same limits as the backend's ticket inputs. */
export const MAX_TITLE = 150
export const MAX_BODY = 4000

type Message = { body: string, imageUrls: string[] }
type Send<T> = (message: T) => Promise<ServerResponse<TicketModel>>

type Props = { side: "owner" | "admin", submitLabel: string } & (
    | { withTitle: true, onSend: Send<Message & { title: string }> }
    | { withTitle?: false, onSend: Send<Message> }
)

/**
 * Text + up to 2 photos, for a new ticket (`withTitle`) or a reply.
 * `onSend` is a server action, bound to the ticket id for replies.
 * New ticket → opens it; reply → clears the form and reloads the thread.
 */
export function TicketComposer(props: Props) {
    const { side, withTitle, submitLabel } = props
    const router = useRouter()
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [pending, setPending] = useState(false)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (withTitle && !title.trim()) return toast.error("موضوع تیکت را بنویسید.")
        if (!body.trim()) return toast.error("متن پیام را بنویسید.")

        setPending(true)
        const message = { body: body.trim(), imageUrls }
        const { data, error } = props.withTitle ? await props.onSend({ ...message, title: title.trim() }) : await props.onSend(message)
        setPending(false)
        if (!data) return toast.error(error?.translation)

        toast.success("پیام ارسال شد.")
        if (withTitle) {
            router.push(`/panel/tickets/${data.id}`)
            return
        }
        setBody("")
        setImageUrls([])
        router.refresh()
    }

    return (
        <form onSubmit={submit} className="grid gap-4" noValidate>
            {withTitle && (
                <div className="grid gap-2">
                    <Label htmlFor="ticket-title">موضوع</Label>
                    <Input id="ticket-title" value={title} maxLength={MAX_TITLE} onChange={e => setTitle(e.target.value)} placeholder="مثلاً: مشکل در شارژ کیف پول" />
                </div>
            )}
            <div className="grid gap-2">
                <Label htmlFor="ticket-body">متن پیام</Label>
                <Textarea id="ticket-body" value={body} maxLength={MAX_BODY} onChange={e => setBody(e.target.value)} className="min-h-32" />
            </div>

            <TicketImagesPicker side={side} imageUrls={imageUrls} onChange={setImageUrls} onUploadingChange={setUploading} />

            <Button type="submit" className="justify-self-start" disabled={pending || uploading}>
                {pending ? <Spinner /> : <Send />}
                {submitLabel}
            </Button>
        </form>
    )
}
