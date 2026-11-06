import type { ShopPublicInfoModel } from "@/api/Api"
import { ShopLogo } from "./ShopLogo"

/** Shown instead of a disabled shop's pages. */
export function DisabledShopNotice({ shop }: { shop: ShopPublicInfoModel }) {
    return (
        <main className="min-h-dvh grid place-items-center p-6 bg-muted">
            <div className="w-full max-w-sm text-center grid justify-items-center gap-3">
                <ShopLogo logoUrl={shop.logoUrl} brandName={shop.brandName} className="size-20 opacity-60 grayscale" />
                <h1 className="text-xl font-bold">{shop.name}</h1>
                <p className="text-muted-foreground">
                    خدمات زر ایمن برای این فروشگاه در حال حاضر غیرفعال است.
                </p>
            </div>
        </main>
    )
}
