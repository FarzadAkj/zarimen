/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { CreateImageUploadInput, CreateImageUploadOutput, CreateShopInput, ShopModel } from "@/api/Api"
import { revalidatePath } from "next/cache"
import { takeApi } from "@/lib/take-api"
import { toErrorOutput } from "@/lib/errors"

export async function readShops(): Promise<ServerResponse<ShopModel[]>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.readShops()
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function createShop(input: CreateShopInput): Promise<ServerResponse<ShopModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.createShop(input)
        revalidatePath("/panel")
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function setShopActive(id: string, isActive: boolean): Promise<ServerResponse<ShopModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.setShopActive({ id, isActive })
        revalidatePath("/panel")
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Sets the shop's wallet balance to `balance` (absolute value). */
export async function setWalletBalance(shopId: string, balance: string): Promise<ServerResponse<ShopModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.setWalletBalance({ shopId, balance })
        revalidatePath("/panel")
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Asks the backend for a presigned URL to upload one image straight to the bucket. */
export async function createImageUpload(input: CreateImageUploadInput): Promise<ServerResponse<CreateImageUploadOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.imageUpload.createImageUpload(input)
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}
