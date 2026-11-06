import "./globals.css";
import type { Metadata } from "next";
import { vazirmatn } from "@/app/font";

export const metadata: Metadata = {
  title: "احراز هویت مشتری",
  description: "احراز هویت مشتری با شماره موبایل، کد ملی و کارت بانکی پیش از صدور فاکتور",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
