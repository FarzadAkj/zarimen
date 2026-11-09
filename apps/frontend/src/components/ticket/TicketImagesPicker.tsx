"use client"
import { useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import { createImageUpload } from "@/app/panel/(admin)/shops/actions"
import { createMyImageUpload } from "@/app/tenant/[subdomain]/panel/actions"
import { Spinner } from "@/components/shad/spinner"
import { uploadImage } from "@/lib/upload-image"

/** Same limit as the backend's ticket inputs. */
const MAX_IMAGES = 2

/** Up to 2 photos for a ticket message or a notice, uploaded with the admin's or the owner's signer. */
export function TicketImagesPicker({ side, imageUrls, onChange, onUploadingChange }: {
    side: "owner" | "admin"
    imageUrls: string[]
    onChange: (update: (urls: string[]) => string[]) => void
    /** The form keeps its submit button disabled while a photo uploads. */
    onUploadingChange: (uploading: boolean) => void
}) {
    const [uploading, setUploading] = useState(false)

    async function addImage(file: File | undefined) {
        if (!file) return
        setUploading(true)
        onUploadingChange(true)
        const { url, error } = await uploadImage(file, side === "admin" ? createImageUpload : createMyImageUpload)
        setUploading(false)
        onUploadingChange(false)
        if (url === undefined) toast.error(error)
        else onChange(urls => [...urls, url].slice(0, MAX_IMAGES))
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            {imageUrls.map(url => (
                <div key={url} className="relative size-20 overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="پیوست" className="size-full object-cover" />
                    <button
                        type="button"
                        aria-label="حذف تصویر"
                        onClick={() => onChange(urls => urls.filter(u => u !== url))}
                        className="absolute top-1 end-1 rounded-full bg-background/90 p-0.5 shadow"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            ))}
            {imageUrls.length < MAX_IMAGES && (
                <label className="size-20 rounded-lg border border-dashed grid place-items-center cursor-pointer bg-muted text-muted-foreground">
                    {uploading ? <Spinner /> : <ImagePlus className="size-6" />}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(e) => {
                            void addImage(e.target.files?.[0])
                            e.target.value = ""
                        }}
                    />
                </label>
            )}
            <span className="text-xs text-muted-foreground">حداکثر ۲ تصویر (JPG، PNG یا webp، تا ۵ مگابایت)</span>
        </div>
    )
}
