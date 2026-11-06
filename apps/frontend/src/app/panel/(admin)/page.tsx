import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/shad/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shad/card"
import { ShopsTable } from "@/components/panel/ShopsTable"
import { readShops } from "./shops/actions"

export default async function ShopsPage() {
    const { data, error } = await readShops()

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>فروشگاه‌ها</CardTitle>
                <Button asChild>
                    <Link href="/panel/shops/new">
                        <Plus />
                        افزودن فروشگاه
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {data
                    ? <ShopsTable shops={data} rootDomain={process.env.ROOT_DOMAIN!} />
                    : <p className="text-destructive">{error?.translation}</p>}
            </CardContent>
        </Card>
    )
}
