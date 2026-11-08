import Image from "next/image"
import { cn } from "@/lib/utils"

/** zarimen.ir's logo mark (public/images/logo.png). White background is blended away on light surfaces. */
export function LogoMark({ className, priority }: { className?: string, priority?: boolean }) {
    return (
        <Image
            src="/images/logo.png"
            alt="لوگوی زر ایمن"
            width={848}
            height={1264}
            priority={priority}
            className={cn("h-10 w-auto mix-blend-multiply", className)}
        />
    )
}

/** Logo mark + name, for headers and footers. */
export function SiteLogo({ className, markClassName }: { className?: string, markClassName?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-2 font-bold text-primary", className)}>
            <LogoMark className={markClassName} />
            <span className="text-xl">زر ایمن</span>
        </span>
    )
}
