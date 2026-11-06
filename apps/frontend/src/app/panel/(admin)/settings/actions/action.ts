/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { CreateSubscriptionPlanInput, ServiceCostSettingsModel, SubscriptionPlanModel } from "@/api/Api"
import { revalidatePath } from "next/cache"
import { toErrorOutput } from "@/lib/errors"
import { takeApi } from "@/lib/take-api"

export async function readServiceCostSettings(): Promise<ServerResponse<ServiceCostSettingsModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.setting.readServiceCostSettings()
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function updateServiceCostSettings(input: ServiceCostSettingsModel): Promise<ServerResponse<ServiceCostSettingsModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.setting.setServiceCostSettings(input)
        revalidatePath("/panel/settings")
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function readSubscriptionPlans(): Promise<ServerResponse<SubscriptionPlanModel[]>> {
    const api = await takeApi()
    try {
        const { data } = await api.setting.readSubscriptionPlans()
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function createSubscriptionPlan(input: CreateSubscriptionPlanInput): Promise<ServerResponse<SubscriptionPlanModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.setting.createSubscriptionPlan(input)
        revalidatePath("/panel/settings")
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}

export async function setSubscriptionPlanActive(id: string, isActive: boolean): Promise<ServerResponse<SubscriptionPlanModel>> {
    const api = await takeApi()
    try {
        const { data } = await api.setting.setSubscriptionPlanActive({ id, isActive })
        revalidatePath("/panel/settings")
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}
