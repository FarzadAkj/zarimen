import "./globals.css";
import type { Metadata } from "next";
import { vazirmatn } from "@/app/font";
import { Toaster } from "@/components/shad/sonner";

export const metadata: Metadata = {
  title: "زر ایمن",
  description: "احراز هویت مشتری با شماره موبایل، کد ملی و کارت بانکی پیش از صدور فاکتور",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  );
}
