import Link from "next/link"
import { Inbox, LogOut, MessagesSquare, Settings, Store } from "lucide-react"
import { redirect } from "next/navigation"
import { Button } from "@/components/shad/button"
import { logout } from "../login/actions"

async function logoutAction() {
    "use server"
    await logout()
    redirect("/panel/login")
}

/** Shell of every admin page. Access is checked in src/proxy.ts. */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="min-h-dvh bg-muted">
            {/* Phones: brand + logout on the first row, the nav on its own horizontally scrolling row (as in the owner panel). */}
            <header className="border-b bg-background">
                <div className="mx-auto max-w-6xl flex flex-wrap md:flex-nowrap items-center gap-x-3 px-4">
                    <span className="flex items-center h-14 font-bold text-primary shrink-0">زر ایمن</span>
                    <nav className="max-md:order-last max-md:basis-full max-md:-mx-4 max-md:px-4 max-md:pb-1 max-md:[scrollbar-width:none] md:ms-4 min-w-0 flex gap-5 md:gap-4 overflow-x-auto whitespace-nowrap text-sm">
                        <Link href="/panel" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <Store className="size-4" />
                            فروشگاه‌ها
                        </Link>
                        <Link href="/panel/requests" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <Inbox className="size-4" />
                            درخواست‌ها
                        </Link>
                        <Link href="/panel/tickets" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <MessagesSquare className="size-4" />
                            تیکت‌ها
                        </Link>
                        <Link href="/panel/settings" className="flex shrink-0 items-center gap-1.5 py-2 hover:text-primary">
                            <Settings className="size-4" />
                            تنظیمات
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
