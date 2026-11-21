"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  CalendarCheck2,
  CalendarDays,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import type { SafeUser } from "@/lib/auth";
import { SUPPORTED_TIMEZONES, type SupportedTimezone } from "@/lib/constants";

type TimezoneContextValue = {
  timezone: SupportedTimezone;
  setTimezone: (tz: SupportedTimezone) => void;
};

const TimezoneContext = createContext<TimezoneContextValue>({
  timezone: "America/New_York",
  setTimezone: () => {},
});

export function useWorkspaceTimezone() {
  return useContext(TimezoneContext);
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/book", label: "Book", icon: CalendarCheck2 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/catalog", label: "Catalog", icon: SlidersHorizontal },
  { href: "/customers", label: "Customers", icon: Users },
];

export function AppShell({ user, children }: { user: SafeUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pushToast } = useToast();
  const [timezone, setTimezone] = useState<SupportedTimezone>("America/New_York");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleResetDemo() {
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        pushToast("error", data.error || "Unable to reset demo workspace.");
      } else {
        pushToast("success", data.message || "Demo workspace restored.");
        router.refresh();
        window.dispatchEvent(new CustomEvent("bookos:refresh"));
      }
    } catch {
      pushToast("error", "Network error while resetting demo workspace.");
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
    <TimezoneContext.Provider value={{ timezone, setTimezone }}>
      <div className="min-h-screen bg-[#fafaf9] text-[#1c1917]">
        {/* Light Architectural Top Bar — distinct from dark-sidebar SaaS apps */}
        <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-6">
              <Link href="/" className="flex shrink-0 items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-xs">
                  <CalendarCheck2 className="h-5 w-5" />
                </span>
                <div className="leading-tight">
                  <span className="block text-base font-semibold tracking-tight text-[#1c1917]">
                    BookOS
                  </span>
                  <span className="hidden text-[11px] font-medium tracking-wide text-stone-500 sm:block">
                    Scheduling Studio
                  </span>
                </div>
              </Link>

              <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
                {NAV_ITEMS.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-blue-50 text-[#1d4ed8]"
                          : "text-stone-600 hover:bg-stone-100 hover:text-[#1c1917]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-lg border border-stone-200 bg-[#fafaf9] px-2.5 py-1.5 lg:flex">
                <Globe className="h-3.5 w-3.5 text-[#2563eb]" />
                <select
                  aria-label="Global display timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value as SupportedTimezone)}
                  className="bg-transparent text-xs font-medium text-[#1c1917] focus:outline-none"
                >
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleResetDemo}
                disabled={resetting}
                className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50 sm:inline-flex"
                title="Restore seeded demo bookings & catalog"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
                <span>Reset Demo</span>
              </button>

              <div className="hidden items-center gap-2 rounded-lg border border-stone-200 bg-[#fafaf9] px-2.5 py-1 sm:flex">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-[110px] truncate text-xs font-medium text-[#1c1917]">
                  {user.name}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-lg p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-[#1c1917] sm:inline-flex"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="inline-flex rounded-lg border border-stone-200 bg-white p-2 text-stone-700 md:hidden"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
              <div className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                        active ? "bg-blue-50 text-[#1d4ed8]" : "text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-col gap-2 border-t border-stone-200 pt-3">
                <label className="flex items-center justify-between gap-2 text-xs font-medium text-stone-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[#2563eb]" />
                    Timezone
                  </span>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value as SupportedTimezone)}
                    className="rounded-lg border border-stone-200 bg-[#fafaf9] px-2 py-1 text-xs text-[#1c1917]"
                  >
                    {SUPPORTED_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    disabled={resetting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Demo
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Subtle Studio Sandbox Strip */}
        <div className="border-b border-stone-200/70 bg-[#f5f5f4]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs text-stone-600 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>
                Live PostgreSQL scheduling sandbox · Atomic double-booking protection active ·
                Simulated payments only
              </span>
            </div>
            <span className="font-medium text-stone-700">
              Viewing times in <span className="text-[#1d4ed8]">{timezone}</span>
            </span>
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </TimezoneContext.Provider>
  );
}
