import type { SubscriptionPlanModel } from "@/api/Api"
import { Badge } from "@/components/shad/badge"
import { formatAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * A plan's price. With the admin's discount on: the full price struck through, the percent, and
 * the discounted price (what the owner pays before VAT). `className` styles the price that is paid.
 */
export function PlanPrice({ plan, className, centered }: { plan: Pick<SubscriptionPlanModel, "price" | "finalPrice" | "discountPercent">, className?: string, centered?: boolean }) {
    // Also covers a backend older than the discount (no field): `next build` prerenders the landing
    // page against the live API, which may not be restarted yet.
    if (!plan.discountPercent || plan.discountPercent <= 0)
        return <p className={className}>{formatAmount(plan.price)}</p>

    return (
        <div className="grid gap-1">
            <div className={cn("flex flex-wrap items-center gap-2", centered && "justify-center")}>
                <del className="text-sm font-normal text-muted-foreground">{formatAmount(plan.price)}</del>
                <Badge variant="destructive">{plan.discountPercent.toLocaleString("fa-IR")}٪ تخفیف</Badge>
            </div>
            <p className={className}>{formatAmount(plan.finalPrice)}</p>
        </div>
    )
}
