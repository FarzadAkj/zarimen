/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import type { ServerResponse } from "@/app/types"
import type { ReadPaymentsOutput } from "@/api/Api"
import { takeApi } from "@/lib/take-api"
import { toErrorOutput } from "@/lib/errors"

export async function readPayments(page: number): Promise<ServerResponse<ReadPaymentsOutput>> {
    const api = await takeApi()
    try {
        const { data } = await api.payment.readPayments({ page })
        return { data }
    }
    catch (error: any) {
        return { error: toErrorOutput(error) }
    }
}
