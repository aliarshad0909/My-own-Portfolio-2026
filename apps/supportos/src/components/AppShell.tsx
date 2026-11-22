"use client";

import {
  BookOpen,
  Headphones,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  RotateCcw,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useToast } from "@/components/ToastProvider";
import type { SafeUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Support Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Shared Inbox", icon: Inbox },
  { href: "/portal", label: "Customer Portal", icon: LifeBuoy },
  { href: "/customers", label: "Customers & Macros", icon: Users },
  { href: "/kb", label: "KB & SLA Admin", icon: BookOpen },
];

export function AppShell({ user, children }: { user: SafeUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pushToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        pushToast(data.error || "Unable to reset demo workspace.", "error");
        return;
      }
      pushToast(data.message || "Demo workspace restored.", "success");
      window.location.reload();
    } finally {
      setResetting(false);
    }
  };

  const navContent = (
    <div className="flex h-full flex-col bg-[#1e1b4b] text-indigo-100">
      <div className="flex items-center justify-between border-b border-indigo-900/80 px-5 py-5">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-sm">
            <Headphones className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold tracking-tight text-white">SupportOS</div>
            <div className="text-[11px] font-medium text-indigo-300">Help Desk &amp; SLA Suite</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-indigo-300 hover:bg-indigo-900 hover:text-white lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary Workspace Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "text-indigo-200 hover:bg-indigo-900/70 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-indigo-900/80 p-4">
        <div className="rounded-xl bg-indigo-950/80 p-3 ring-1 ring-indigo-800/70">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: user.avatarColor || "#2563eb" }}
            >
              {user.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">{user.name}</div>
              <div className="truncate text-[11px] text-indigo-300">{user.email}</div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDemo}
              disabled={resetting}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-900/90 px-2.5 py-1.5 text-xs font-medium text-indigo-100 transition hover:bg-indigo-800 disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Resetting…" : "Reset Demo"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-900/90 px-2.5 py-1.5 text-xs font-medium text-indigo-200 transition hover:bg-rose-600 hover:text-white"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[#f8fafc]">
      {/* Desktop Indigo Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-68 max-w-[85vw]">{navContent}</div>
        </div>
      ) : null}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563eb] text-white">
              <Headphones className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-[#1e1b4b]">SupportOS</span>
          </div>
          <Link
            href="/inbox"
            className="rounded-lg bg-[#2563eb] px-2.5 py-1.5 text-xs font-semibold text-white"
          >
            Inbox
          </Link>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
