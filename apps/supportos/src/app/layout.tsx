import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const heading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SupportOS — Customer Support & Help Desk SaaS",
  description:
    "Unified shared inbox, SLA tracking, customer self-service portal, knowledge base, and AI-assisted draft workflows.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${heading.variable}`}>
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
