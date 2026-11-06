/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { CustomerCardsModel, CustomerTokenModel, OtpSentModel, SignupStartedModel } from "@/api/Api"
import { currentSubdomain } from "@/lib/current-shop"
import { toErrorOutput } from "@/lib/errors"
import { CUSTOMER_TOKEN_COOKIE, clearToken, hasToken, saveToken } from "@/lib/session"
import { takeApi } from "@/lib/take-api"

export type SignupDetails = { ssn: string, phoneNumber: string, birthDate: string }

async function customerApi() {
    return takeApi(CUSTOMER_TOKEN_COOKIE)
}

async function openSession({ token, expiresInSeconds }: CustomerTokenModel) {
    await saveToken(token, CUSTOMER_TOKEN_COOKIE, expiresInSeconds)
}

/** Phase 1: Shahkar check + SMS code. The returned ticket goes back with the code. */
export async function startSignup(details: SignupDetails): Promise<ServerResponse<SignupStartedModel>> {
    const api = await customerApi()
    try {
        const { data } = await api.customer.startSignup({ subdomain: await currentSubdomain(), ...details })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Phase 2 (signup): the SMS code saves the customer and opens the session. */
export async function completeSignup(ticket: string, code: string): Promise<ServerResponse<true>> {
    const api = await customerApi()
    try {
        const { data } = await api.customer.completeSignup({ ticket, code })
        await openSession(data)
        return { data: true }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Returning customer, phase 1: SMS code to the registered phone. */
export async function startLogin(phoneNumber: string): Promise<ServerResponse<OtpSentModel>> {
    const api = await customerApi()
    try {
        const { data } = await api.customer.startLogin({ subdomain: await currentSubdomain(), phoneNumber })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Returning customer, phase 2: the SMS code opens the session. */
export async function completeLogin(phoneNumber: string, code: string): Promise<ServerResponse<true>> {
    const api = await customerApi()
    try {
        const { data } = await api.customer.completeLogin({ subdomain: await currentSubdomain(), phoneNumber, code })
        await openSession(data)
        return { data: true }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Phase 3: the customer's cards; an error when there is no (valid) session. */
export async function readMyCards(): Promise<ServerResponse<CustomerCardsModel>> {
    if (!await hasToken(CUSTOMER_TOKEN_COOKIE))
        return { error: { message: "Unauthorized", translation: "نشست شما به پایان رسیده است." } }
    const api = await customerApi()
    try {
        const { data } = await api.customer.readMyCards()
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Phase 3: CardMatch check, then the card joins the list. */
export async function addCard(cardNumber: string): Promise<ServerResponse<CustomerCardsModel>> {
    const api = await customerApi()
    try {
        const { data } = await api.customer.addCard({ cardNumber })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** "پایان": ends the customer's session so the next person on this device starts fresh. */
export async function endCustomerSession() {
    await clearToken(CUSTOMER_TOKEN_COOKIE)
}
