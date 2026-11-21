"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Award,
  Briefcase,
  CalendarClock,
  Info,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  RotateCcw,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type { SafeUser } from "@/lib/auth";
import type { UserRole } from "@/lib/crypto";

const NAV_ITEMS = [
  { href: "/", label: "HR Dashboard", icon: LayoutDashboard },
  { href: "/directory", label: "Directory & Org Chart", icon: Users },
  { href: "/leave", label: "Attendance & Leave", icon: CalendarClock },
  { href: "/recruitment", label: "Recruitment & Onboarding", icon: Briefcase },
  { href: "/reviews", label: "Reviews & Documents", icon: Award },
];

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: "demo", label: "HR Demo", hint: "Full HR access" },
  { value: "admin", label: "HR Admin", hint: "Full PII & CRUD" },
  { value: "manager", label: "Manager", hint: "Team & approvals" },
  { value: "employee", label: "Employee", hint: "PII redacted" },
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
  const [roleBusy, setRoleBusy] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleRoleSwitch(nextRole: UserRole) {
    if (nextRole === user.role || roleBusy) return;
    setRoleBusy(true);
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to switch role view.", "error");
        return;
      }
      toast(
        nextRole === "employee"
          ? "Switched to Employee View — private compensation, emergency contacts & HR notes are now server-redacted on peer profiles."
          : `Switched RBAC Role View to ${ROLE_OPTIONS.find((r) => r.value === nextRole)?.label ?? nextRole}.`,
        "info",
      );
      router.refresh();
      window.dispatchEvent(new CustomEvent("peopleos:refresh"));
    } finally {
      setRoleBusy(false);
    }
  }

  async function handleDemoReset() {
    setResetBusy(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to reset demo HR dataset.", "error");
        return;
      }
      setResetOpen(false);
      toast("PeopleOS workspace restored to clean seeded HR dataset.", "success");
      router.refresh();
      window.dispatchEvent(new CustomEvent("peopleos:refresh"));
    } finally {
      setResetBusy(false);
    }
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#1e293b] text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16a34a] text-sm font-bold text-white shadow-sm">
            PO
          </span>
          <div>
            <span className="block text-sm font-bold tracking-tight text-white">PeopleOS</span>
            <span className="block text-[11px] text-slate-400">HR Operations Platform</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-950/40 px-2.5 py-2 text-[11px] font-medium text-green-200">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#22c55e]" />
          <span>RBAC &amp; Fictional HR Demo</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main HR navigation">
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
                  ? "bg-[#16a34a] text-white shadow-xs"
                  : "text-slate-300 hover:bg-slate-700/70 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-slate-700/80 p-3">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            setResetOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-green-500/60 hover:bg-slate-700 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Demo Data</span>
        </button>

        <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-800/90 px-2.5 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">
                Role: <span className="font-medium text-green-300">{user.role}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f6f8f7]">
      {/* Desktop persistent soft-slate sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-700/40 lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile slide-out drawer */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <button
            type="button"
            aria-label="Close backdrop"
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] shadow-2xl">{sidebarContent}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-slate-200/90 bg-white/95 px-3 py-2 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-900">
                {NAV_ITEMS.find((n) => isActive(n.href))?.label ?? "PeopleOS"}
              </span>
              <span className="hidden rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-[#15803d] xl:inline-flex">
                PostgreSQL Live
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* RBAC Role View Verification Switcher */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-[#f6f8f7] px-2 py-1">
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
              <label htmlFor="rbac-role-select" className="hidden text-[11px] font-semibold text-slate-600 sm:inline">
                Role View:
              </label>
              <select
                id="rbac-role-select"
                aria-label="RBAC Role View Switcher"
                value={user.role}
                disabled={roleBusy}
                onChange={(e) => void handleRoleSwitch(e.target.value as UserRole)}
                className="rounded bg-transparent text-xs font-semibold text-slate-900 focus:outline-none disabled:opacity-50"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.hint})
                  </option>
                ))}
              </select>
            </div>

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

        {/* Explicit HR Operations Demo & Non-Statutory Compliance Notice */}
        <div className="border-b border-green-200/70 bg-green-50/70 px-3 py-2 text-[11px] text-slate-700 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <div className="flex items-start gap-2 sm:items-center">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803d] sm:mt-0" />
              <p className="leading-snug">
                <strong className="font-semibold text-slate-900">HR Operations Demonstration:</strong>{" "}
                Uses fictional employee records only and is <strong>not</strong> a legally compliant statutory payroll,
                benefits, or tax filing system.
                {user.role === "employee" ? (
                  <span className="ml-1.5 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                    Employee RBAC Active: Peer private fields redacted
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 p-3 sm:p-6">{children}</main>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset PeopleOS demo workspace?"
        description="This will restore all fictional employees, departments, leave balances, attendance logs, recruitment candidates, onboarding checklists, performance reviews, and documents back to the clean seeded PostgreSQL state."
        confirmLabel="Reset Demo Data"
        danger={false}
        busy={resetBusy}
        onConfirm={handleDemoReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
