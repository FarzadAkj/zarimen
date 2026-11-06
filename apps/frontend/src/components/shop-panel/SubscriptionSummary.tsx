import type { MySubscriptionModel } from "@/api/Api"
import { AlertTriangle, CalendarCheck } from "lucide-react"
import { daysUntil, formatDate } from "@/lib/format-date"

/** The owner's current plan and due date (Jalali), or a warning that customers are blocked. */
export function SubscriptionSummary({ subscription }: { subscription: MySubscriptionModel }) {
    if (!subscription.isActive || !subscription.endsAt) {
        return (
            <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                <AlertTriangle className="size-6 shrink-0" />
                <div className="grid gap-1">
                    <p className="font-bold">اشتراک فعالی ندارید.</p>
                    <p className="text-sm">
                        {subscription.endsAt ? `اشتراک شما در ${formatDate(subscription.endsAt)} به پایان رسید. ` : ""}
                        تا خرید اشتراک، مشتریان نمی‌توانند در صفحه فروشگاه احراز هویت کنند.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex gap-3 items-start">
            <CalendarCheck className="size-6 shrink-0 text-primary" />
            <div className="grid gap-1">
                <p className="font-bold">{subscription.currentPlanTitle ?? "اشتراک فعال"}</p>
                <p className="text-sm">
                    اعتبار تا <span className="font-medium">{formatDate(subscription.endsAt)}</span>
                    {" "}({daysUntil(subscription.endsAt).toLocaleString("fa-IR")} روز مانده)
                </p>
            </div>
        </div>
    )
}
