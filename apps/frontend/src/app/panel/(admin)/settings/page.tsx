import { ServiceCostSettingSection } from "@/components/panel/ServiceCostSettingSection"
import { SubscriptionPlansSection } from "@/components/panel/SubscriptionPlansSection"
import { readServiceCostSettings, readSubscriptionPlans } from "./actions/action"

/** zarimen.ir/panel/settings — one card per settings group (Darik's layout). */
export default async function SettingsPage() {
    const [{ data: serviceCosts, error }, plans] = await Promise.all([readServiceCostSettings(), readSubscriptionPlans()])

    if (!serviceCosts || !plans.data)
        return <p className="text-destructive">{(error ?? plans.error)?.translation ?? "مشکلی در گرفتن تنظیمات پیش آمده است."}</p>

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <ServiceCostSettingSection data={serviceCosts} />
            <SubscriptionPlansSection plans={plans.data} />
        </div>
    )
}
