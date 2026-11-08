"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { ImagePlus, X } from "lucide-react"
import { isValidNationalCode, isValidPhoneNumber, isValidSubdomain, RESERVED_SUBDOMAINS } from "@zar-imen/shared"
import { createImageUpload, createShop } from "@/app/panel/(admin)/shops/actions"
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

/** Fields whose value is a number typed by hand: Persian digits are converted as the admin types. */
const NUMERIC_FIELDS = new Set<keyof FormValues>(["landline", "ownerPhoneNumber", "ownerNationalCode", "initialWalletBalance"])

const FIELDS: { name: keyof FormValues, label: string, placeholder?: string, description?: string, ltr?: boolean }[] = [
    { name: "name", label: "نام فروشگاه" },
    { name: "brandName", label: "نام برند" },
    { name: "subdomain", label: "زیردامنه", placeholder: "setoode", ltr: true },
    { name: "landline", label: "تلفن ثابت (اختیاری)", placeholder: "02112345678", ltr: true },
    { name: "address", label: "آدرس (اختیاری)" },
    { name: "ownerFullName", label: "نام و نام خانوادگی مالک" },
    { name: "ownerPhoneNumber", label: "موبایل مالک", placeholder: "09120000000", ltr: true },
    { name: "ownerNationalCode", label: "کد ملی مالک", ltr: true, description: "موبایل و کد ملی مالک با سامانه شاهکار تطبیق داده می‌شود." },
    { name: "initialWalletBalance", label: "موجودی اولیه کیف پول به تومان (اختیاری)", placeholder: "0", ltr: true },
]

export function CreateShopForm({ rootDomain }: { rootDomain: string }) {
    const router = useRouter()
    const [logoUrl, setLogoUrl] = useState<string>()
    const [uploading, setUploading] = useState(false)

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
        const result = await uploadImage(file, createImageUpload)
        setUploading(false)
        if (result.error)
            toast.error(result.error)
        else
            setLogoUrl(result.url)
    }

    async function onSubmit(values: FormValues) {
        const { data, error } = await createShop({
            name: values.name,
            brandName: values.brandName,
            subdomain: values.subdomain,
            ownerFullName: values.ownerFullName,
            ownerPhoneNumber: values.ownerPhoneNumber,
            ownerNationalCode: values.ownerNationalCode,
            logoUrl,
            address: values.address || undefined,
            landline: values.landline || undefined,
            initialWalletBalance: values.initialWalletBalance || undefined,
        })
        if (!data) {
            if (error?.message === "SubdomainTaken")
                form.setError("subdomain", { message: error.translation })
            else
                toast.error(error?.translation)
            return
        }
        toast.success(`فروشگاه «${data.name}» ثبت شد.`)
        router.push("/panel")
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
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
                    {FIELDS.map(field => (
                        <FormField
                            key={field.name}
                            control={form.control}
                            name={field.name}
                            render={({ field: input }) => (
                                <FormItem className={field.name === "address" ? "sm:col-span-2" : undefined}>
                                    <FormLabel>{field.label}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...input}
                                            dir={field.ltr ? "ltr" : undefined}
                                            placeholder={field.placeholder}
                                            inputMode={NUMERIC_FIELDS.has(field.name) ? "numeric" : undefined}
                                            onChange={e => input.onChange(NUMERIC_FIELDS.has(field.name) ? toLatinDigits(e.target.value) : e.target.value)}
                                        />
                                    </FormControl>
                                    {field.name === "subdomain" && (
                                        <FormDescription dir="ltr" className="text-end">
                                            {(subdomain || "setoode").toLowerCase()}.{rootDomain}
                                        </FormDescription>
                                    )}
                                    {field.description && <FormDescription>{field.description}</FormDescription>}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </div>

                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => router.push("/panel")}>انصراف</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
                        {form.formState.isSubmitting && <Spinner />}
                        ثبت فروشگاه
                    </Button>
                </div>
            </form>
        </Form>
    )
}
