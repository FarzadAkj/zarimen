import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { CustomersBrowser } from "@/components/shop-panel/CustomersBrowser"
import { readMyCustomerCards, readMyCustomers } from "../../actions"

/** <subdomain>.zarimen.ir/panel/customers — customers who verified at this shop. */
export default async function ShopCustomersPage() {
    const { data: customers, error } = await readMyCustomers()

    return (
        <Card>
            <CardHeader>
                <CardTitle>مشتریان</CardTitle>
                <CardDescription>مشتریانی که در صفحه احراز هویت فروشگاه شما ثبت‌نام یا وارد شده‌اند.</CardDescription>
            </CardHeader>
            <CardContent>
                {customers
                    ? <CustomersBrowser initial={customers} loadCustomers={readMyCustomers} loadCards={readMyCustomerCards} />
                    : <p className="text-destructive">{error?.translation}</p>}
            </CardContent>
        </Card>
    )
}
