import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BookOS — Appointment Booking & Scheduling SaaS",
  description:
    "Serene multi-timezone appointment booking, atomic double-booking protection, sandbox payment simulation, and automated scheduling workflows.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#fafaf9] font-sans text-[#1c1917] selection:bg-blue-100 selection:text-blue-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
