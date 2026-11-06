"use client"
import { useState } from "react"
import moment from "moment-jalaali"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { setShopSubscriptionEnd } from "@/app/panel/(admin)/shops/actions"
import { Button } from "@/components/shad/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shad/dialog"
import { Spinner } from "@/components/shad/spinner"
import { PersianCalendar } from "@/components/shared/PersianCalendar"
import { formatDate } from "@/lib/format-date"

/**
 * Admin moves a shop's subscription end to a later Jalali date (the end of that day, in the
 * browser's — Iran's — time). Earlier than the current end, or than today, is refused.
 */
export function SubscriptionEndDialog({ shopId, shopName, endsAt }: { shopId: string, shopName: string, endsAt: string | null }) {
    const [open, setOpen] = useState(false)
    const [jalali, setJalali] = useState("")
    const [pending, setPending] = useState(false)

    const current = endsAt ? new Date(endsAt) : null
    const earliest = current && current > new Date() ? current : new Date()

    async function save() {
        if (!jalali) {
            toast.error("تاریخ را انتخاب کنید.")
            return
        }
        const picked = moment(jalali, "jYYYY/jMM/jDD").endOf("day").toDate()
        if (picked <= earliest) {
            toast.error(`تاریخ باید بعد از ${formatDate(earliest.toISOString())} باشد.`)
            return
        }
        setPending(true)
        const { data, error } = await setShopSubscriptionEnd(shopId, picked.toISOString())
        setPending(false)
        if (!data) {
            toast.error(error?.translation)
            return
        }
        toast.success(`اشتراک «${shopName}» تا ${formatDate(data.endsAt!)} تمدید شد.`)
        setOpen(false)
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (next) setJalali("")
                setOpen(next)
            }}
        >
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" aria-label="تغییر تاریخ پایان اشتراک">
                    <Pencil className="size-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>تغییر تاریخ پایان اشتراک</DialogTitle>
                    <DialogDescription>
                        {shopName} — {current ? `پایان فعلی: ${formatDate(current.toISOString())}` : "اشتراکی ندارد"}.
                        {" "}تاریخ جدید باید بعد از {formatDate(earliest.toISOString())} باشد.
                    </DialogDescription>
                </DialogHeader>
                <PersianCalendar label="تاریخ پایان جدید" placeholder="انتخاب تاریخ" value={jalali} onChange={setJalali} />
                <Button onClick={save} disabled={pending}>
                    {pending && <Spinner />}
                    ذخیره
                </Button>
            </DialogContent>
        </Dialog>
    )
}
