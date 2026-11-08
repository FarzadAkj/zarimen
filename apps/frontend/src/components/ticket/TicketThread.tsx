import type { TicketModel } from "@/api/Api"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"

/**
 * A ticket's messages, oldest first. The viewer's own messages sit on the start side
 * (right, RTL), the other side's on the end side.
 */
export function TicketThread({ ticket, viewer }: { ticket: TicketModel, viewer: "owner" | "admin" }) {
    return (
        <ol className="grid gap-4">
            {ticket.messages.map((message) => {
                const mine = message.fromAdmin === (viewer === "admin")
                const author = message.fromAdmin
                    ? (viewer === "admin" ? "شما (پشتیبانی)" : "پشتیبانی زر ایمن")
                    : (viewer === "owner" ? "شما" : ticket.shopName)
                return (
                    <li key={message.id} className={cn("grid gap-2 max-w-[85%] rounded-2xl border p-4", mine ? "justify-self-start bg-background" : "justify-self-end bg-primary/10 border-primary/20")}>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{author}</span>
                            <span>{formatDateTime(message.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words leading-7">{message.body}</p>
                        {message.imageUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {message.imageUrls.map(url => (
                                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block size-28 overflow-hidden rounded-lg border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="پیوست" className="size-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </li>
                )
            })}
        </ol>
    )
}
