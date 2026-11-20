"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Warehouse,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type { SafeUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Operations Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products & SKUs", icon: Package },
  { href: "/warehouses", label: "Warehouses & Stock", icon: Warehouse },
  { href: "/orders", label: "Purchase & Sales Orders", icon: ClipboardList },
  { href: "/movements", label: "Movement Audit Trail", icon: ArrowLeftRight },
];

export function AppShell({ user, children }: { user: SafeUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleReset() {
    setResetBusy(true);
    try {
      const res = await fetch("/api/v1/demo/reset", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to reset demo inventory.", "error");
        return;
      }
      setResetOpen(false);
      toast("StockFlow demo dataset restored cleanly.", "success");
      router.refresh();
      window.dispatchEvent(new CustomEvent("stockflow:refresh"));
    } finally {
      setResetBusy(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-[#0c1a17] text-emerald-50">
      <div className="flex items-center justify-between border-b border-emerald-950/90 px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Boxes className="h-4 w-4" />
          </span>
          <div>
            <span className="block text-sm font-bold tracking-tight text-white">StockFlow</span>
            <span className="block text-[11px] text-emerald-300/80">Inventory &amp; Operations</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-md p-1.5 text-emerald-300 hover:bg-emerald-900/50 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-950/70 px-2.5 py-2 text-[11px] font-medium text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span>Original Studio Demonstration</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="StockFlow navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-emerald-950 p-3">
        <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/60 px-3 py-2 text-[11px] text-emerald-200/90">
          <p className="flex items-center gap-1.5 font-semibold text-white">
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            <span>Expo Mobile Sync API</span>
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-300/80">
            Shared `/api/v1/*` endpoint connects the React Native barcode scanner app.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            setResetOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/70 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-900/70"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Demo Inventory</span>
        </button>

        <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-950/90 px-2.5 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{user.name}</p>
            <p className="truncate text-[11px] text-emerald-300/75">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="rounded-md p-1.5 text-emerald-300 hover:bg-emerald-900 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f6f7f9]">
      <aside className="hidden w-64 shrink-0 border-r border-emerald-950 lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" className="fixed inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-72 max-w-[85vw] shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-slate-900">
              {NAV_ITEMS.find((n) => isActive(n.href))?.label ?? "StockFlow"}
            </span>
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 sm:inline-flex">
              PostgreSQL + Mobile REST API
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/warehouses"
              className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
            >
              Transfer / Adjust Stock
            </Link>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </header>

        {showGuide ? (
          <div className="border-b border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-xs text-slate-700 sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="font-semibold text-slate-900">Guided Ops Tour:</span>
                <span>
                  Inspect low-stock alerts,{" "}
                  <Link href="/orders" className="font-medium text-emerald-700 underline underline-offset-2">
                    receive a Purchase Order
                  </Link>{" "}
                  to replenish inventory,{" "}
                  <Link href="/warehouses" className="font-medium text-emerald-700 underline underline-offset-2">
                    transfer stock between warehouses
                  </Link>
                  , or scan barcodes from the StockFlow Expo Mobile App.
                </span>
              </div>
              <button type="button" onClick={() => setShowGuide(false)} aria-label="Dismiss guide" className="text-slate-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset StockFlow demo inventory?"
        description="Restores products, warehouses, stock levels, purchase/sales orders and movement audit logs to the initial seeded dataset."
        confirmLabel="Reset Inventory"
        danger={false}
        busy={resetBusy}
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}

