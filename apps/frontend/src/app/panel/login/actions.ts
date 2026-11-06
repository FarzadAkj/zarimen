/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { MeModel, OtpSentModel } from "@/api/Api"
import { cache } from "react"
import { takeApi } from "@/lib/take-api"
import { toErrorOutput } from "@/lib/errors"
import { clearToken, hasToken, saveToken } from "@/lib/session"

/** Step 1 of admin login: send a code to the admin's phone. */
export async function sendAdminOtp(phoneNumber: string): Promise<ServerResponse<OtpSentModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.auth.sendAdminOtp({ phoneNumber })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Step 2 of admin login: exchange the code for a token, kept in an httpOnly cookie. */
export async function exchangeAdminOtp(phoneNumber: string, code: string): Promise<ServerResponse<true>> {
    const api = await takeApi()
    try {
        const { data } = await api.auth.exchangeAdminOtp({ phoneNumber, code })
        await saveToken(data.token)
        return { data: true }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function logout() {
    await clearToken()
}

export const me = cache(async (): Promise<ServerResponse<MeModel>> => {
    if (!await hasToken()) {
        return { error: { message: "Unauthorized", translation: "وارد نشده‌اید." } }
    }
    const api = await takeApi()
    try {
        const { data } = await api.auth.me()
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
})
