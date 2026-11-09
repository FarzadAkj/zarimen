import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shad/card"
import { EditShopForm } from "@/components/panel/EditShopForm"
import { readShopBySubdomain } from "../../../shops/actions"

/** zarimen.ir/panel/customers/<subdomain>/edit — the admin edits a shop's details. */
export default async function EditShopPage({ params }: { params: Promise<{ subdomain: string }> }) {
    const { subdomain } = await params
    const { data: shop, error } = await readShopBySubdomain(subdomain)
    if (error?.message === "NotFound") notFound()

    return (
        <div className="grid grid-cols-1 gap-4 max-w-3xl w-full mx-auto">
            <Link href={`/panel/customers/${subdomain}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
                <ChevronRight className="size-4" />
                بازگشت به فروشگاه
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle>ویرایش فروشگاه</CardTitle>
                    <CardDescription>زیردامنه و موبایل و کد ملی مالک قابل تغییر نیستند.</CardDescription>
                </CardHeader>
                <CardContent>
                    {shop
                        ? <EditShopForm shop={shop} rootDomain={process.env.ROOT_DOMAIN!} />
                        : <p className="text-destructive">{error?.translation}</p>}
                </CardContent>
            </Card>
        </div>
    )
}
