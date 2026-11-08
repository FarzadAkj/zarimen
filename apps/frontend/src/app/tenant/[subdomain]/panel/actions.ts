/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { CreateImageUploadInput, CreateImageUploadOutput, CreateTicketInput, ReadTicketsOutput, ServiceCostSettingsModel, MySubscriptionModel, TicketModel, TicketStatus, OtpSentModel, ReadSubscriptionPurchasesOutput, ReadWalletTransactionsOutput, ShopCustomerCardModel, ShopCustomerModel, ShopModel, SubscriptionPlanModel, SubscriptionPurchaseStartedModel, WalletTopUpModel } from "@/api/Api"
import { cache } from "react"
import { takeApi } from "@/lib/take-api"
import { toErrorOutput } from "@/lib/errors"
import { currentSubdomain } from "@/lib/current-shop"
import { clearToken, hasToken, saveToken } from "@/lib/session"

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

/** Customers who verified at the logged-in owner's shop; `search` = digits of a national code / mobile. */
export async function readMyCustomers(search?: string): Promise<ServerResponse<ShopCustomerModel[]>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readMyCustomers({ search: search || undefined })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Full card numbers of one of the owner's customers (opened from the eye icon). */
export async function readMyCustomerCards(customerId: string): Promise<ServerResponse<ShopCustomerCardModel[]>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readMyCustomerCards({ customerId })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Starts a Zarinpal payment that adds `amount` Tomans to the wallet; returns the gateway url. */
export async function startWalletTopUp(amount: number): Promise<ServerResponse<WalletTopUpModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.startWalletTopUp({ amount })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readMyWalletTransactions(page: number): Promise<ServerResponse<ReadWalletTransactionsOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readMyWalletTransactions({ page })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readMySubscription(): Promise<ServerResponse<MySubscriptionModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readMySubscription()
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readAvailablePlans(): Promise<ServerResponse<SubscriptionPlanModel[]>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readAvailablePlans()
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readMySubscriptionPurchases(page: number): Promise<ServerResponse<ReadSubscriptionPurchasesOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readMySubscriptionPurchases({ page })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Starts the Zarinpal payment for a plan; returns the gateway url. */
export async function startSubscriptionPurchase(planId: string): Promise<ServerResponse<SubscriptionPurchaseStartedModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.startSubscriptionPurchase({ planId })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** What each Shahkar check / SMS costs the wallet (set by the admin). */
export async function readServiceCosts(): Promise<ServerResponse<ServiceCostSettingsModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readServiceCosts()
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

// ---- tickets (<subdomain>.zarimen.ir/panel/tickets)

/** Signs one photo upload for a ticket message (see lib/upload-image). */
export async function createMyImageUpload(input: CreateImageUploadInput): Promise<ServerResponse<CreateImageUploadOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.createMyImageUpload(input)
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readMyTickets(page: number, status?: TicketStatus): Promise<ServerResponse<ReadTicketsOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readMyTickets({ page, status })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readMyTicket(ticketId: string): Promise<ServerResponse<TicketModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readMyTicket({ ticketId })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Opens a ticket with its first message; the admins get an SMS. */
export async function createTicket(input: CreateTicketInput): Promise<ServerResponse<TicketModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.createTicket(input)
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Bound to a ticket id by the page: `sendMyTicketMessage.bind(null, id)`. */
export async function sendMyTicketMessage(ticketId: string, input: { body: string, imageUrls: string[] }): Promise<ServerResponse<TicketModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.sendMyTicketMessage({ ticketId, ...input })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function closeMyTicket(ticketId: string): Promise<ServerResponse<TicketModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.closeMyTicket({ ticketId })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function logoutShop() {
    await clearToken()
}
