import { Input } from "@/components/shad/input"
import { toLatinDigits } from "@/lib/format"

/**
 * Mobile number with the "09" already in place: the customer types the other 9 digits.
 * `value` / `onChange` carry the full number ("09xxxxxxxxx").
 */
export function PhoneInput({ id, value, onChange, autoFocus }: { id?: string, value: string, onChange: (value: string) => void, autoFocus?: boolean }) {
    return (
        <div dir="ltr" className="flex items-stretch rounded-md border focus-within:ring-2 focus-within:ring-ring overflow-hidden">
            <span className="grid place-items-center px-3 bg-muted text-muted-foreground font-medium select-none">09</span>
            <Input
                id={id}
                className="border-0 rounded-none shadow-none focus-visible:ring-0 tracking-widest"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="123456789"
                maxLength={9}
                autoFocus={autoFocus}
                value={value.slice(2)}
                onChange={e => onChange(`09${toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 9)}`)}
            />
        </div>
    )
}
