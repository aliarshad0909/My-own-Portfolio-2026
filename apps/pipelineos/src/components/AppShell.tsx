"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  CalendarCheck2,
  Kanban,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type { SafeUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/leads", label: "Leads", icon: UserPlus },
  { href: "/pipeline", label: "Sales Pipeline", icon: Kanban },
  { href: "/activities", label: "Activities & Tasks", icon: CalendarCheck2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

type Props = {
  user: SafeUser;
  children: ReactNode;
};

export function AppShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleDemoReset() {
    setResetBusy(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to reset demo data.", "error");
        return;
      }
      setResetOpen(false);
      toast("Demo workspace restored to seeded PostgreSQL dataset.", "success");
      router.refresh();
      window.dispatchEvent(new CustomEvent("pipelineos:refresh"));
    } finally {
      setResetBusy(false);
    }
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0b1526] text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
            P
          </span>
          <div>
            <span className="block text-sm font-bold tracking-tight text-white">PipelineOS</span>
            <span className="block text-[11px] text-slate-400">CRM &amp; Sales Suite</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/25 bg-blue-950/50 px-2.5 py-2 text-[11px] font-medium text-blue-200">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-400" />
          <span>Original Studio Demonstration</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main CRM navigation">
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
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-slate-800/80 p-3">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            setResetOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Demo Data</span>
        </button>

        <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/80 px-2.5 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f4f6fa]">
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-800 lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile slide-out drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button
            type="button"
            aria-label="Close backdrop"
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] shadow-2xl">{sidebarContent}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile hamburger + workspace meta) */}
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {NAV_ITEMS.find((n) => isActive(n.href))?.label ?? "Workspace"}
              </span>
              <span className="hidden rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 sm:inline-flex">
                PostgreSQL Live Demo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pipeline"
              className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
            >
              View Sales Pipeline
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

        {/* Guided first-use walkthrough strip */}
        {showGuide ? (
          <div className="border-b border-blue-100 bg-blue-50/70 px-4 py-2.5 text-xs text-slate-700 sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span className="font-semibold text-slate-900">Guided Demo:</span>
                <span>
                  Try creating a{" "}
                  <Link href="/contacts" className="font-medium text-blue-700 underline underline-offset-2">
                    contact
                  </Link>
                  , qualifying &amp; converting a{" "}
                  <Link href="/leads" className="font-medium text-blue-700 underline underline-offset-2">
                    lead
                  </Link>
                  , dragging deals in the{" "}
                  <Link href="/pipeline" className="font-medium text-blue-700 underline underline-offset-2">
                    Kanban pipeline
                  </Link>
                  , then inspect live{" "}
                  <Link href="/analytics" className="font-medium text-blue-700 underline underline-offset-2">
                    analytics
                  </Link>
                  .
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-slate-500 hover:text-slate-800"
                aria-label="Dismiss guide"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset demo workspace?"
        description="This will restore all contacts, leads, pipeline deals, activities and analytics back to the clean seeded demonstration dataset."
        confirmLabel="Reset Demo Data"
        danger={false}
        busy={resetBusy}
        onConfirm={handleDemoReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}

