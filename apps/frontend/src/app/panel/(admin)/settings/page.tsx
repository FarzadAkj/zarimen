import { PlanDiscountSettingSection } from "@/components/panel/PlanDiscountSettingSection"
import { ServiceCostSettingSection } from "@/components/panel/ServiceCostSettingSection"
import { SubscriptionPlansSection } from "@/components/panel/SubscriptionPlansSection"
import { VatSettingSection } from "@/components/panel/VatSettingSection"
import { readPlanDiscountSettings, readServiceCostSettings, readSubscriptionPlans, readVatSettings } from "./actions/action"

/** zarimen.ir/panel/settings — one card per settings group (Darik's layout). */
export default async function SettingsPage() {
    const [{ data: serviceCosts, error }, plans, vat, discount] = await Promise.all([readServiceCostSettings(), readSubscriptionPlans(), readVatSettings(), readPlanDiscountSettings()])

    if (!serviceCosts || !plans.data || !vat.data || !discount.data)
        return <p className="text-destructive">{(error ?? plans.error ?? vat.error ?? discount.error)?.translation ?? "مشکلی در گرفتن تنظیمات پیش آمده است."}</p>

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ServiceCostSettingSection data={serviceCosts} />
            <SubscriptionPlansSection plans={plans.data} />
            <PlanDiscountSettingSection data={discount.data} />
            <VatSettingSection data={vat.data} />
        </div>
    )
}
