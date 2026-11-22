"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  GitBranch,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Plug,
  RotateCcw,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";

type ShellUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/editor", label: "Visual Editor", icon: GitBranch },
  { href: "/runs", label: "Runs & Approvals", icon: Activity },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/integrations", label: "Integrations", icon: Plug },
];

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleResetDemo() {
    setResetting(true);
    setToast(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setToast(data.error || "Unable to reset workspace.");
      } else {
        setToast(data.message || "Workspace reset.");
        window.location.reload();
      }
    } catch {
      setToast("Network error while resetting demo.");
    } finally {
      setResetting(false);
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen flex bg-[#f7f6fb] text-[#141024] max-w-full overflow-x-hidden">
      {/* Desktop Obsidian Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-[#0c0a16] text-white border-r border-[#211b36] sticky top-0 h-screen">
        <div className="p-5 border-b border-[#1d1730] flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-violet-950/60 shrink-0">
            <Workflow className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold tracking-tight truncate">FlowOS</div>
            <div className="text-[11px] text-violet-300/80 font-medium truncate">
              AI Workflow Platform
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-[#7c3aed] text-white shadow-md shadow-violet-950/50"
                    : "text-slate-300 hover:bg-[#19142c] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-[#1d1730] space-y-3">
          <div className="rounded-xl bg-[#151126] border border-[#282144] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Human-in-the-Loop Active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Outbound actions pause automatically until approved.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleResetDemo}
              disabled={resetting}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#19142c] hover:bg-[#241d3f] border border-[#2c244a] text-xs font-medium text-violet-200 py-2 px-2 transition cursor-pointer disabled:opacity-50"
              title="Reset demo data"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{resetting ? "Resetting" : "Reset"}</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#19142c] hover:bg-rose-950/70 border border-[#2c244a] text-xs font-medium text-slate-200 py-2 px-2 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-[#0c0a16] text-white h-full flex flex-col border-r border-[#251f3d]">
            <div className="p-4 border-b border-[#1d1730] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center">
                  <Workflow className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-base">FlowOS</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-[#1a152e]"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      active ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-[#19142c]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#1d1730] space-y-2">
              <div className="text-xs text-slate-300 truncate">{user.name}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleResetDemo}
                  disabled={resetting}
                  className="rounded-lg bg-[#19142c] border border-[#2c244a] text-xs font-medium text-violet-200 py-2"
                >
                  Reset Demo
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-[#19142c] border border-[#2c244a] text-xs font-medium text-slate-200 py-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile/Tablet Topbar */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#0c0a16] text-white px-4 py-3 flex items-center justify-between border-b border-[#241d3d]">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg bg-[#18132b] text-slate-200"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Workflow className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="font-bold text-sm truncate">FlowOS</span>
            </div>
          </div>
          <Link
            href="/editor"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#7c3aed] text-white shrink-0"
          >
            Open Editor
          </Link>
        </header>

        {toast && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-xl bg-[#0c0a16] text-violet-200 border border-violet-500/30 px-4 py-2.5 text-xs flex items-center justify-between gap-2">
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
