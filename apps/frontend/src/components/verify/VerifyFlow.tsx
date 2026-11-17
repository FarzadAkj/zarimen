"use client"
import type { CustomerCardsModel } from "@/api/Api"
import type { SignupDetails } from "@/app/tenant/[subdomain]/verify/actions"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addCard, completeLogin, completeSignup, endCustomerSession, readMyCards, requestCardApproval, requestSignupApproval, startLogin, startSignup } from "@/app/tenant/[subdomain]/verify/actions"
import { maskPhoneNumber } from "@/lib/format"
import { CardsStep } from "./CardsStep"
import { CodeStep, ownerCodeMessage } from "./CodeStep"
import { IdentityStep } from "./IdentityStep"
import { LoginStep } from "./LoginStep"
import { VerifySteps } from "./VerifySteps"

type Mode = "signup" | "login"

type Result<T> = { data?: T, error?: { message: string, translation: string } }

/** Wrong owner's code: the same code may be typed again. Any other error used it up (or never got to it). */
const keepsOwnerCode = (error?: { message: string }) => error?.message === "OtpIsNotValid"

/**
 * The three phases of /verify:
 * 1. signup: national code + mobile + birth date, then the code texted to the shop owner (Shahkar)
 *    — or login: mobile only
 * 2. SMS code
 * 3. the customer's cards (each new card needs another code from the owner, for CardMatch)
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
    /** Seconds the owner's signup code is valid for, while phase 1 waits for it; null otherwise. */
    const [ownerCodeSeconds, setOwnerCodeSeconds] = useState<number | null>(null)

    /** Runs a server action with the spinner on; shows its error. */
    async function runResult<T>(action: () => Promise<Result<T>>): Promise<Result<T>> {
        setPending(true)
        const result = await action()
        setPending(false)
        if (result.data === undefined) {
            toast.error(result.error?.translation)
            // the 30-minute customer session ran out: start over
            if (result.error?.message === "Unauthorized") {
                setCards(null)
                setPhase(1)
            }
        }
        return result
    }

    /** runResult, returning null on failure. */
    async function run<T>(action: () => Promise<Result<T>>) {
        return (await runResult(action)).data ?? null
    }

    async function sendCode(next: SignupDetails | string) {
        if (typeof next === "string") {
            setDetails(d => ({ ...d, phoneNumber: next }))
            const sent = await run(() => startLogin(next))
            if (!sent) return
            customerCodeSent(sent.expiresInSeconds)
            return
        }

        setDetails(next)
        const approval = await run(() => requestSignupApproval(next))
        if (!approval) return
        if (approval.approvalRequired) {
            setOwnerCodeSeconds(approval.expiresInSeconds)
            setSendCount(n => n + 1)
            setPhase(1)
        }
        else {
            await startSignupWith(next)
        }
    }

    /** Shahkar (when `ownerCode` is given) + the customer's SMS code; whether the owner's code may be retried. */
    async function startSignupWith(next: SignupDetails, ownerCode?: string) {
        const { data, error } = await runResult(() => startSignup(next, ownerCode))
        if (!data) {
            if (!keepsOwnerCode(error)) setOwnerCodeSeconds(null)
            return false
        }
        setOwnerCodeSeconds(null)
        setTicket(data.ticket)
        customerCodeSent(data.expiresInSeconds)
        return true
    }

    function customerCodeSent(seconds: number) {
        setExpiresInSeconds(seconds)
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

    /** Texts the owner the card's approval code; its lifetime in seconds, or null. */
    async function requestCardCode(cardNumber: string) {
        const approval = await run(() => requestCardApproval(cardNumber))
        return approval?.expiresInSeconds ?? null
    }

    async function add(cardNumber: string, ownerCode: string) {
        const { data, error } = await runResult(() => addCard(cardNumber, ownerCode))
        if (!data) return keepsOwnerCode(error) ? "retry" : "failed"
        setCards(data)
        toast.success("کارت تأیید و ثبت شد.")
        return "added"
    }

    async function finish() {
        await endCustomerSession()
        router.push("/")
    }

    function switchMode(next: Mode) {
        setMode(next)
        setOwnerCodeSeconds(null)
        setPhase(1)
    }

    const labels: [string, string, string] = [mode === "signup" ? "اطلاعات هویتی" : "شماره موبایل", "تأیید موبایل", "کارت‌های بانکی"]

    return (
        <div className="grid gap-6">
            <VerifySteps current={phase} labels={labels} />

            <div key={`${mode}-${phase}`} className="rounded-2xl border bg-background p-5 shadow-sm animate-in fade-in slide-in-from-left-8 duration-300">
                {phase === 1 && mode === "signup" && ownerCodeSeconds === null && (
                    <IdentityStep initial={details} pending={pending} onSubmit={sendCode} />
                )}
                {phase === 1 && mode === "signup" && ownerCodeSeconds !== null && (
                    <CodeStep
                        key={sendCount}
                        message={ownerCodeMessage}
                        expiresInSeconds={ownerCodeSeconds}
                        pending={pending}
                        onSubmit={code => startSignupWith(details, code)}
                        onResend={() => sendCode(details)}
                        onBack={() => setOwnerCodeSeconds(null)}
                    />
                )}
                {phase === 1 && mode === "login" && (
                    <LoginStep initial={details.phoneNumber} pending={pending} onSubmit={sendCode} />
                )}
                {phase === 2 && (
                    <CodeStep
                        key={sendCount}
                        message={<>کد ۶ رقمی به شماره <span dir="ltr" className="font-bold">{maskPhoneNumber(details.phoneNumber)}</span> ارسال شده است.</>}
                        expiresInSeconds={expiresInSeconds}
                        pending={pending}
                        onSubmit={verifyCode}
                        onResend={() => sendCode(mode === "signup" ? details : details.phoneNumber)}
                        onBack={() => setPhase(1)}
                    />
                )}
                {phase === 3 && cards && (
                    <CardsStep data={cards} pending={pending} onRequestCode={requestCardCode} onAdd={add} onFinish={finish} />
                )}
            </div>

            {phase === 1 && ownerCodeSeconds === null && (
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
