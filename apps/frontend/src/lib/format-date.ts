const dateTimeFormat = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" })

/** ISO date → Jalali date and time, e.g. "۱۵ آبان ۱۴۰۵، ۱۸:۲۰" (fa-IR uses the Persian calendar). */
export function formatDateTime(value: string) {
    return dateTimeFormat.format(new Date(value))
}
