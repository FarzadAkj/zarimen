"use client"
import type { SignImageUpload } from "@/lib/upload-image"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { ImagePlus, X } from "lucide-react"
import { isValidNationalCode, isValidPhoneNumber, isValidSubdomain, RESERVED_SUBDOMAINS } from "@zar-imen/shared"
import { Button } from "@/components/shad/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/shad/form"
import { Input } from "@/components/shad/input"
import { Spinner } from "@/components/shad/spinner"
import { toLatinDigits } from "@/lib/format"
import { uploadImage } from "@/lib/upload-image"

/** Optional text field: empty input means "not given". */
const optional = (schema: z.ZodString) => z.union([z.literal(""), schema])

const schema = z.object({
    name: z.string().trim().min(1, "نام فروشگاه را وارد کنید.").max(100),
    brandName: z.string().trim().min(1, "نام برند را وارد کنید.").max(100),
    subdomain: z.string().trim().toLowerCase().refine(isValidSubdomain, {
        message: `فقط حروف کوچک انگلیسی، عدد و خط تیره (۲ تا ۳۰ کاراکتر). نام‌های ${RESERVED_SUBDOMAINS.join("، ")} مجاز نیستند.`,
    }),
    address: z.string().trim().max(500),
    landline: optional(z.string().regex(/^0\d{10}$/, "تلفن ثابت ۱۱ رقم و با ۰ شروع می‌شود، مثل 02112345678.")),
    ownerFullName: z.string().trim().min(1, "نام مالک را وارد کنید.").max(100),
    ownerPhoneNumber: z.string().refine(isValidPhoneNumber, { message: "شماره موبایل را با فرمت ۰۹xxxxxxxxx وارد کنید." }),
    ownerNationalCode: z.string().refine(isValidNationalCode, { message: "کد ملی معتبر نیست." }),
    initialWalletBalance: optional(z.string().regex(/^\d{1,18}$/, "مبلغ را به تومان و بدون اعشار وارد کنید.")),
})

type FormValues = z.infer<typeof schema>
export type ShopFormField = keyof FormValues

/** What the form hands to `onSubmit`: optional fields left empty are undefined. */
export type ShopFormValues = {
    name: string
    brandName: string
    subdomain: string
    ownerFullName: string
    ownerPhoneNumber: string
    ownerNationalCode: string
    logoUrl?: string
    address?: string
    landline?: string
    initialWalletBalance?: string
}

/** Messages for values an existing shop already has (same for the admin and the public form). */
export const TAKEN_MESSAGES = {
    subdomain: "این زیردامنه قبلاً برای فروشگاه دیگری ثبت شده است.",
    ownerNationalCode: "این کد ملی قبلاً برای فروشگاه دیگری ثبت شده است.",
    ownerPhoneNumber: "این شماره موبایل قبلاً برای فروشگاه دیگری ثبت شده است.",
} satisfies Partial<Record<ShopFormField, string>>

/** Fields whose value is a number typed by hand: Persian digits are converted while typing. */
const NUMERIC_FIELDS = new Set<ShopFormField>(["landline", "ownerPhoneNumber", "ownerNationalCode", "initialWalletBalance"])

const FIELDS: { name: ShopFormField, label: string, required?: boolean, placeholder?: string, description?: string, ltr?: boolean }[] = [
    { name: "name", label: "نام فروشگاه", required: true },
    { name: "brandName", label: "نام برند", required: true },
    { name: "subdomain", label: "زیردامنه", required: true, placeholder: "darik", ltr: true },
    { name: "landline", label: "تلفن ثابت (اختیاری)", placeholder: "02112345678", ltr: true },
    { name: "address", label: "آدرس (اختیاری)" },
    { name: "ownerFullName", label: "نام و نام خانوادگی مالک", required: true },
    { name: "ownerPhoneNumber", label: "موبایل مالک", required: true, placeholder: "09120000000", ltr: true },
    {
        name: "ownerNationalCode",
        label: "کد ملی مالک",
        required: true,
        ltr: true,
        description: "موبایل و کد ملی باید هر دو به نام مالک فروشگاه باشند؛ این دو با سامانه شاهکار تطبیق داده می‌شوند.",
    },
    { name: "initialWalletBalance", label: "موجودی اولیه کیف پول به تومان (اختیاری)", placeholder: "0", ltr: true },
]

/**
 * The shop form, shared by the admin's "new shop" page and the public request page
 * (zarimen.ir/signup), so a change here shows up in both.
 * `onSubmit` returns messages for fields the server refused (e.g. a taken subdomain), or nothing.
 */
export function ShopForm({ rootDomain, withWalletBalance, signLogoUpload, submitLabel, onSubmit, onCancel }: {
    rootDomain: string
    /** Admin only: the new shop's starting wallet balance. */
    withWalletBalance?: boolean
    signLogoUpload: SignImageUpload
    submitLabel: string
    onSubmit: (values: ShopFormValues) => Promise<Partial<Record<ShopFormField, string>> | void>
    onCancel?: () => void
}) {
    const [logoUrl, setLogoUrl] = useState<string>()
    const [uploading, setUploading] = useState(false)
    const fields = FIELDS.filter(field => withWalletBalance || field.name !== "initialWalletBalance")

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            brandName: "",
            subdomain: "",
            address: "",
            landline: "",
            ownerFullName: "",
            ownerPhoneNumber: "",
            ownerNationalCode: "",
            initialWalletBalance: "",
        },
    })
    const subdomain = form.watch("subdomain")

    async function onLogoSelected(file: File | undefined) {
        if (!file) return
        setUploading(true)
        const result = await uploadImage(file, signLogoUpload)
        setUploading(false)
        if (result.error)
            toast.error(result.error)
        else
            setLogoUrl(result.url)
    }

    async function submit(values: FormValues) {
        const fieldErrors = await onSubmit({
            name: values.name,
            brandName: values.brandName,
            subdomain: values.subdomain,
            ownerFullName: values.ownerFullName,
            ownerPhoneNumber: values.ownerPhoneNumber,
            ownerNationalCode: values.ownerNationalCode,
            logoUrl,
            address: values.address || undefined,
            landline: values.landline || undefined,
            initialWalletBalance: (withWalletBalance && values.initialWalletBalance) || undefined,
        })
        for (const [name, message] of Object.entries(fieldErrors ?? {}))
            form.setError(name as ShopFormField, { message }, { shouldFocus: true })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="grid gap-6" noValidate>
                <div className="flex items-center gap-4">
                    <label className="relative size-20 rounded-lg border border-dashed grid place-items-center cursor-pointer overflow-hidden bg-muted">
                        {logoUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={logoUrl} alt="لوگو" className="size-full object-cover" />
                            : uploading ? <Spinner /> : <ImagePlus className="size-6 text-muted-foreground" />}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            disabled={uploading}
                            onChange={e => onLogoSelected(e.target.files?.[0])}
                        />
                    </label>
                    <div className="text-sm">
                        <div className="font-medium">لوگوی فروشگاه (اختیاری)</div>
                        <div className="text-muted-foreground">JPG، PNG یا webp، حداکثر ۵ مگابایت</div>
                        {logoUrl && (
                            <Button type="button" variant="ghost" size="sm" className="px-0" onClick={() => setLogoUrl(undefined)}>
                                <X />
                                حذف لوگو
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map(field => (
                        <FormField
                            key={field.name}
                            control={form.control}
                            name={field.name}
                            render={({ field: input }) => (
                                <FormItem className={field.name === "address" ? "sm:col-span-2" : undefined}>
                                    <FormLabel>
                                        {field.label}
                                        {field.required && <span className="text-destructive" aria-hidden>*</span>}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...input}
                                            required={field.required}
                                            dir={field.ltr ? "ltr" : undefined}
                                            placeholder={field.placeholder}
                                            inputMode={NUMERIC_FIELDS.has(field.name) ? "numeric" : undefined}
                                            onChange={e => input.onChange(NUMERIC_FIELDS.has(field.name) ? toLatinDigits(e.target.value) : e.target.value)}
                                        />
                                    </FormControl>
                                    {field.name === "subdomain" && (
                                        <FormDescription dir="ltr" className="text-end">
                                            {(subdomain || "darik").toLowerCase()}.{rootDomain}
                                        </FormDescription>
                                    )}
                                    {field.description && <FormDescription>{field.description}</FormDescription>}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </div>

                <p className="text-xs text-muted-foreground">
                    <span className="text-destructive">*</span> پر کردن این موارد الزامی است.
                </p>

                <div className="flex gap-2 justify-end">
                    {onCancel && <Button type="button" variant="outline" onClick={onCancel}>انصراف</Button>}
                    <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
                        {form.formState.isSubmitting && <Spinner />}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
