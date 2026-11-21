"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Landmark,
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  PieChart,
  ArrowLeftRight,
  BarChart3,
  RotateCcw,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { SafeUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/ledger", label: "Ledger & Cash Flow", icon: BookOpen },
  { href: "/invoices", label: "Invoices & Bills", icon: FileText },
  { href: "/accounts", label: "Customers & Vendors", icon: Users },
  { href: "/budgets", label: "Budgets & FX Rates", icon: PieChart },
  { href: "/reconciliation", label: "Bank Reconciliation", icon: ArrowLeftRight },
  { href: "/reports", label: "P&L & Audit Logs", icon: BarChart3 },
];

export function AppShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleReset() {
    setResetting(true);
    setNotice(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(json.error || "Reset failed");
      setNotice(json.message || "Demo workspace restored.");
      window.location.reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-[#111827] text-slate-200">
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow">
            <Landmark className="w-5 h-5" />
          </span>
          <div>
            <div className="text-sm font-bold text-white leading-tight">FinanceOS</div>
            <div className="text-[11px] text-teal-300 font-medium">Meridian Digital LLC</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="FinanceOS navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2.5">
        <button
          type="button"
          disabled={resetting}
          onClick={() => void handleReset()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetting ? "Resetting..." : "Reset Demo Ledger"}</span>
        </button>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#f4f6f8] text-slate-900">
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 max-w-[82vw] h-full shadow-2xl">{sidebar}</div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      ) : null}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                FinanceOS ERP · Live PostgreSQL
              </div>
              <div className="text-xs text-slate-500 truncate">
                Fictional demo company — Meridian Digital Commerce LLC (not certified tax/CPA advice)
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
            Base: USD · Multi-Currency
          </span>
        </header>

        {notice ? (
          <div className="mx-4 sm:mx-6 mt-3 px-3.5 py-2 rounded-lg bg-teal-50 border border-teal-200 text-xs font-medium text-teal-900">
            {notice}
          </div>
        ) : null}

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
