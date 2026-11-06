import { cn } from "@/lib/utils"

/** The shop's logo, or the first letter of its brand when it has none. */
export function ShopLogo({ logoUrl, brandName, className }: { logoUrl: string | null, brandName: string, className?: string }) {
    if (logoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={brandName} className={cn("rounded-2xl object-cover border bg-background", className)} />
        )
    }
    return (
        <div className={cn("rounded-2xl border bg-primary/10 text-primary grid place-items-center font-bold text-4xl", className)}>
            {brandName.trim().charAt(0)}
        </div>
    )
}
