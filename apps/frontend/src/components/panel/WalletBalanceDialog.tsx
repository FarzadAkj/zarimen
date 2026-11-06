"use client"
import type { ShopModel } from "@/api/Api"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Pencil } from "lucide-react"
import { setWalletBalance } from "@/app/panel/(admin)/shops/actions"
import { Button } from "@/components/shad/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shad/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/shad/form"
import { Input } from "@/components/shad/input"
import { Spinner } from "@/components/shad/spinner"
import { formatAmount, toLatinDigits } from "@/lib/format"

const schema = z.object({
    balance: z.string().regex(/^\d{1,18}$/, "مبلغ را به تومان و بدون اعشار وارد کنید."),
})

type FormValues = z.infer<typeof schema>

/** Admin sets a shop's wallet balance to a new amount. */
export function WalletBalanceDialog({ shop }: { shop: ShopModel }) {
    const [open, setOpen] = useState(false)
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { balance: shop.walletBalance },
    })
    const typed = form.watch("balance")

    async function onSubmit({ balance }: FormValues) {
        const { data, error } = await setWalletBalance(shop.id, balance)
        if (!data) {
            toast.error(error?.translation)
            return
        }
        toast.success(`موجودی «${shop.name}»: ${formatAmount(data.walletBalance)}`)
        setOpen(false)
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (next) form.reset({ balance: shop.walletBalance })
                setOpen(next)
            }}
        >
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" aria-label="تغییر موجودی کیف پول">
                    <Pencil className="size-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>تغییر موجودی کیف پول</DialogTitle>
                    <DialogDescription>
                        {shop.name} — موجودی فعلی: <strong className="text-foreground">{formatAmount(shop.walletBalance)}</strong>
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
                        <FormField
                            control={form.control}
                            name="balance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>موجودی جدید (تومان)</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            dir="ltr"
                                            inputMode="numeric"
                                            autoFocus
                                            onChange={e => field.onChange(toLatinDigits(e.target.value.trim()))}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        موجودی کیف پول با این مقدار جایگزین می‌شود.
                                        {schema.safeParse({ balance: typed }).success && <> ({formatAmount(typed)})</>}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Spinner />}
                            ذخیره موجودی
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
