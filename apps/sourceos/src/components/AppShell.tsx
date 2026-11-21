"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Calculator,
  Container,
  Factory,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Ship,
  X,
} from "lucide-react";
import type { SafeUser } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";

const NAV_ITEMS = [
  { href: "/", label: "Procurement Hub", icon: LayoutDashboard },
  { href: "/suppliers", label: "Suppliers & Audits", icon: Factory },
  { href: "/rfqs", label: "RFQs & Quotes", icon: FileSpreadsheet },
  { href: "/orders", label: "POs, Freight & Docs", icon: Ship },
  { href: "/landed-cost", label: "Landed-Cost Model", icon: Calculator },
];

export function AppShell({ user, children }: { user: SafeUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { notify } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleResetDemo() {
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || "Unable to reset workspace.", "error");
        return;
      }
      notify("SourceOS procurement dataset reset to clean baseline.");
      router.refresh();
    } catch {
      notify("Network error while resetting demo.", "error");
    } finally {
      setResetting(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  function renderNavLinks(onNavigate?: () => void) {
    return (
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-[#ea580c] text-white shadow-sm"
                  : "text-slate-300 hover:bg-[#192d4d] hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-orange-300"}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f2f4f8]">
      {/* Desktop Fixed Industrial Navy Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#0f1d33] text-slate-100 lg:flex">
        <div className="p-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ea580c] text-white shadow-md">
              <Container className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-white">SourceOS</p>
              <p className="truncate text-[11px] font-medium uppercase tracking-wider text-orange-300">
                Global Sourcing
              </p>
            </div>
          </Link>

          <div className="mt-7">{renderNavLinks()}</div>
        </div>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl bg-[#162744] p-3">
            <p className="truncate text-xs font-semibold text-white">{user.name}</p>
            <p className="truncate font-mono text-[11px] text-slate-400">{user.email}</p>
            <div className="mt-3 flex flex-col gap-1.5">
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetDemo}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600 bg-[#0f1d33] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-orange-400 hover:text-white disabled:opacity-60"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#f97316]" />
                <span>{resetting ? "Resetting…" : "Reset Demo Data"}</span>
              </button>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{signingOut ? "Signing out…" : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile & Tablet Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-[#0f1d33] px-4 py-3 text-white lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ea580c] text-white">
              <Container className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight">SourceOS</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#162744] p-2 text-slate-200 hover:text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileOpen ? (
          <div className="border-b border-slate-800 bg-[#0f1d33] px-4 pb-5 pt-2 text-white lg:hidden">
            {renderNavLinks(() => setMobileOpen(false))}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetDemo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-[#162744] px-3 py-1.5 text-xs font-medium text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#f97316]" />
                <span>{resetting ? "Resetting…" : "Reset Demo"}</span>
              </button>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Operational Canvas */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
