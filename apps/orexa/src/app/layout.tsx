import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const heading = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Orexa — AI Learning Operating System (Interactive Demo)",
  description:
    "Interactive AI Learning Operating System demonstration with adaptive assessments, curriculum-grounded deterministic AI tutor, interactive lessons, and instructor studio.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${heading.variable} ${mono.variable} dark`}>
      <body className="min-h-screen bg-[#0d0f14] text-[#f3f5f8] antialiased selection:bg-[#ff6b4a]/30 selection:text-white">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
