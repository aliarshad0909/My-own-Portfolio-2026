"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  GitBranch,
  Lock,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ops@flowos.studio");
  const [password, setPassword] = useState("FlowDemo2026!");
  const [loading, setLoading] = useState<"demo" | "creds" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDemoLogin() {
    setLoading("demo");
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "demo" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Unable to sign in with demo account.");
        setLoading(null);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
      setLoading(null);
    }
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading("creds");
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "credentials", email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        setLoading(null);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0a16] text-white flex flex-col lg:flex-row">
      {/* Left Brand / Architecture Panel */}
      <div className="lg:w-[54%] relative overflow-hidden p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#251f3d]">
        <div
          className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-violet-950/60">
            <Workflow className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">FlowOS</span>
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Automation Studio
            </span>
          </div>
        </div>

        <div className="relative z-10 my-10 lg:my-0 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">
            Visual AI Workflow Automation
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
            Orchestrate AI workflows with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-violet-400 to-fuchsia-300">
              deterministic safety gates.
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Design node-based pipelines on an interactive React Flow canvas, execute conditions and
            data transforms deterministically, and pause high-impact outbound actions for mandatory
            human operator approval.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#151126]/90 border border-[#282144] p-4">
              <GitBranch className="h-4 w-4 text-violet-400 mb-2" />
              <div className="text-sm font-semibold text-white">React Flow Canvas</div>
              <p className="text-xs text-slate-400 mt-1">
                Drag, connect, inspect & save 8 production node types.
              </p>
            </div>
            <div className="rounded-xl bg-[#151126]/90 border border-[#282144] p-4">
              <ShieldCheck className="h-4 w-4 text-amber-400 mb-2" />
              <div className="text-sm font-semibold text-white">Human Approval Gate</div>
              <p className="text-xs text-slate-400 mt-1">
                Hard pauses before external dispatch until explicitly approved.
              </p>
            </div>
            <div className="rounded-xl bg-[#151126]/90 border border-[#282144] p-4">
              <Bot className="h-4 w-4 text-emerald-400 mb-2" />
              <div className="text-sm font-semibold text-white">Deterministic AI</div>
              <p className="text-xs text-slate-400 mt-1">
                Zero-key scoring, triage & drafting with full step telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-violet-400" /> PostgreSQL + PGlite Persistence
          </span>
          <span>•</span>
          <span>Obsidian & Electric Violet Architecture</span>
        </div>
      </div>

      {/* Right Sign-In Card */}
      <div className="lg:w-[46%] flex items-center justify-center p-6 sm:p-10 bg-[#f7f6fb] text-[#141024]">
        <div className="w-full max-w-md rounded-2xl bg-white border border-[#e5e1f2] shadow-xl shadow-violet-950/5 p-7 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#141024]">
              Sign in to FlowOS
            </h2>
            <p className="text-sm text-[#5b5575] mt-1">
              Access your visual workflow editor, execution traces, and approval queue.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-semibold text-sm py-3 px-4 transition shadow-md shadow-violet-600/25 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            {loading === "demo" ? "Entering FlowOS Demo..." : "Enter Demo Workspace (Instant)"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e5e1f2]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[#7e7799]">
              or sign in with credentials
            </span>
            <div className="h-px flex-1 bg-[#e5e1f2]" />
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#332c4d] mb-1.5">
                Operator Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[#dad4ec] bg-[#faf9fd] px-3.5 py-2.5 text-sm text-[#141024] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]"
                placeholder="ops@flowos.studio"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#332c4d] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-[#dad4ec] bg-[#faf9fd] px-3.5 py-2.5 text-sm text-[#141024] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]"
                placeholder="••••••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0c0a16] hover:bg-[#1c1633] disabled:opacity-60 text-white font-semibold text-sm py-2.5 px-4 transition cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              {loading === "creds" ? "Verifying..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-[#f3efff] border border-[#e0d4fc] p-3.5 text-xs text-[#3b2e66]">
            <div className="font-semibold text-[#5b21b6] mb-1">Demo Operator Credentials</div>
            <div className="font-mono text-[11px] flex flex-col gap-0.5">
              <span>Email: ops@flowos.studio</span>
              <span>Pass: FlowDemo2026!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
