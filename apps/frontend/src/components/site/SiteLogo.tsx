import { Gem } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * zarimen.ir's logo. Placeholder until the real logo is provided: put the file in
 * public/ (e.g. public/logo.svg) and render it here instead of the icon + text.
 */
export function SiteLogo({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-2 font-bold text-primary", className)}>
            <Gem className="size-7" strokeWidth={1.5} />
            <span className="text-xl">زر ایمن</span>
        </span>
    )
}
