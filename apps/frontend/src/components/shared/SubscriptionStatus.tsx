import { Badge } from "@/components/shad/badge"
import { daysUntil, formatDate } from "@/lib/format-date"

/** A shop's subscription end date, Jalali, with how many days are left (or that it ended / never started). */
export function SubscriptionStatus({ endsAt }: { endsAt: string | null }) {
    if (!endsAt)
        return <Badge variant="secondary">ندارد</Badge>

    const left = daysUntil(endsAt)
    return (
        <span className="inline-flex items-center gap-2">
            {formatDate(endsAt)}
            {left > 0
                ? <span className="text-xs text-muted-foreground">({left.toLocaleString("fa-IR")} روز مانده)</span>
                : <Badge variant="destructive">منقضی</Badge>}
        </span>
    )
}
