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
            <header className="border-b bg-background">
                <div className="mx-auto max-w-6xl flex items-center gap-6 px-4 h-14">
                    <span className="font-bold text-primary">زر ایمن</span>
                    <nav className="flex gap-4 text-sm">
                        <Link href="/panel" className="flex items-center gap-1.5 hover:text-primary">
                            <Store className="size-4" />
                            فروشگاه‌ها
                        </Link>
                        <Link href="/panel/requests" className="flex items-center gap-1.5 hover:text-primary">
                            <Inbox className="size-4" />
                            درخواست‌ها
                        </Link>
                        <Link href="/panel/tickets" className="flex items-center gap-1.5 hover:text-primary">
                            <MessagesSquare className="size-4" />
                            تیکت‌ها
                        </Link>
                        <Link href="/panel/settings" className="flex items-center gap-1.5 hover:text-primary">
                            <Settings className="size-4" />
                            تنظیمات
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
