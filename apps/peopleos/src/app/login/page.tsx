"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Database,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("hr@peopleos.studio");
  const [password, setPassword] = useState("PeopleDemo2026!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"demo" | "leave" | "form" | null>(null);

  async function enterDemo(redirectTo = "/", mode: "demo" | "leave" = "demo") {
    setError("");
    setBusy(mode);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to open PeopleOS demo workspace.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Network error while signing in.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy("form");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      {/* Left soft-slate product identity panel */}
      <div className="flex flex-col justify-between bg-[#1e293b] p-8 text-slate-200 lg:col-span-5 lg:p-12">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16a34a] text-sm font-bold text-white shadow-sm">
              PO
            </span>
            <div>
              <p className="text-base font-bold tracking-tight text-white">PeopleOS</p>
              <p className="text-xs text-slate-400">Human Resource Management SaaS</p>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-950/50 px-3 py-1 text-xs font-medium text-green-200">
            <ShieldCheck className="h-3.5 w-3.5 text-[#22c55e]" />
            <span>Original Studio Demonstration · Product 11</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            People operations, leave approvals, and org clarity in one workspace.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Full-stack HR operations suite powered by PostgreSQL, Drizzle ORM, server-enforced RBAC PII redaction,
            atomic transactional leave approvals, recruitment pipeline, and onboarding checklists.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              "Server-enforced RBAC Role View (HR Demo, HR Admin, Manager, Employee) with live PII redaction",
              "Atomic PostgreSQL leave approval: updates request status, deducts balance & logs on_leave attendance",
              "Visual Org Chart (Manager → Direct Reports), Recruitment Pipeline & New-Hire Onboarding",
              "Performance Review cycles & Employee Compliance Document tracking",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-xl border border-slate-700 bg-slate-800/70 p-3.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Compliance &amp; Fictional Data Notice</span>
          </div>
          <p className="mt-1.5 leading-relaxed text-slate-300">
            PeopleOS is an HR operations demonstration using 100% fictional employee records and is{" "}
            <strong className="text-white">not</strong> a legally compliant statutory payroll, tax filing, or benefits
            administration system.
          </p>
        </div>
      </div>

      {/* Right login & instant demo access panel */}
      <div className="flex items-center justify-center bg-[#f6f8f7] p-6 sm:p-10 lg:col-span-7">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sign in to PeopleOS</h2>
            <p className="mt-1 text-sm text-slate-600">
              Launch the interactive HR demonstration immediately, or authenticate with the demo credentials below.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/", "demo")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
            >
              <span>{busy === "demo" ? "Opening…" : "Open Demo Workspace"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/leave", "leave")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <CalendarClock className="h-4 w-4 text-[#16a34a]" />
              <span>{busy === "leave" ? "Loading…" : "Leave Approvals"}</span>
            </button>
          </div>

          <div className="rounded-xl border border-green-200/80 bg-green-50/50 p-3.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Database className="h-3.5 w-3.5 text-[#16a34a]" />
              <span>Controlled Demo HR Credentials</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div>
                <span className="block font-sans text-slate-500">Email</span>
                <span className="text-slate-900">hr@peopleos.studio</span>
              </div>
              <div>
                <span className="block font-sans text-slate-500">Password</span>
                <span className="text-slate-900">PeopleDemo2026!</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#16a34a] focus:ring-2 focus:ring-green-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#16a34a] focus:ring-2 focus:ring-green-500/20 focus:outline-none"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e293b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              <Lock className="h-4 w-4" />
              <span>{busy === "form" ? "Signing in…" : "Sign in with credentials"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
