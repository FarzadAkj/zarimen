/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ErrorOutput } from "@/app/types"

const DEFAULT_ERROR_MESSAGE = "مشکلی پیش آمد. دوباره تلاش کنید."

/**
 * Backend errors come back as `{ statusCode, errorCode, module, message }`.
 * Messages are looked up by `Module.Code` first, then by the bare `Code`.
 */
const ERROR_MESSAGES: Record<string, string> = {
    // ---- generic
    UnknownServerError: "مشکلی در پردازش سرور به وجود آمده است.",
    Unauthorized: "برای ادامه باید وارد شوید.",
    Forbidden: "شما به این بخش دسترسی ندارید.",

    // ---- auth
    NotAdmin: "این شماره موبایل مدیر سامانه نیست.",
    OtpAlreadySent: "کد تأیید قبلاً ارسال شده است. لطفاً تا پایان اعتبار آن صبر کنید.",
    OtpIsNotValid: "کد تأیید وارد شده معتبر نیست.",
    SmsFailure: "ارسال پیامک با خطا روبرو شد. دوباره تلاش کنید.",
    ShopNotFound: "فروشگاهی با این آدرس وجود ندارد.",
    ShopDisabled: "پنل این فروشگاه غیرفعال شده است.",
    NotShopOwner: "این شماره موبایل مالک این فروشگاه نیست.",

    // ---- shop
    "ShopModule.NotFound": "فروشگاه یافت نشد.",
    SubdomainTaken: "این زیردامنه قبلاً برای فروشگاه دیگری ثبت شده است.",
    PhoneNationalCodeMismatch: "شماره موبایل مالک به نام صاحب این کد ملی نیست.",
    IdentityServiceUnavailable: "سرویس احراز هویت (شاهکار) در دسترس نیست. لطفاً بعداً تلاش کنید.",

    // ---- customer verification
    "CustomerModule.ShopNotFound": "فروشگاهی با این آدرس وجود ندارد.",
    "CustomerModule.ShopDisabled": "خدمات زر ایمن برای این فروشگاه غیرفعال است.",
    "CustomerModule.PhoneNationalCodeMismatch": "این شماره موبایل به نام صاحب این کد ملی ثبت نشده است.",
    "CustomerModule.IdentityServiceUnavailable": "سامانه استعلام هویت در دسترس نیست. چند دقیقه دیگر دوباره تلاش کنید.",
    CardNotOwned: "این کارت بانکی به نام صاحب این کد ملی و تاریخ تولد نیست.",
    BirthDateMismatch: "تاریخ تولد با اطلاعات ثبت‌شده برای این کد ملی مطابقت ندارد.",
    SignupExpired: "مهلت تکمیل ثبت‌نام تمام شده است. لطفاً دوباره اطلاعات خود را وارد کنید.",
    NotRegistered: "با این شماره موبایل ثبت‌نامی انجام نشده است. ابتدا ثبت‌نام کنید.",
    CardAlreadyAdded: "این کارت قبلاً ثبت شده است.",
    CustomerNotFound: "این مشتری در فهرست مشتریان فروشگاه شما نیست.",

    // ---- wallet
    InsufficientBalance: "اعتبار کیف پول فروشگاه برای انجام این درخواست کافی نیست. لطفاً به فروشنده اطلاع دهید.",

    GatewayError: "درگاه پرداخت درخواست را نپذیرفت. دوباره تلاش کنید.",
    GatewayUnavailable: "درگاه پرداخت در دسترس نیست. لطفاً بعداً تلاش کنید.",

    // ---- image upload
    UnsupportedImage: "تصویر باید با فرمت JPG، PNG یا webp باشد.",
    ImageTooLarge: "حجم تصویر حداکثر می‌تواند ۵ مگابایت باشد.",
    NotConfigured: "آپلود تصویر پیکربندی نشده است: کلیدهای ArvanCloud در تنظیمات سرور خالی هستند.",
}

export function translateError(error: any, fallback: string = DEFAULT_ERROR_MESSAGE): string {
    if (!error) return fallback
    if (typeof error === "string") return ERROR_MESSAGES[error] ?? fallback

    // ServerResponse.error shape produced by our actions
    if (error.translation) return error.translation

    const code: string | undefined = error.errorCode ?? error.message
    const mod: string | undefined = error.module
    if (code) {
        if (mod && ERROR_MESSAGES[`${mod}.${code}`]) return ERROR_MESSAGES[`${mod}.${code}`]
        if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
    }

    if (error.statusCode === 401) return ERROR_MESSAGES.Unauthorized
    if (error.statusCode === 403) return ERROR_MESSAGES.Forbidden

    return fallback
}

/** Converts whatever the API client threw into our `ErrorOutput`. */
export function toErrorOutput(error: any, fallback?: string): ErrorOutput {
    const raw = error?.error ?? error
    const code = raw?.errorCode ?? raw?.message ?? "UnknownServerError"
    return {
        message: typeof code === "string" ? code : "UnknownServerError",
        translation: translateError(raw, fallback),
    }
}
