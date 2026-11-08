"use client"
import { useState } from "react"
import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { closeMyTicket } from "@/app/tenant/[subdomain]/panel/actions"
import { Button } from "@/components/shad/button"
import { Spinner } from "@/components/shad/spinner"

/** Owner only. After closing, nobody can write in the ticket. */
export function CloseTicketButton({ ticketId }: { ticketId: string }) {
    const router = useRouter()
    const [pending, setPending] = useState(false)

    async function close() {
        if (!window.confirm("پس از بستن تیکت، دیگر امکان ارسال پیام در آن وجود ندارد. بسته شود؟")) return
        setPending(true)
        const { data, error } = await closeMyTicket(ticketId)
        setPending(false)
        if (!data) return toast.error(error?.translation)
        toast.success("تیکت بسته شد.")
        router.refresh()
    }

    return (
        <Button variant="outline" size="sm" onClick={close} disabled={pending}>
            {pending ? <Spinner /> : <Lock />}
            بستن تیکت
        </Button>
    )
}
