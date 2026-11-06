/** Persian (۰-۹) and Arabic (٠-٩) digits → Latin, so numbers typed on a Persian keyboard validate. */
export function toLatinDigits(value: string) {
    return value
        .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0))
        .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
}

const numberFormat = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 })

/** "1500000.50" → "۱٬۵۰۰٬۰۰۰٫۵" */
export function formatAmount(value: string) {
    return `${numberFormat.format(Number(value))} تومان`
}

/** "6037997599999993" → "6037 9975 9999 9993" (also for partly typed numbers). */
export function formatCardNumber(digits: string) {
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
}

/** "09175194864" → "0917***4864": the 5th to 7th digits hidden. */
export function maskPhoneNumber(phoneNumber: string) {
    return `${phoneNumber.slice(0, 4)}***${phoneNumber.slice(7)}`
}

/** Plan lengths offered as shortcuts on the admin's settings page; a month is 30 days. */
export const DURATION_PRESETS = [
    { days: 30, label: "۱ ماه" },
    { days: 60, label: "۲ ماه" },
    { days: 90, label: "۳ ماه" },
    { days: 180, label: "۶ ماه" },
    { days: 365, label: "۱ سال" },
]

/** 30 → "۱ ماه (۳۰ روز)", 45 → "۴۵ روز" */
export function formatDuration(days: number) {
    const preset = DURATION_PRESETS.find(p => p.days === days)
    return preset ? `${preset.label}` : `${days.toLocaleString("fa-IR")} روز`
}
