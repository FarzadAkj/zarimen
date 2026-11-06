import { ServiceCostSettingSection } from "@/components/panel/ServiceCostSettingSection"
import { readServiceCostSettings } from "./actions/action"

/** zarimen.ir/panel/settings — one card per settings group (Darik's layout). */
export default async function SettingsPage() {
    const { data: serviceCosts, error } = await readServiceCostSettings()

    if (!serviceCosts)
        return <p className="text-destructive">{error?.translation ?? "مشکلی در گرفتن تنظیمات پیش آمده است."}</p>

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <ServiceCostSettingSection data={serviceCosts} />
        </div>
    )
}
