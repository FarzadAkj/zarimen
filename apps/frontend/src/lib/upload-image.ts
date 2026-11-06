import { ImageContentType } from "@/api/Api"
import { createImageUpload } from "@/app/panel/(admin)/shops/actions"

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const CONTENT_TYPES: string[] = Object.values(ImageContentType)

export type UploadImageResult = { url: string, error?: undefined } | { url?: undefined, error: string }

/**
 * Uploads one image from the browser straight to the ArvanCloud bucket (zar-imen/ folder):
 * the backend only signs the upload, the file itself never goes through it.
 * Returns the image's public URL, or a Persian message to show the admin.
 */
export async function uploadImage(file: File): Promise<UploadImageResult> {
    if (!CONTENT_TYPES.includes(file.type))
        return { error: "تصویر باید با فرمت JPG، PNG یا webp باشد." }
    if (file.size > MAX_IMAGE_BYTES)
        return { error: "حجم تصویر حداکثر می‌تواند ۵ مگابایت باشد." }

    const { data, error } = await createImageUpload({
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
