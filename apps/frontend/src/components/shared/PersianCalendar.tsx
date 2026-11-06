/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import DatePicker, { DateObject } from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import moment from "moment-jalaali"
import { Calendar as CalendarIcon, X as ClearIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../shad/form"
import { Label } from "../shad/label"

const DEFAULT_INPUT_CLASS =
    "w-full h-10 rounded-md border bg-background px-3 text-start outline-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

type Props = {
    /** react-hook-form control; when provided the field is rendered inside a FormField. */
    control?: any
    /** react-hook-form field name; required when `control` is provided. */
    name?: string
    /** Controlled value (used when no react-hook-form `control` is provided). */
    value?: string | Date | null
    /** Called with the emitted value in controlled mode. */
    onChange?: (value: string) => void
    label?: string
    description?: string
    className?: string
    labelClassName?: string
    inputClass?: string
    placeholder?: string
    returnISO?: boolean
    /** Emit the value as a Jalali string ("1377/02/20") instead of a `Date`. */
    returnJalali?: boolean
    id?: string
    /** Show a clear button to erase the selected value. */
    clearable?: boolean
}

function toDateObject(value: string | Date | null | undefined) {
    if (value instanceof Date && !isNaN(value.getTime())) {
        return new DateObject({
            date: value,
            calendar: persian,
            locale: persian_fa,
        })
    }
    if (typeof value === "string" && value) {
        const parsed = moment(value, "jYYYY/jM/jD", true)
        if (parsed.isValid()) {
            return new DateObject({
                date: parsed.toDate(),
                calendar: persian,
                locale: persian_fa,
            })
        }
    }
    return null
}

function DatePickerInput({
    id,
    value,
    onChange,
    placeholder,
    inputClass,
    returnISO = false,
    returnJalali = false,
    clearable = false,
}: {
    id?: string
    value?: string | Date | null
    onChange: (value: any) => void
    placeholder?: string
    inputClass?: string
    returnISO?: boolean
    returnJalali?: boolean
    clearable?: boolean
}) {
    const initial = toDateObject(value)
    const hasValue = Boolean(value)

    function handleChange(val: DateObject | null) {
        if (!val) {
            onChange(returnJalali ? "" : null)
            return
        }
        const jsDate = val.toDate() // خروجی Date
        if (returnJalali) {
            onChange(moment(jsDate).format("jYYYY/jMM/jDD"))
            return
        }
        onChange(returnISO ? jsDate.toISOString() : jsDate)
    }

    return (
        <div className="relative">
            <DatePicker
                id={id}
                value={initial as any}
                onChange={handleChange}
                calendar={persian}
                locale={persian_fa}
                calendarPosition="bottom-center"
                editable={false}
                inputMode="none"
                placeholder={placeholder}
                className="w-full"
                inputClass={cn(inputClass ?? DEFAULT_INPUT_CLASS, clearable && hasValue && "ps-9")}
                containerClassName="w-full"
            />

            <CalendarIcon className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />

            {clearable && hasValue && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleChange(null)
                    }}
                    aria-label="پاک کردن تاریخ"
                    className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                    <ClearIcon className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

export function PersianCalendar({
    control,
    name,
    value,
    onChange,
    label,
    description,
    className,
    labelClassName,
    inputClass,
    placeholder,
    returnISO = false,
    returnJalali = false,
    id,
    clearable = false,
}: Props) {
    if (control && name) {
        return (
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem dir="rtl" className={cn("space-y-2", className)}>
                        {label && <FormLabel className={labelClassName}>{label}</FormLabel>}
                        <FormControl>
                            <DatePickerInput
                                id={id}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder={placeholder}
                                inputClass={inputClass}
                                returnISO={returnISO}
                                returnJalali={returnJalali}
                                clearable={clearable}
                            />
                        </FormControl>
                        {description && <FormDescription>{description}</FormDescription>}
                        <FormMessage />
                    </FormItem>
                )}
            />
        )
    }

    return (
        <div dir="rtl" className={cn("space-y-2", className)}>
            {label && <Label className={labelClassName}>{label}</Label>}
            <DatePickerInput
                id={id}
                value={value}
                onChange={(v) => onChange?.(v)}
                placeholder={placeholder}
                inputClass={inputClass}
                returnJalali
                clearable={clearable}
            />
            {description && <p className="text-muted-foreground text-xs">{description}</p>}
        </div>
    )
}
