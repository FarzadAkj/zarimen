/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ShopPublicInfoModel } from "@/api/Api"
import { cache } from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { toErrorOutput } from "@/lib/errors"
import { parseHost } from "@/lib/host"
import { takeApi } from "@/lib/take-api"

/**
 * The shop this request is for, from the Host header. Taken from the request rather
 * than from an argument, so a page or action can only ever act for the shop it is served on.
 * Server-only (not a server action, so the browser cannot call it).
 */
export async function currentSubdomain() {
    const target = parseHost((await headers()).get("host"), process.env.ROOT_DOMAIN!)
    if (target.kind !== "shop")
        throw new Error("Shop page or action used outside a shop subdomain")
    return target.subdomain
}

/** Public info of the current shop for its pages; renders 404 when no shop has this subdomain. */
export const getShopPublicInfo = cache(async (): Promise<ShopPublicInfoModel> => {
    const api = await takeApi()
    try {
        const { data } = await api.shopPanel.readShopPublicInfo({ subdomain: await currentSubdomain() })
        return data
    }
    catch (error: any) {
        const { message, translation } = toErrorOutput(error)
        if (message === "NotFound") notFound()
        throw new Error(translation)
    }
})
