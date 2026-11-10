/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { CreateImageUploadInput, CreateImageUploadOutput, CreateShopInput, MySubscriptionModel, UpdateShopInput, ReadManualCardChecksOutput, ReadWalletTransactionsOutput, ShopCustomerCardModel, ShopCustomerModel, ShopModel } from "@/api/Api"
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

/** Edits a shop's details (not the owner's mobile / national code). Every page may show them. */
export async function updateShop(input: UpdateShopInput): Promise<ServerResponse<ShopModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.updateShop(input)
        revalidatePath("/", "layout")
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

// ---- one shop, as the admin sees it (zarimen.ir/panel/customers/<subdomain>)

export async function readShopBySubdomain(subdomain: string): Promise<ServerResponse<ShopModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.readShopBySubdomain({ subdomain })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readShopCustomers(shopId: string, search: string): Promise<ServerResponse<ShopCustomerModel[]>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.readShopCustomers({ shopId, search: search || undefined })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readShopCustomerCards(shopId: string, customerId: string): Promise<ServerResponse<ShopCustomerCardModel[]>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.readShopCustomerCards({ shopId, customerId })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readShopWalletTransactions(shopId: string, page: number): Promise<ServerResponse<ReadWalletTransactionsOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.readShopWalletTransactions({ shopId, page })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** A shop owner's «استعلام دستی» history, newest first. */
export async function readShopManualCardChecks(shopId: string, page: number): Promise<ServerResponse<ReadManualCardChecksOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.readShopManualCardChecks({ shopId, page })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

/** Moves the shop's subscription end to `endsAt` (ISO); the backend refuses anything not later than now. */
export async function setShopSubscriptionEnd(shopId: string, endsAt: string): Promise<ServerResponse<MySubscriptionModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.shop.setShopSubscriptionEnd({ shopId, endsAt })
        revalidatePath("/panel", "layout")
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}
