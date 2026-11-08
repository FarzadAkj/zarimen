/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { ReadTobeShopsOutput, TobeShopModel, TobeShopStatus } from "@/api/Api"
import { revalidatePath } from "next/cache"
import { takeApi } from "@/lib/take-api"
import { toErrorOutput } from "@/lib/errors"

export async function readTobeShops(page: number, status?: TobeShopStatus): Promise<ServerResponse<ReadTobeShopsOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.tobeShop.readTobeShops({ page, status })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Shahkar + the shop checks: REGISTERED (shop created) or CANCELED (with `problem`). */
export async function checkAndInsertTobeShop(id: string, initialWalletBalance?: string): Promise<ServerResponse<TobeShopModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.tobeShop.checkAndInsertTobeShop({ id, initialWalletBalance })
        revalidatePath("/panel", "layout")
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function cancelTobeShop(id: string): Promise<ServerResponse<TobeShopModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.tobeShop.cancelTobeShop({ id })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** `value` fills the template's variable: INFO (canceled) or SUBDOMAIN (registered). */
export async function sendTobeShopSms(id: string, value: string): Promise<ServerResponse<TobeShopModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.tobeShop.sendTobeShopSms({ id, value })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}
