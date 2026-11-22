"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Clock,
  Eye,
  FolderKanban,
  FolderOpen,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  X,
} from "lucide-react";
import type { SafeUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects & Milestones", icon: FolderOpen },
  { href: "/board", label: "Kanban Board", icon: FolderKanban },
  { href: "/time", label: "Time & Team", icon: Clock },
  { href: "/client-view", label: "Client Portal", icon: Eye },
] as const;

export function AppShell({ user, children }: { user: SafeUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleResetDemo() {
    setResetting(true);
    setNotice(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setNotice(data.error || "Unable to reset demo workspace.");
      } else {
        setNotice(data.message || "Demo data restored.");
        router.refresh();
        window.location.reload();
      }
    } catch {
      setNotice("Network error while resetting demo data.");
    } finally {
      setResetting(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function renderNavLinks(onSelect?: () => void) {
    return (
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onSelect}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#7c3aed] text-white shadow-sm shadow-violet-950/50"
                  : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-zinc-400"}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8f8fb] text-[#18181b] overflow-x-hidden print:block print:overflow-visible print:bg-white">
      {/* Desktop Charcoal Sidebar (#18181b) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#18181b] text-white border-r border-zinc-800 z-30 no-print print:hidden">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-zinc-800/90">
          <div className="h-8 w-8 rounded-lg bg-[#7c3aed] flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight truncate">ProjectOS</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-violet-300 truncate">
              Delivery Studio
            </div>
          </div>
        </div>

        {renderNavLinks()}

        <div className="p-3 border-t border-zinc-800 space-y-2">
          <button
            type="button"
            onClick={() => void handleResetDemo()}
            disabled={resetting}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 px-3 py-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-[#8b5cf6] ${resetting ? "animate-spin" : ""}`} />
            <span>{resetting ? "Restoring..." : "Reset Demo Data"}</span>
          </button>

          <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-900/80 px-3 py-2.5 border border-zinc-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                style={{ backgroundColor: user.avatarColor || "#7c3aed" }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{user.name}</div>
                <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print print:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#18181b] text-white flex flex-col h-full shadow-2xl z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold">ProjectOS</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavLinks(() => setMobileOpen(false))}
            <div className="p-3 border-t border-zinc-800 space-y-2">
              <button
                type="button"
                onClick={() => void handleResetDemo()}
                disabled={resetting}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-200 px-3 py-2"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#8b5cf6]" />
                <span>{resetting ? "Restoring..." : "Reset Demo Data"}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-200 px-3 py-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 print-main-shell print:pl-0 print:block">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 h-14 bg-[#18181b] text-white border-b border-zinc-800 px-4 flex items-center justify-between gap-3 no-print print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="h-7 w-7 rounded-lg bg-[#7c3aed] flex items-center justify-center shrink-0">
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold truncate">ProjectOS</span>
          </div>
          <span className="text-xs text-violet-300 truncate max-w-[140px]">{user.name}</span>
        </header>

        {notice && (
          <div className="bg-violet-50 border-b border-violet-200 px-4 sm:px-6 py-2 text-xs text-violet-800 flex items-center justify-between gap-3 no-print print:hidden">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-violet-600 hover:text-violet-900 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
