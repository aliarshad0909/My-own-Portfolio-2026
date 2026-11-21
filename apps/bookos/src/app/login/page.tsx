"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CreditCard,
  Globe,
  Lock,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@bookos.studio");
  const [password, setPassword] = useState("BookDemo2026!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDemoLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Unable to open demo workspace.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* Editorial Architectural Left Column */}
        <div className="space-y-8 lg:col-span-7">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
            <span>BookOS · Appointment Booking &amp; Scheduling SaaS</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-[#1c1917] sm:text-5xl sm:leading-[1.1]">
              Calm, conflict-free scheduling across every time zone.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-stone-600">
              Manage services, staff availability windows, live customer booking flows, automated
              reminders, and simulated sandbox payments inside one clean PostgreSQL-backed platform.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: "Atomic Double-Booking Guard",
                desc: "PostgreSQL transaction locking and partial unique index prevent overlapping slots with HTTP 409 protection.",
              },
              {
                icon: Globe,
                title: "Live Timezone Engine",
                desc: "Dynamic slot calculation across New York, Chicago, London, Dubai, Karachi, and UTC.",
              },
              {
                icon: CreditCard,
                title: "Sandbox Payment Simulation",
                desc: "Zero real PCI card collection — simulate instant paid receipts and automatic cancellation refunds.",
              },
              {
                icon: BellRing,
                title: "Automated Reminders Queue",
                desc: "24-hour email and 1-hour SMS notifications generated automatically on booking and reschedule.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs"
                >
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-[#1c1917]">{item.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clean Ivory/White Sign-In Card */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563eb] text-white shadow-xs">
                <CalendarCheck2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1c1917]">Sign in to BookOS</h2>
                <p className="text-xs text-stone-500">Original Studio Demo · Ali Arshad Studio</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                <span>Enter Demo Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-2 text-center text-[11px] text-stone-500">
                One-click instant access as <span className="font-medium text-stone-700">admin@bookos.studio</span>
              </p>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Or sign in with credentials
              </span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Workspace Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2.5 text-sm text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                  placeholder="admin@bookos.studio"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2.5 text-sm text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-[#1c1917] transition-colors hover:bg-stone-50 disabled:opacity-60"
              >
                <Lock className="h-4 w-4 text-stone-500" />
                <span>{loading ? "Signing in..." : "Sign in with Email"}</span>
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-stone-200/80 bg-[#f5f5f4] p-3 text-xs text-stone-600">
              <div className="font-medium text-[#1c1917]">Demo Credentials</div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-1 font-mono text-[11px]">
                <span>admin@bookos.studio</span>
                <span className="text-stone-500">BookDemo2026!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
