"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("cfo@financeos.studio");
  const [password, setPassword] = useState("FinanceDemo2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(payload: { demo?: boolean; email?: string; password?: string }) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Sign in failed");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#111827] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <div className="bg-gradient-to-br from-[#111827] via-[#172536] to-[#0f3d3e] text-white p-8 flex flex-col justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold tracking-wide uppercase">
              <Landmark className="w-4 h-4" />
              <span>FinanceOS · Financial ERP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-5 tracking-tight">
              Financial Intelligence for Modern Operations
            </h1>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Explore live PostgreSQL accounting workflows for{" "}
              <strong className="text-white">Meridian Digital Commerce LLC</strong> (fictional demo):
              multi-currency ledger, AR/AP invoicing, budgets, P&amp;L statements, and CSV bank reconciliation.
            </p>
          </div>
          <div className="space-y-2.5 text-xs text-slate-300 border-t border-white/10 pt-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Integer-cent accounting rules · Full audit trail · 1-click demo reset</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Demonstration software only — does not provide certified public accounting, tax filing, or regulatory audit assurance.
            </p>
          </div>
        </div>

        <div className="p-8 flex flex-col justify-center gap-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sign in to FinanceOS</h2>
            <p className="text-sm text-slate-500 mt-1">Launch the seeded demonstration ledger in one click.</p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void submit({ demo: true })}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
          >
            <span>Enter Demo CFO Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200" />
            <span className="px-3 text-xs font-medium text-slate-400 uppercase">or credentials</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit({ email, password });
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="email">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {error ? (
              <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#111827] hover:bg-slate-800 text-white font-semibold text-sm transition cursor-pointer disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
