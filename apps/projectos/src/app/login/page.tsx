"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("pm@projectos.studio");
  const [password, setPassword] = useState("ProjectDemo2026!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDemoLogin() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Unable to open demo workspace.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error while signing into demo workspace.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8fb] flex flex-col lg:flex-row">
      {/* Left Brand Rail — Charcoal #18181b with crisp Violet #8b5cf6 accents */}
      <div className="lg:w-[46%] bg-[#18181b] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#7c3aed] flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight leading-none">ProjectOS</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-violet-300 mt-1">
                Studio Delivery Workspace
              </div>
            </div>
          </div>

          <h1 className="mt-10 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-white">
            Deliver client programs on schedule, with zero blind spots.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-md">
            Coordinate milestones, drag-and-drop Kanban execution, task dependency alerts, team
            billable utilization, and sanitized read-only client portals from one workspace.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <FolderKanban className="h-4 w-4 text-[#8b5cf6] mb-2" />
              <div className="text-sm font-medium text-white">Dependency-Aware Kanban</div>
              <p className="text-xs text-zinc-400 mt-1">
                HTML5 drag-and-drop stages with automatic prerequisite blocker warnings.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <Clock className="h-4 w-4 text-[#8b5cf6] mb-2" />
              <div className="text-sm font-medium text-white">Time & Budget Burn</div>
              <p className="text-xs text-zinc-400 mt-1">
                Billable vs. non-billable logs tied directly to projects, tasks, and capacity.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <CheckCircle2 className="h-4 w-4 text-[#8b5cf6] mb-2" />
              <div className="text-sm font-medium text-white">Live Reports & Milestones</div>
              <p className="text-xs text-zinc-400 mt-1">
                1-click milestone sign-offs plus printable & CSV delivery reports from PostgreSQL.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <ShieldCheck className="h-4 w-4 text-[#8b5cf6] mb-2" />
              <div className="text-sm font-medium text-white">Client Portal View</div>
              <p className="text-xs text-zinc-400 mt-1">
                Clean read-only stakeholder status hiding internal team threads and admin actions.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Ali Arshad Personal Studio — Product 09</span>
          <span className="text-violet-400 font-mono">PostgreSQL + Next.js 16</span>
        </div>
      </div>

      {/* Right Sign-in Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#e6e6ee] shadow-sm p-7 sm:p-9">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-medium text-[#7c3aed]">
            <Sparkles className="h-3.5 w-3.5" />
            Live Interactive SaaS Demo
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#18181b]">
            Sign in to ProjectOS
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            Jump straight into the seeded studio portfolio or sign in with demo credentials.
          </p>

          <button
            type="button"
            onClick={() => void handleDemoLogin()}
            disabled={loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-medium text-sm px-4 py-3 transition-colors shadow-sm cursor-pointer"
          >
            <span>{loading ? "Opening workspace..." : "Enter Demo Workspace"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-4 rounded-xl bg-[#f8f8fb] border border-[#e6e6ee] px-3.5 py-2.5 text-xs text-zinc-600 flex flex-wrap items-center justify-between gap-2">
            <span>Demo PM:</span>
            <span className="font-mono text-zinc-800">pm@projectos.studio / ProjectDemo2026!</span>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e6e6ee]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-white px-3 text-zinc-400">Or sign in manually</span>
            </div>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-zinc-700 mb-1.5">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#e6e6ee] bg-white px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#7c3aed]"
                placeholder="pm@projectos.studio"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e6e6ee] bg-white px-3.5 py-2.5 text-sm text-[#18181b] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#7c3aed]"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-[#18181b] bg-[#18181b] hover:bg-zinc-800 disabled:opacity-60 text-white font-medium text-sm px-4 py-2.5 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
