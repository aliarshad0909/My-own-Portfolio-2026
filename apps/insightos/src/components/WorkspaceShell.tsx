"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { SafeUser } from "@/lib/types";

type WorkspaceShellProps = {
  user: SafeUser;
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: "/", label: "Analytics Dashboard", icon: LayoutDashboard },
  { href: "/datasets", label: "CSV & Data Sources", icon: Database },
  { href: "/explorer", label: "Chart Explorer", icon: SlidersHorizontal },
  { href: "/dashboards", label: "Saved Dashboards", icon: FileSpreadsheet },
];

export function WorkspaceShell({ user, children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusToast, setStatusToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleDemoReset() {
    setResetting(true);
    setStatusToast(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStatusToast({ type: "err", text: data.error || "Could not reset demo workspace." });
      } else {
        setStatusToast({ type: "ok", text: "Demo datasets & dashboards restored." });
        router.refresh();
        window.dispatchEvent(new CustomEvent("insightos:workspace-reset"));
      }
    } catch {
      setStatusToast({ type: "err", text: "Network error resetting demo workspace." });
    } finally {
      setResetting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full max-w-full bg-[#f3f6f9] text-slate-900">
      {/* Desktop Dark Graphite Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-[#111827] text-slate-100 lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800/90 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#06b6d4]/15 text-[#22d3ee] ring-1 ring-[#06b6d4]/40">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-white">InsightOS</span>
              <span className="rounded bg-[#06b6d4]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#22d3ee]">
                BI
              </span>
            </div>
            <p className="truncate text-[11px] text-slate-400">Analytics Engine v2.6</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#06b6d4]/15 text-[#22d3ee] ring-1 ring-[#06b6d4]/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#22d3ee]" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 rounded-lg border border-slate-800 bg-[#1f2937]/70 p-3 text-[11px] leading-relaxed text-slate-300">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-[#22d3ee]">
              <Activity className="h-3.5 w-3.5" />
              <span>Transparent BI Demo</span>
            </div>
            Seeded datasets are fictional studio demonstrations stored in PostgreSQL. Upload any CSV to analyze live records.
          </div>

          <div className="flex items-center gap-2.5 rounded-lg bg-slate-900/80 px-3 py-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#111827]"
              style={{ backgroundColor: user.avatarColor || "#06b6d4" }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={handleDemoReset}
              disabled={resetting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-[#06b6d4]/60 hover:text-white disabled:opacity-60"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
              <span>{resetting ? "Resetting..." : "Reset Demo"}</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-500/50 hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex w-72 max-w-[82vw] flex-col bg-[#111827] text-slate-100 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#06b6d4]/15 text-[#22d3ee]">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-white">InsightOS BI</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active
                        ? "bg-[#06b6d4]/15 text-[#22d3ee] ring-1 ring-[#06b6d4]/30"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-800 p-4">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <p className="mb-3 truncate text-[11px] text-slate-400">{user.email}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDemoReset}
                  disabled={resetting}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
                  <span>Reset Demo</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-rose-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#06b6d4]" />
              <span className="truncate text-sm font-semibold text-slate-900">
                {NAV_ITEMS.find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)))
                  ?.label ?? "InsightOS Workspace"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {statusToast && (
              <span
                className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${
                  statusToast.type === "ok"
                    ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200"
                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                }`}
              >
                {statusToast.text}
              </span>
            )}
            <Link
              href="/datasets"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#06b6d4] hover:text-[#0891b2] sm:inline-flex"
            >
              <Database className="h-3.5 w-3.5 text-[#0891b2]" />
              <span>Import CSV</span>
            </Link>
            <Link
              href="/explorer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0891b2]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#22d3ee]" />
              <span>Explorer</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
