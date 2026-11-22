"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  LineChart,
  Lock,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("analyst@insightos.studio");
  const [password, setPassword] = useState("InsightDemo2026!");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign-in failed.");
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

  async function handleDemoSignIn() {
    setDemoLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start demo session.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error while starting demo session.");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#111827] lg:flex-row">
      {/* Left Brand Showcase */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#083344] p-8 text-white sm:p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06b6d4]/20 text-[#22d3ee] ring-1 ring-[#06b6d4]/50">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">InsightOS</span>
            <p className="text-xs text-cyan-300/80">Business Intelligence &amp; Analytics SaaS</p>
          </div>
        </div>

        <div className="my-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
            <Sparkles className="h-3.5 w-3.5 text-[#22d3ee]" />
            <span>PostgreSQL-Backed BI Engine · Original Studio Demonstration</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Turn raw CSV tables into live executive dashboards &amp; statistical forecasts.
          </h1>
          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
            Every chart, KPI card, and 3-period OLS linear forecast inside InsightOS is computed strictly from persisted PostgreSQL records — never static mockups.
          </p>

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            {[
              {
                icon: Database,
                title: "5 Seeded Demo Datasets",
                desc: "Sales, Marketing, Inventory, Financial P&L, and Customer Retention cohorts.",
              },
              {
                icon: CheckCircle2,
                title: "CSV Upload & Validation",
                desc: "Automatic type inference, missing-cell checks, malformed row reporting & export.",
              },
              {
                icon: LineChart,
                title: "Interactive BI Explorer",
                desc: "Bar, Line & Area views with sum/avg/count/max, category & date-range filters.",
              },
              {
                icon: Lock,
                title: "Linear Trend Forecasting",
                desc: "Transparent ordinary least squares (OLS) 3-period projection with R² fit.",
              },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4"
                >
                  <Icon className="mb-2 h-4 w-4 text-[#22d3ee]" />
                  <h2 className="text-xs font-semibold text-white">{feat.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Ali Arshad Personal Studio · Seeded data is fictional demonstration telemetry.
        </p>
      </div>

      {/* Right Sign-In Card */}
      <div className="flex w-full items-center justify-center bg-[#f3f6f9] p-6 sm:p-10 lg:w-[480px] lg:shrink-0">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign in to InsightOS</h2>
            <p className="mt-1 text-sm text-slate-500">
              Launch the interactive BI workspace with 1-click Demo Analyst access or credentials.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={demoLoading || loading}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0891b2] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#06b6d4] disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            <span>{demoLoading ? "Launching Demo Workspace..." : "Demo Analyst Sign-In"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              or credentials
            </span>
            <div className="w-full border-t border-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Workspace Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              <span>{loading ? "Signing in..." : "Sign In"}</span>
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Demo Account Credentials</p>
            <p className="mt-1 font-mono text-[11px]">analyst@insightos.studio</p>
            <p className="font-mono text-[11px]">InsightDemo2026!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
