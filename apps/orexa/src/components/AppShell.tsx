"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Bot,
  BrainCircuit,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import type { SafeUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Student Dashboard", short: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses & Lessons", short: "Courses", icon: BookOpen },
  { href: "/assessments", label: "Adaptive Quizzes", short: "Assessments", icon: GraduationCap },
  { href: "/tutor", label: "AI Tutor", short: "AI Tutor", icon: Bot },
  { href: "/studio", label: "Instructor Studio", short: "Studio", icon: SlidersHorizontal },
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
  const [showNotice, setShowNotice] = useState(true);

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
        toast(data.error || "Unable to reset demo workspace.", "error");
        return;
      }
      setResetOpen(false);
      toast("Orexa demo workspace restored to seeded PostgreSQL dataset.", "success");
      router.refresh();
      window.dispatchEvent(new CustomEvent("orexa:refresh"));
    } finally {
      setResetBusy(false);
    }
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const activeNav = NAV_ITEMS.find((n) => isActive(n.href)) ?? NAV_ITEMS[0];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#10131b] text-[#e2e8f0]">
      <div className="flex items-center justify-between border-b border-[#222838] px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#f97316] text-white shadow-md shadow-[#ff6b4a]/25">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div>
            <span className="block text-sm font-bold tracking-tight text-white">Orexa</span>
            <span className="block text-[11px] text-[#8d99ae]">AI Learning OS Demo</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-[#9ca7bc] hover:bg-[#1a202d] hover:text-white lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-[#ff6b4a]/30 bg-[#ff6b4a]/10 px-2.5 py-2 text-[11px] font-medium text-[#ffb4a2]">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#ff6b4a]" />
          <span>Interactive Learning OS Demo</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Orexa primary navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-r from-[#ff6b4a] to-[#f97316] text-white shadow-sm shadow-[#ff6b4a]/20"
                  : "text-[#a8b2c5] hover:bg-[#191f2d] hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2.5 border-t border-[#222838] p-3">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            setResetOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2c3447] bg-[#161b26] px-3 py-2 text-xs font-semibold text-[#cbd4e4] transition hover:border-[#ff6b4a]/60 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#ff6b4a]" />
          <span>Reset Demo Dataset</span>
        </button>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-[#222838] bg-[#141821] px-2.5 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-[#8d99ae]">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-1.5 text-[#8d99ae] hover:bg-[#1f2636] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0d0f14] text-[#f3f5f8]">
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#222838] lg:sticky lg:top-0 lg:block lg:h-screen">
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
            className="fixed inset-0 bg-black/75"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] shadow-2xl">{sidebarContent}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top utility bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#222838] bg-[#0d0f14]/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg border border-[#2a3245] bg-[#141821] p-2 text-[#cbd4e4] hover:border-[#ff6b4a]/60 hover:text-white lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="truncate text-sm font-bold text-white">{activeNav.label}</span>
              <span className="hidden rounded-full border border-[#2c3447] bg-[#151a24] px-2.5 py-0.5 text-[11px] font-medium text-[#9ca7bc] sm:inline-flex">
                PostgreSQL · Deterministic AI
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/tutor"
              className="hidden items-center gap-1.5 rounded-lg border border-[#ff6b4a]/40 bg-[#ff6b4a]/10 px-3 py-1.5 text-xs font-semibold text-[#ffb4a2] transition hover:bg-[#ff6b4a]/20 sm:inline-flex"
            >
              <Bot className="h-3.5 w-3.5 text-[#ff6b4a]" />
              <span>Ask AI Tutor</span>
            </Link>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a3245] bg-[#141821] px-2.5 py-1.5 text-xs font-medium text-[#cbd4e4] transition hover:border-[#ff6b4a]/50 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#ff6b4a]" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </header>

        {/* Interactive demo banner */}
        {showNotice ? (
          <div className="border-b border-[#222838] bg-[#131722] px-4 py-2 text-xs text-[#a8b2c5] sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#ff6b4a]" />
                <span className="font-semibold text-white">Interactive Demo Guide:</span>
                <span>
                  Complete a lesson in{" "}
                  <Link href="/courses" className="font-medium text-[#ff8a6f] underline underline-offset-2">
                    Courses
                  </Link>
                  , take an adaptive quiz in{" "}
                  <Link href="/assessments" className="font-medium text-[#ff8a6f] underline underline-offset-2">
                    Assessments
                  </Link>
                  , query the syllabus-grounded{" "}
                  <Link href="/tutor" className="font-medium text-[#ff8a6f] underline underline-offset-2">
                    AI Tutor
                  </Link>
                  , or generate &amp; publish a lesson in{" "}
                  <Link href="/studio" className="font-medium text-[#ff8a6f] underline underline-offset-2">
                    Instructor Studio
                  </Link>
                  .
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNotice(false)}
                aria-label="Dismiss demo guide"
                className="text-[#7e8a9f] hover:text-white"
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
        title="Reset Orexa demo workspace?"
        description="This restores all courses, modules, lessons, lesson progress, quiz attempts, AI tutor conversations, and study resources back to the clean seeded demonstration dataset."
        confirmLabel="Reset Demo Data"
        danger={false}
        busy={resetBusy}
        onConfirm={handleDemoReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
