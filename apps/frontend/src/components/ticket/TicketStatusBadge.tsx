import type { TicketStatus } from "@/api/Api"
import { Badge } from "@/components/shad/badge"
import { cn } from "@/lib/utils"

const LOOK: Record<TicketStatus, { label: string, className: string }> = {
    PENDING: { label: "در انتظار پاسخ", className: "bg-amber-100 text-amber-800" },
    ANSWERED: { label: "پاسخ داده شده", className: "bg-green-100 text-green-800" },
    CLOSED: { label: "بسته شده", className: "bg-muted text-muted-foreground" },
}

export const TICKET_STATUS_LABELS = Object.fromEntries(Object.entries(LOOK).map(([status, { label }]) => [status, label])) as Record<TicketStatus, string>

/** A notice copy (CLOSED by design) shows «اطلاعیه» instead of its status. */
export function TicketStatusBadge({ status, isNotice = false }: { status: TicketStatus, isNotice?: boolean }) {
    if (isNotice)
        return <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">اطلاعیه</Badge>
    return <Badge variant="outline" className={cn("border-transparent", LOOK[status].className)}>{LOOK[status].label}</Badge>
}
