import type { ShopPublicInfoModel } from "@/api/Api"
import { ShopLogo } from "./ShopLogo"

/** Shown to customers instead of the pages of a shop that is disabled or not subscribed. */
export function DisabledShopNotice({ shop }: { shop: ShopPublicInfoModel }) {
    return (
        <main className="min-h-dvh grid place-items-center p-6 bg-muted">
            <div className="w-full max-w-sm text-center grid justify-items-center gap-3">
                <ShopLogo logoUrl={shop.logoUrl} brandName={shop.brandName} className="size-20 opacity-60 grayscale" />
                <h1 className="text-xl font-bold">{shop.name}</h1>
                <p className="text-muted-foreground">
                    {shop.isActive
                        ? "خدمات احراز هویت زر ایمن برای این فروشگاه موقتاً در دسترس نیست."
                        : "خدمات زر ایمن برای این فروشگاه در حال حاضر غیرفعال است."}
                </p>
            </div>
        </main>
    )
}
