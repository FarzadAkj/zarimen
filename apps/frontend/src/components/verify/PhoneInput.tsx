import { Input } from "@/components/shad/input"
import { toLatinDigits } from "@/lib/format"

/** Mobile number, typed in full by the customer ("09xxxxxxxxx"). Persian digits become Latin. */
export function PhoneInput({ id, value, onChange, autoFocus }: { id?: string, value: string, onChange: (value: string) => void, autoFocus?: boolean }) {
    return (
        <Input
            id={id}
            dir="ltr"
            className="tracking-widest"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="09120000000"
            maxLength={11}
            autoFocus={autoFocus}
            value={value}
            onChange={e => onChange(toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 11))}
        />
    )
}
