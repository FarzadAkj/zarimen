import Link from "next/link"
import { BadgeCheck, LayoutDashboard, LifeBuoy, LogOut, ReceiptText, Users, Wallet } from "lucide-react"
import { redirect } from "next/navigation"
import { Button } from "@/components/shad/button"
import { logoutShop, readMyShop } from "../actions"

async function logoutAction() {
    "use server"
    await logoutShop()
    redirect("/panel/login")
}

/** Shell of every page of a shop's panel. Access is checked in src/proxy.ts. */
export default async function ShopOwnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { data: shop } = await readMyShop()
    if (!shop) redirect("/panel/login")

    return (
        <div className="min-h-dvh bg-muted">
            {/* Phones: brand + logout on the first row, the nav on its own horizontally scrolling row. */}
            <header className="border-b bg-background">
                <div className="mx-auto max-w-6xl flex flex-wrap md:flex-nowrap items-center gap-x-3 px-4">
                    <div className="flex items-center gap-3 h-14 min-w-0">
                        {shop.logoUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={shop.logoUrl} alt="" className="size-8 shrink-0 rounded-md object-cover border" />
                            : null}
                        <span className="font-bold text-primary truncate">{shop.brandName}</span>
                    </div>
                    <nav className="max-md:order-last max-md:basis-full max-md:-mx-4 max-md:px-4 max-md:pb-1 max-md:[scrollbar-width:none] md:ms-4 min-w-0 flex gap-5 md:gap-4 overflow-x-auto whitespace-nowrap text-sm">
                        <Link href="/panel" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <LayoutDashboard className="size-4" />
                            داشبورد
                        </Link>
                        <Link href="/panel/customers" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <Users className="size-4" />
                            مشتریان
                        </Link>
                        <Link href="/panel/subscription" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <BadgeCheck className="size-4" />
                            اشتراک
                        </Link>
                        <Link href="/panel/wallet" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <Wallet className="size-4" />
                            کیف پول
                        </Link>
                        <Link href="/panel/transactions" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <ReceiptText className="size-4" />
                            تراکنش‌ها
                        </Link>
                        <Link href="/panel/tickets" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <LifeBuoy className="size-4" />
                            پشتیبانی
                        </Link>
                    </nav>
                    <form action={logoutAction} className="ms-auto shrink-0">
                        <Button variant="ghost" size="sm" type="submit">
                            <LogOut />
                            خروج
                        </Button>
                    </form>
                </div>
            </header>
            <main className="mx-auto max-w-6xl p-4">{children}</main>
        </div>
    )
}
