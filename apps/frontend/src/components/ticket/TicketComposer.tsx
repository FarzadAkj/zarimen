"use client"
import type { ServerResponse } from "@/app/types"
import type { TicketModel } from "@/api/Api"
import { useState } from "react"
import { ImagePlus, Send, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createImageUpload } from "@/app/panel/(admin)/shops/actions"
import { createMyImageUpload } from "@/app/tenant/[subdomain]/panel/actions"
import { Button } from "@/components/shad/button"
import { Input } from "@/components/shad/input"
import { Label } from "@/components/shad/label"
import { Spinner } from "@/components/shad/spinner"
import { Textarea } from "@/components/shad/textarea"
import { uploadImage } from "@/lib/upload-image"

/** Same limits as the backend's ticket inputs. */
const MAX_IMAGES = 2
const MAX_TITLE = 150
const MAX_BODY = 4000

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

    async function addImage(file: File | undefined) {
        if (!file) return
        setUploading(true)
        const result = await uploadImage(file, side === "admin" ? createImageUpload : createMyImageUpload)
        setUploading(false)
        const { url, error } = result
        if (url === undefined) toast.error(error)
        else setImageUrls(urls => [...urls, url].slice(0, MAX_IMAGES))
    }

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

            <div className="flex flex-wrap items-center gap-3">
                {imageUrls.map(url => (
                    <div key={url} className="relative size-20 overflow-hidden rounded-lg border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="پیوست" className="size-full object-cover" />
                        <button
                            type="button"
                            aria-label="حذف تصویر"
                            onClick={() => setImageUrls(urls => urls.filter(u => u !== url))}
                            className="absolute top-1 end-1 rounded-full bg-background/90 p-0.5 shadow"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                ))}
                {imageUrls.length < MAX_IMAGES && (
                    <label className="size-20 rounded-lg border border-dashed grid place-items-center cursor-pointer bg-muted text-muted-foreground">
                        {uploading ? <Spinner /> : <ImagePlus className="size-6" />}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            disabled={uploading}
                            onChange={(e) => {
                                void addImage(e.target.files?.[0])
                                e.target.value = ""
                            }}
                        />
                    </label>
                )}
                <span className="text-xs text-muted-foreground">حداکثر ۲ تصویر (JPG، PNG یا webp، تا ۵ مگابایت)</span>
            </div>

            <Button type="submit" className="justify-self-start" disabled={pending || uploading}>
                {pending ? <Spinner /> : <Send />}
                {submitLabel}
            </Button>
        </form>
    )
}
