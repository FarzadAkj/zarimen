/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ServerResponse } from "@/app/types"
import type { CreateImageUploadInput, CreateImageUploadOutput, SubmitTobeShopInput, SubmitTobeShopOutput } from "@/api/Api"
import { toErrorOutput } from "@/lib/errors"
import { publicApi } from "@/lib/public-api"

/**
 * zarimen.ir/signup's calls, made from the visitor's browser (not through a server action),
 * so the backend's per-IP limits see the visitor's address instead of the frontend server's.
 */
const api = publicApi()

export async function submitTobeShop(input: SubmitTobeShopInput): Promise<ServerResponse<SubmitTobeShopOutput>> {
    try {
        const { data } = await api.tobeShop.submitTobeShop(input)
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function createTobeShopLogoUpload(input: CreateImageUploadInput): Promise<ServerResponse<CreateImageUploadOutput>> {
    try {
        const { data } = await api.tobeShop.createTobeShopLogoUpload(input)
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}
