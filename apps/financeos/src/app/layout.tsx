import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinanceOS — Financial Intelligence & Business ERP",
  description:
    "Unified SMB financial operations platform: ledger, invoicing, AR/AP, cash flow, P&L statements, budgets, multi-currency, and CSV bank reconciliation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
