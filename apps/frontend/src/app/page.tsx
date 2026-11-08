import type { Metadata } from "next"
import type { ServiceCostSettingsModel, SubscriptionPlanModel } from "@/api/Api"
import Link from "next/link"
import { BadgeCheck, CreditCard, FileSearch, Gift, Globe, MessageSquareText, Newspaper, ShieldCheck, Smartphone, Store, Users, Wallet } from "lucide-react"
import { Button } from "@/components/shad/button"
import { ContactLinks } from "@/components/site/ContactLinks"
import { LogoMark, SiteLogo } from "@/components/site/SiteLogo"
import { formatAmount, formatDuration } from "@/lib/format"
import { publicApi } from "@/lib/public-api"

export const metadata: Metadata = {
    title: "زر ایمن | احراز هویت مشتریان طلافروشی پیش از صدور فاکتور",
    description: "استعلام شاهکار، تأیید شماره موبایل و تطبیق کارت بانکی مشتری با کد ملی، در صفحه اختصاصی فروشگاه شما.",
    other: {
        enamad: "8594365",
    },
}

/** Plans are re-read from the backend at most every 5 minutes. */
export const revalidate = 300

/** Service prices; null when the backend cannot be reached (the section is then left out). */
async function readServiceCosts(): Promise<ServiceCostSettingsModel | null> {
    try {
        const { data } = await publicApi().setting.readPublicServiceCosts()
        return data
    }
    catch {
        return null
    }
}

async function readPlans(): Promise<SubscriptionPlanModel[]> {
    try {
        const { data } = await publicApi().subscription.readPublicPlans()
        return data
    }
    catch {
        return []
    }
}

const STEPS = [
    {
        icon: Smartphone,
        title: "مشتری صفحه فروشگاه شما را باز می‌کند",
        text: <>هر فروشگاه یک آدرس اختصاصی دارد؛ مثلاً <span dir="ltr" className="font-mono">darikgoldcoin.zarimen.ir</span>. مشتری روی دکمه «احراز هویت» می‌زند.</>,
    },
    { icon: ShieldCheck, title: "استعلام شاهکار و کد تأیید", text: "کد ملی، شماره موبایل و تاریخ تولد مشتری با سامانه شاهکار تطبیق داده می‌شود و موبایل او با کد پیامکی تأیید می‌شود." },
    { icon: CreditCard, title: "تطبیق کارت بانکی", text: "کارتی که مشتری با آن پرداخت می‌کند با کد ملی و تاریخ تولد او استعلام می‌شود؛ فقط کارت به نام خود مشتری ثبت می‌شود." },
]

const BENEFITS = [
    { icon: Globe, title: "صفحه اختصاصی فروشگاه", text: "آدرس، لوگو و اطلاعات فروشگاه شما روی زیردامنه خودتان؛ بدون نیاز به سایت جداگانه." },
    { icon: ShieldCheck, title: "استعلام شاهکار", text: "اطمینان از اینکه شماره موبایل به نام صاحب کد ملی است." },
    { icon: CreditCard, title: "تطبیق کارت بانکی", text: "کاهش ریسک پرداخت با کارت متعلق به دیگران پیش از نهایی کردن فاکتور." },
    { icon: MessageSquareText, title: "تأیید موبایل با پیامک", text: "کد یک‌بارمصرف به همان شماره‌ای ارسال می‌شود که مشتری وارد کرده است." },
    { icon: Users, title: "پرونده مشتریان", text: "جستجوی مشتریان با کد ملی یا موبایل و مشاهده کارت‌های تأییدشده هر مشتری در پنل فروشگاه." },
    { icon: Wallet, title: "پرداخت به اندازه مصرف", text: "هزینه هر استعلام و پیامک از کیف پول فروشگاه کسر می‌شود؛ شارژ آنلاین با زرین‌پال." },
    { icon: FileSearch, title: "گزارش شفاف", text: "تاریخچه کامل تراکنش‌ها: هر استعلام، برای کدام مشتری و با چه هزینه‌ای." },
    { icon: Store, title: "مشتری مشترک بین فروشگاه‌ها", text: "مشتری‌ای که یک بار احراز هویت شده، در فروشگاه بعدی تنها با کد پیامکی وارد می‌شود." },
]

export default async function HomePage() {
    const [plans, costs] = await Promise.all([readPlans(), readServiceCosts()])
    // Only services that cost something are listed; with none, the section is left out.
    const paidServices = costs
        ? [
            { icon: ShieldCheck, title: "استعلام شاهکار", text: "تطبیق شماره موبایل با کد ملی، هنگام ثبت‌نام مشتری", price: costs.shahkarCost },
            { icon: CreditCard, title: "استعلام کارت بانکی", text: "تطبیق کارت بانکی با کد ملی و تاریخ تولد، برای هر کارت", price: costs.cardMatchCost },
            { icon: MessageSquareText, title: "پیامک کد تأیید", text: "برای هر کد تأییدی که به موبایل مشتری ارسال می‌شود", price: costs.smsCost },
        ].filter(service => service.price > 0)
        : []

    return (
        <div className="min-h-dvh bg-background">
            <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
                    <Link href="/"><SiteLogo /></Link>
                    <nav className="hidden gap-5 text-sm sm:flex">
                        <a href="#how" className="hover:text-primary">چطور کار می‌کند</a>
                        <a href="#benefits" className="hover:text-primary">امکانات</a>
                        <a href="#plans" className="hover:text-primary">تعرفه‌ها</a>
                        <Link href="/blog" className="hover:text-primary">وبلاگ</Link>
                    </nav>
                    <Button asChild size="sm" className="ms-auto">
                        <a href="#contact">تماس برای راه اندازی</a>
                    </Button>
                </div>
            </header>

            <main>
                {/* hero */}
                <section className="bg-gradient-to-b from-primary/15 via-primary/5 to-background">
                    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 text-center justify-items-center">
                        <LogoMark priority className="h-40 sm:h-56" />
                        <span className="rounded-full border border-primary/30 bg-background/70 px-4 py-1 text-sm text-primary">
                            ویژه طلافروشی‌ها، گالری‌های جواهر و نقره
                        </span>
                        <h1 className="max-w-3xl text-3xl font-bold leading-relaxed sm:text-5xl sm:leading-tight">
                            پیش از صدور فاکتور، <span className="text-primary">هویت مشتری</span> را بشناسید
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-muted-foreground text-justify [text-align-last:center]">
                            زر ایمن سامانه احراز هویت مشتریان طلافروشی است. شماره موبایل، کد ملی و کارت بانکی‌ای که مشتری با آن پرداخت می‌کند،
                            به‌صورت آنلاین استعلام و تطبیق داده می‌شود تا فاکتور را با اطمینان نهایی کنید.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button asChild size="lg"><a href="#plans">مشاهده تعرفه‌ها</a></Button>
                            <Button asChild size="lg" variant="outline"><a href="#contact">تماس با ما</a></Button>
                        </div>
                    </div>
                </section>

                {/* what we do */}
                <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
                    <h2 className="text-center text-2xl font-bold sm:text-3xl">چطور کار می‌کند؟</h2>
                    <p className="mt-3 text-center text-muted-foreground">سه مرحله، روی گوشی خود مشتری یا دستگاه فروشگاه</p>
                    <ol className="mt-10 grid gap-6 md:grid-cols-3">
                        {STEPS.map((step, i) => (
                            <li key={step.title} className="relative rounded-2xl border bg-background p-6 shadow-sm">
                                <span className="absolute -top-4 start-6 grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                    {(i + 1).toLocaleString("fa-IR")}
                                </span>
                                <step.icon className="size-8 text-primary" strokeWidth={1.5} />
                                <h3 className="mt-4 font-bold">{step.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-muted-foreground text-justify">{step.text}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* what owners get */}
                <section id="benefits" className="scroll-mt-20 bg-muted/50">
                    <div className="mx-auto max-w-6xl px-4 py-16">
                        <h2 className="text-center text-2xl font-bold sm:text-3xl">با زر ایمن چه به دست می‌آورید؟</h2>
                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {BENEFITS.map(benefit => (
                                <div key={benefit.title} className="rounded-2xl border bg-background p-5">
                                    <benefit.icon className="size-7 text-primary" strokeWidth={1.5} />
                                    <h3 className="mt-3 font-bold">{benefit.title}</h3>
                                    <p className="mt-2 text-sm leading-7 text-muted-foreground text-justify">{benefit.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* plans */}
                <section id="plans" className="scroll-mt-20 bg-muted/50">
                    <div className="mx-auto max-w-6xl px-4 py-16">
                        <h2 className="text-center text-2xl font-bold sm:text-3xl">تعرفه‌های اشتراک</h2>
                        <p className="mx-auto mt-3 max-w-3xl text-center text-muted-foreground text-justify [text-align-last:center]">
                            اشتراک، صفحه اختصاصی و پنل فروشگاه را فعال می‌کند؛ هزینه استعلام‌ها و پیامک‌ها جداگانه از کیف پول کسر می‌شود.
                        </p>

                        {/* 7-day trial: granted by the admin (subscription end date), not automatic */}
                        <div className="relative mt-10 overflow-hidden rounded-3xl border-2 border-primary bg-gradient-to-l from-primary/20 via-primary/10 to-background p-6 shadow-lg shadow-primary/10 sm:p-8">
                            <span className="absolute top-4 end-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">رایگان</span>
                            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
                                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                                    <Gift className="size-8" strokeWidth={1.5} />
                                </span>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold sm:text-2xl">۷ روز آزمایش رایگان</h3>
                                    <p className="mt-2 leading-7 text-muted-foreground text-justify">
                                        پیش از خرید اشتراک، صفحه اختصاصی و پنل فروشگاه خود را یک هفته رایگان امتحان کنید. در این مدت فقط هزینه استعلام‌ها و پیامک‌های مشتریان از کیف پول کسر می‌شود.
                                    </p>
                                </div>
                                <Button asChild size="lg" className="shrink-0">
                                    <a href="#contact">درخواست دوره آزمایشی</a>
                                </Button>
                            </div>
                        </div>
                        {plans.length
                            ? (
                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    {plans.map(plan => (
                                        <div key={plan.id} className="grid gap-4 rounded-2xl border bg-background p-6 text-center shadow-sm">
                                            <BadgeCheck className="mx-auto size-9 text-primary" strokeWidth={1.5} />
                                            <div>
                                                <h3 className="text-lg font-bold">{plan.title}</h3>
                                                <p className="text-sm text-muted-foreground">{formatDuration(plan.durationDays)}</p>
                                            </div>
                                            <p className="text-2xl font-bold text-primary">{formatAmount(plan.price)}</p>
                                            <Button asChild><a href="#contact">تماس برای راه اندازی</a></Button>
                                        </div>
                                    ))}
                                </div>
                            )
                            : <p className="mt-6 text-center text-muted-foreground">برای اطلاع از تعرفه‌ها با ما تماس بگیرید.</p>}
                    </div>
                </section>

                {/* per-request prices (only those above 0) */}
                {paidServices.length > 0 && (
                    <section id="costs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
                        <h2 className="text-center text-2xl font-bold sm:text-3xl">هزینه خدمات</h2>
                        <p className="mx-auto mt-3 max-w-3xl text-center text-muted-foreground text-justify [text-align-last:center]">
                            علاوه بر اشتراک، هزینه هر درخواست مشتریان شما به اندازه مصرف از کیف پول فروشگاه کسر می‌شود و همه آن‌ها در گزارش تراکنش‌ها قابل مشاهده است.
                        </p>
                        <div className="mt-10 grid gap-4 sm:grid-cols-2">
                            {paidServices.map(service => (
                                <div key={service.title} className="flex items-start gap-4 rounded-2xl border bg-background p-5">
                                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                                        <service.icon className="size-6" strokeWidth={1.5} />
                                    </span>
                                    <div className="grid gap-1">
                                        <h3 className="font-bold">{service.title}</h3>
                                        <p className="text-sm leading-6 text-muted-foreground text-justify">{service.text}</p>
                                        <p className="mt-1 text-lg font-bold text-primary">
                                            {formatAmount(String(service.price))}
                                            <span className="text-sm font-normal text-muted-foreground"> / هر بار</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* blog */}
                <section className="mx-auto max-w-6xl px-4 py-16">
                    <div className="flex flex-col items-center gap-4 rounded-3xl border bg-gradient-to-l from-primary/10 to-background p-8 text-center sm:flex-row sm:text-start">
                        <Newspaper className="size-12 shrink-0 text-primary" strokeWidth={1.5} />
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">وبلاگ زر ایمن</h2>
                            <p className="mt-1 text-muted-foreground text-justify">مقاله‌ها و راهنماهای امنیت فروش و احراز هویت مشتری در طلافروشی.</p>
                        </div>
                        <Button asChild variant="outline"><Link href="/blog">مشاهده وبلاگ</Link></Button>
                    </div>
                </section>

                {/* contact */}
                <section id="contact" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-16">
                    <h2 className="text-center text-2xl font-bold sm:text-3xl">تماس برای راه اندازی</h2>
                    <p className="mx-auto mt-3 mb-8 max-w-2xl text-center text-muted-foreground text-justify [text-align-last:center]">
                        برای راه‌اندازی صفحه فروشگاه و راه اندازی پنل اختصاصی خود، از یکی از راه‌های زیر با ما در تماس باشید.
                    </p>
                    <ContactLinks />
                </section>
            </main>

            <footer className="border-t">
                <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
                    <SiteLogo className="[&_span]:text-base" markClassName="h-7" />
                    <a
                        referrerPolicy="origin"
                        target="_blank"
                        rel="noopener"
                        href="https://trustseal.enamad.ir/?id=8594365&Code=rzVrOIyDAt9Z8MeaT9GynPG6hb2i9obH"
                        className="flex h-24 items-center justify-center"
                    >
                        {/* plain <img>: enamad checks the zarimen.ir referrer, next/image would proxy it */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            referrerPolicy="origin"
                            src="https://trustseal.enamad.ir/logo.aspx?id=8594365&Code=rzVrOIyDAt9Z8MeaT9GynPG6hb2i9obH"
                            alt="نماد اعتماد الکترونیکی"
                            className="max-h-full max-w-full cursor-pointer object-contain"
                            {...{ code: "rzVrOIyDAt9Z8MeaT9GynPG6hb2i9obH" }}
                        />
                    </a>
                    <span>© {new Date().getFullYear().toLocaleString("fa-IR", { useGrouping: false })} زر ایمن — zarimen.ir</span>
                </div>
            </footer>
        </div>
    )
}
