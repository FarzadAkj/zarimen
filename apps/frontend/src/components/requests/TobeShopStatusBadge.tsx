import type { TobeShopStatus } from "@/api/Api"
import { Badge } from "@/components/shad/badge"
import { cn } from "@/lib/utils"

const LOOK: Record<TobeShopStatus, { label: string, className: string }> = {
    PENDING: { label: "در انتظار بررسی", className: "bg-amber-100 text-amber-800" },
    REGISTERED: { label: "ثبت شده", className: "bg-green-100 text-green-800" },
    CANCELED: { label: "لغو شده", className: "bg-muted text-muted-foreground" },
}

export const TOBE_SHOP_STATUS_LABELS = Object.fromEntries(Object.entries(LOOK).map(([status, { label }]) => [status, label])) as Record<TobeShopStatus, string>

export function TobeShopStatusBadge({ status }: { status: TobeShopStatus }) {
    return <Badge variant="outline" className={cn("border-transparent", LOOK[status].className)}>{LOOK[status].label}</Badge>
}
