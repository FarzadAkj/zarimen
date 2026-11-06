import Link from "next/link"
import { LayoutDashboard, LogOut, Users } from "lucide-react"
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
            <header className="border-b bg-background">
                <div className="mx-auto max-w-6xl flex items-center gap-3 px-4 h-14">
                    {shop.logoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={shop.logoUrl} alt="" className="size-8 rounded-md object-cover border" />
                        : null}
                    <span className="font-bold text-primary">{shop.brandName}</span>
                    <nav className="flex gap-4 text-sm ms-4">
                        <Link href="/panel" className="flex items-center gap-1.5 hover:text-primary">
                            <LayoutDashboard className="size-4" />
                            داشبورد
                        </Link>
                        <Link href="/panel/customers" className="flex items-center gap-1.5 hover:text-primary">
                            <Users className="size-4" />
                            مشتریان
                        </Link>
                    </nav>
                    <form action={logoutAction} className="ms-auto">
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
