"use client"
import type { CustomerCardsModel } from "@/api/Api"
import type { SignupDetails } from "@/app/tenant/[subdomain]/verify/actions"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addCard, completeLogin, completeSignup, endCustomerSession, readMyCards, startLogin, startSignup } from "@/app/tenant/[subdomain]/verify/actions"
import { CardsStep } from "./CardsStep"
import { CodeStep } from "./CodeStep"
import { IdentityStep } from "./IdentityStep"
import { LoginStep } from "./LoginStep"
import { VerifySteps } from "./VerifySteps"

type Mode = "signup" | "login"

/**
 * The three phases of /verify:
 * 1. signup: national code + mobile + birth date (Shahkar) — or login: mobile only
 * 2. SMS code
 * 3. the customer's cards
 * `initialCards` is set when the customer still has a session, so they land on phase 3.
 */
export function VerifyFlow({ initialCards }: { initialCards: CustomerCardsModel | null }) {
    const router = useRouter()
    const [mode, setMode] = useState<Mode>("signup")
    const [phase, setPhase] = useState<1 | 2 | 3>(initialCards ? 3 : 1)
    const [pending, setPending] = useState(false)

    const [details, setDetails] = useState<SignupDetails>({ ssn: "", phoneNumber: "", birthDate: "" })
    const [ticket, setTicket] = useState("")
    const [expiresInSeconds, setExpiresInSeconds] = useState(0)
    /** Bumped on every code sent, so CodeStep remounts and its countdown restarts. */
    const [sendCount, setSendCount] = useState(0)
    const [cards, setCards] = useState(initialCards)

    /** Runs a server action with the spinner on; shows its error and returns null on failure. */
    async function run<T>(action: () => Promise<{ data?: T, error?: { message: string, translation: string } }>) {
        setPending(true)
        const { data, error } = await action()
        setPending(false)
        if (data === undefined) {
            toast.error(error?.translation)
            // the 30-minute customer session ran out: start over
            if (error?.message === "Unauthorized") {
                setCards(null)
                setPhase(1)
            }
            return null
        }
        return data
    }

    async function sendCode(next: SignupDetails | string) {
        if (typeof next === "string") {
            setDetails(d => ({ ...d, phoneNumber: next }))
            const sent = await run(() => startLogin(next))
            if (!sent) return
            setExpiresInSeconds(sent.expiresInSeconds)
        }
        else {
            setDetails(next)
            const started = await run(() => startSignup(next))
            if (!started) return
            setTicket(started.ticket)
            setExpiresInSeconds(started.expiresInSeconds)
        }
        setSendCount(n => n + 1)
        setPhase(2)
    }

    async function verifyCode(code: string) {
        const ok = await run(() => mode === "signup" ? completeSignup(ticket, code) : completeLogin(details.phoneNumber, code))
        if (!ok) return false
        const loaded = await run(readMyCards)
        if (!loaded) return false
        setCards(loaded)
        setPhase(3)
        toast.success(mode === "signup" ? "هویت شما تأیید و ثبت شد." : "خوش آمدید.")
        return true
    }

    async function add(cardNumber: string) {
        const updated = await run(() => addCard(cardNumber))
        if (!updated) return false
        setCards(updated)
        toast.success("کارت تأیید و ثبت شد.")
        return true
    }

    async function finish() {
        await endCustomerSession()
        router.push("/")
    }

    function switchMode(next: Mode) {
        setMode(next)
        setPhase(1)
    }

    const labels: [string, string, string] = [mode === "signup" ? "اطلاعات هویتی" : "شماره موبایل", "تأیید موبایل", "کارت‌های بانکی"]

    return (
        <div className="grid gap-6">
            <VerifySteps current={phase} labels={labels} />

            <div key={`${mode}-${phase}`} className="rounded-2xl border bg-background p-5 shadow-sm animate-in fade-in slide-in-from-left-8 duration-300">
                {phase === 1 && mode === "signup" && (
                    <IdentityStep initial={details} pending={pending} onSubmit={sendCode} />
                )}
                {phase === 1 && mode === "login" && (
                    <LoginStep initial={details.phoneNumber} pending={pending} onSubmit={sendCode} />
                )}
                {phase === 2 && (
                    <CodeStep
                        key={sendCount}
                        phoneNumber={details.phoneNumber}
                        expiresInSeconds={expiresInSeconds}
                        pending={pending}
                        onSubmit={verifyCode}
                        onResend={() => sendCode(mode === "signup" ? details : details.phoneNumber)}
                        onBack={() => setPhase(1)}
                    />
                )}
                {phase === 3 && cards && (
                    <CardsStep data={cards} pending={pending} onAdd={add} onFinish={finish} />
                )}
            </div>

            {phase === 1 && (
                <button
                    type="button"
                    onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
                    className="rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary hover:bg-primary/10"
                >
                    {mode === "signup" ? "قبلاً ثبت‌نام کرده‌اید؟ ورود با شماره موبایل" : "اولین بار است؟ ثبت‌نام و احراز هویت"}
                </button>
            )}
        </div>
    )
}
