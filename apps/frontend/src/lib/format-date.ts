const dateTimeFormat = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" })

/** ISO date → Jalali date and time, e.g. "۱۵ آبان ۱۴۰۵، ۱۸:۲۰" (fa-IR uses the Persian calendar). */
export function formatDateTime(value: string) {
    return dateTimeFormat.format(new Date(value))
}

const dateFormat = new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" })

/** ISO date → Jalali date, e.g. "۱۵ آبان ۱۴۰۵". */
export function formatDate(value: string) {
    return dateFormat.format(new Date(value))
}

/** Whole days from now until `value` (0 when it has passed). */
export function daysUntil(value: string) {
    return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
}
