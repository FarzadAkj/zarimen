/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { OtpSentModel, ShopLoginInfoModel, ShopModel } from "@/api/Api"
import { cache } from "react"
import { headers } from "next/headers"
import { takeApi } from "@/lib/take-api"
import { toErrorOutput } from "@/lib/errors"
import { parseHost } from "@/lib/host"
import { clearToken, hasToken, saveToken } from "@/lib/session"

/**
 * The shop this request is for, from the Host header. Taken from the request rather
 * than from an argument, so a page can only ever act for the shop it is served on.
 */
async function currentSubdomain() {
    const target = parseHost((await headers()).get("host"), process.env.ROOT_DOMAIN!)
    if (target.kind !== "shop")
        throw new Error("Shop panel action called outside a shop subdomain")
    return target.subdomain
}

export const readShopLoginInfo = cache(async (): Promise<ServerResponse<ShopLoginInfoModel>> => {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readShopLoginInfo({ subdomain: await currentSubdomain() })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
})

/** Step 1 of shop login: send a code to the shop owner's phone. */
export async function sendShopOtp(phoneNumber: string): Promise<ServerResponse<OtpSentModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.auth.sendShopOtp({ subdomain: await currentSubdomain(), phoneNumber })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Step 2 of shop login: exchange the code for a token (cookie on this subdomain only). */
export async function exchangeShopOtp(phoneNumber: string, code: string): Promise<ServerResponse<true>> {
    const api = await takeApi()
    try {
        const { data } = await api.auth.exchangeShopOtp({ subdomain: await currentSubdomain(), phoneNumber, code })
        await saveToken(data.token)
        return { data: true }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** The logged-in owner's shop; an error when not logged in or the shop was disabled. */
export const readMyShop = cache(async (): Promise<ServerResponse<ShopModel>> => {
    if (!await hasToken()) {
        return { error: { message: "Unauthorized", translation: "وارد نشده‌اید." } }
    }
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readMyShop()
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
})

export async function logoutShop() {
    await clearToken()
}
