"use client"
import type { ShopModel } from "@/api/Api"
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { setShopActive } from "@/app/panel/(admin)/shops/actions"
import { Badge } from "@/components/shad/badge"
import { Switch } from "@/components/shad/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shad/table"
import { formatAmount } from "@/lib/format"
import { WalletBalanceDialog } from "./WalletBalanceDialog"

export function ShopsTable({ shops, rootDomain }: { shops: ShopModel[], rootDomain: string }) {
    if (!shops.length)
        return <p className="text-muted-foreground text-center py-8">هنوز فروشگاهی ثبت نشده است.</p>

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>فروشگاه</TableHead>
                    <TableHead>زیردامنه</TableHead>
                    <TableHead>مالک</TableHead>
                    <TableHead>موبایل مالک</TableHead>
                    <TableHead>موجودی کیف پول</TableHead>
                    <TableHead>وضعیت</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {shops.map(shop => (
                    <TableRow key={shop.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                {shop.logoUrl
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={shop.logoUrl} alt="" className="size-9 rounded-md object-cover border" />
                                    : <div className="size-9 rounded-md bg-muted border" />}
                                <div>
                                    <Link href={`/panel/customers/${shop.subdomain}`} className="font-medium hover:text-primary hover:underline">{shop.name}</Link>
                                    <div className="text-xs text-muted-foreground">{shop.brandName}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell dir="ltr" className="text-end">
                            {shop.subdomain}.{rootDomain}
                        </TableCell>
                        <TableCell>{shop.ownerFullName}</TableCell>
                        <TableCell dir="ltr" className="text-end">{shop.ownerPhoneNumber}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                {formatAmount(shop.walletBalance)}
                                <WalletBalanceDialog shop={shop} />
                            </div>
                        </TableCell>
                        <TableCell><ActiveSwitch shop={shop} /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function ActiveSwitch({ shop }: { shop: ShopModel }) {
    const [pending, setPending] = useState(false)

    async function toggle(isActive: boolean) {
        setPending(true)
        const { error } = await setShopActive(shop.id, isActive)
        setPending(false)
        if (error)
            toast.error(error.translation)
        else
            toast.success(isActive ? `«${shop.name}» فعال شد.` : `«${shop.name}» غیرفعال شد.`)
    }

    return (
        <div className="flex items-center gap-2">
            <Switch dir="ltr" checked={shop.isActive} onCheckedChange={toggle} disabled={pending} />
            <Badge variant={shop.isActive ? "default" : "secondary"}>{shop.isActive ? "فعال" : "غیرفعال"}</Badge>
        </div>
    )
}
