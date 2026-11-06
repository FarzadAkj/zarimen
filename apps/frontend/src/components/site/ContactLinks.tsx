import { MessageCircle, Phone, Send } from "lucide-react"

/**
 * Direct ways to reach the sales team. Each comes from apps/frontend/.env and is hidden when empty:
 * CONTACT_PHONE ("02112345678" / "09121234567"), CONTACT_WHATSAPP ("989121234567"), CONTACT_TELEGRAM ("username").
 */
export function ContactLinks() {
    const phone = process.env.CONTACT_PHONE
    const whatsapp = process.env.CONTACT_WHATSAPP
    const telegram = process.env.CONTACT_TELEGRAM?.replace(/^@/, "")

    const links = [
        phone && { href: `tel:${phone}`, label: "تماس تلفنی", detail: phone, icon: Phone },
        whatsapp && { href: `https://wa.me/${whatsapp}`, label: "واتس‌اپ", detail: `+${whatsapp}`, icon: MessageCircle },
        telegram && { href: `https://t.me/${telegram}`, label: "تلگرام", detail: `@${telegram}`, icon: Send },
    ].filter(link => !!link)

    if (!links.length)
        return <p className="text-muted-foreground">اطلاعات تماس به‌زودی در این بخش قرار می‌گیرد.</p>

    return (
        <div className="grid gap-3 sm:grid-cols-3">
            {links.map(link => (
                <a
                    key={link.href}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border bg-background p-4 transition hover:border-primary hover:shadow-md"
                >
                    <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                        <link.icon className="size-5" />
                    </span>
                    <span className="grid">
                        <span className="font-bold">{link.label}</span>
                        <span dir="ltr" className="text-sm text-muted-foreground text-end">{link.detail}</span>
                    </span>
                </a>
            ))}
        </div>
    )
}
