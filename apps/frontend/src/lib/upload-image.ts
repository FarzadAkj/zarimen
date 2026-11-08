import type { ServerResponse } from "@/app/types"
import type { CreateImageUploadInput, CreateImageUploadOutput } from "@/api/Api"
import { ImageContentType } from "@/api/Api"

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const CONTENT_TYPES: string[] = Object.values(ImageContentType)

/** Server action that signs one upload: the admin's createImageUpload or the owner's createMyImageUpload. */
export type SignImageUpload = (input: CreateImageUploadInput) => Promise<ServerResponse<CreateImageUploadOutput>>

export type UploadImageResult = { url: string, error?: undefined } | { url?: undefined, error: string }

/**
 * Uploads one image from the browser straight to the ArvanCloud bucket (zar-imen/ folder):
 * the backend only signs the upload, the file itself never goes through it.
 * Returns the image's public URL, or a Persian message to show the user.
 */
export async function uploadImage(file: File, sign: SignImageUpload): Promise<UploadImageResult> {
    if (!CONTENT_TYPES.includes(file.type))
        return { error: "تصویر باید با فرمت JPG، PNG یا webp باشد." }
    if (file.size > MAX_IMAGE_BYTES)
        return { error: "حجم تصویر حداکثر می‌تواند ۵ مگابایت باشد." }

    const { data, error } = await sign({
        contentType: file.type as ImageContentType,
        size: file.size,
    })
    if (!data)
        return { error: error?.translation ?? "آپلود تصویر ناموفق بود." }

    const response = await fetch(data.uploadUrl, { method: "PUT", headers: data.headers, body: file }).catch(() => null)
    if (!response?.ok)
        return { error: "آپلود تصویر در فضای ذخیره‌سازی ناموفق بود." }

    return { url: data.publicUrl }
}
