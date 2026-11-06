import { Card, CardContent, CardHeader, CardTitle } from "@/components/shad/card"
import { CreateShopForm } from "@/components/panel/CreateShopForm"

export default function NewShopPage() {
    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>افزودن فروشگاه</CardTitle>
            </CardHeader>
            <CardContent>
                <CreateShopForm rootDomain={process.env.ROOT_DOMAIN!} />
            </CardContent>
        </Card>
    )
}
