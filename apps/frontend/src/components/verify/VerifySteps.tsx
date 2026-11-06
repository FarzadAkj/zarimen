import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * The step indicator on top of /verify: three steps joined by a track whose gold fill
 * slides to the current step, plus a line naming where the customer is.
 */
export function VerifySteps({ current, labels }: { current: 1 | 2 | 3, labels: [string, string, string] }) {
    return (
        <div className="grid gap-3">
            <div className="relative flex justify-between">
                {/* track behind the circles, from the first circle's centre to the last */}
                <div className="absolute top-5 inset-x-5 h-1 rounded-full bg-muted" />
                <div
                    className="absolute top-5 start-5 h-1 rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `calc((100% - 2.5rem) * ${(current - 1) / 2})` }}
                />
                {labels.map((label, i) => {
                    const step = i + 1
                    const done = step < current
                    const active = step === current
                    return (
                        <div key={label} className="relative z-10 grid justify-items-center gap-1.5 w-20">
                            <div
                                className={cn(
                                    "size-10 rounded-full grid place-items-center font-bold border-2 transition-all duration-300",
                                    done && "bg-primary border-primary text-primary-foreground",
                                    active && "bg-background border-primary text-primary scale-110 shadow-md shadow-primary/30",
                                    !done && !active && "bg-background border-muted text-muted-foreground",
                                )}
                            >
                                {done ? <Check className="size-5" /> : step.toLocaleString("fa-IR")}
                            </div>
                            <span className={cn("text-xs text-center", active ? "font-bold text-foreground" : "text-muted-foreground")}>
                                {label}
                            </span>
                        </div>
                    )
                })}
            </div>
            <div
                key={current}
                className="rounded-xl bg-primary/10 text-primary px-4 py-2 text-sm text-center animate-in fade-in slide-in-from-top-2 duration-300"
            >
                مرحله {current.toLocaleString("fa-IR")} از ۳ — {labels[current - 1]}
            </div>
        </div>
    )
}
