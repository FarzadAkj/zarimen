"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shad/dialog"
import { SIGNUP_TERMS } from "./signup-terms"

/** zarimen.ir/signup: the terms a shop owner accepts, opened from the checkbox's label. */
export function TermsModal({ children }: { children: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-center">قوانین و مقررات زر ایمن</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-2 text-sm leading-7">
                    {SIGNUP_TERMS.map((term, i) => (
                        <section key={term.title} className="grid gap-2">
                            <h3 className="text-base font-semibold">ماده {(i + 1).toLocaleString("fa-IR")} - {term.title}</h3>
                            <ul className="list-disc ps-5 text-justify text-muted-foreground">
                                {term.body.map(row => <li key={row}>{row}</li>)}
                            </ul>
                        </section>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
