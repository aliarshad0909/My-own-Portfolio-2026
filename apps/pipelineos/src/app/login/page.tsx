"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Database, Kanban, Lock, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@pipelineos.studio");
  const [password, setPassword] = useState("PipelineDemo2026!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"demo" | "form" | "pipeline" | null>(null);

  async function enterDemo(redirectTo = "/", mode: "demo" | "pipeline" = "demo") {
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
        setError(data.error || "Unable to open demo workspace.");
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
      {/* Left dark navy product panel */}
      <div className="flex flex-col justify-between bg-[#0b1526] p-8 text-slate-200 lg:col-span-5 lg:p-12">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              P
            </span>
            <div>
              <p className="text-base font-bold tracking-tight text-white">PipelineOS</p>
              <p className="text-xs text-slate-400">CRM &amp; Sales Management Platform</p>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3 py-1 text-xs font-medium text-blue-200">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>Original Studio Demonstration</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Manage leads, pipeline velocity and revenue in one workspace.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            A real full-stack CRM powered by PostgreSQL, Drizzle ORM, validated REST APIs, Kanban stage tracking,
            transactional lead conversion and live analytics.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              "Real PostgreSQL persistence across contacts, leads, deals & activities",
              "Visual Kanban pipeline (New Lead → Qualified → Proposal → Negotiation → Won / Lost)",
              "Controlled demo workspace with rate limiting and one-click Demo Reset",
              "Built on MIT / Apache-2.0 open-source foundations (Ali Arshad Personal Studio)",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 border-t border-slate-800 pt-5 text-xs text-slate-400">
          All companies, contacts and deals in this demo workspace are fictional demonstration records.
        </p>
      </div>

      {/* Right login & instant demo access panel */}
      <div className="flex items-center justify-center bg-[#f4f6fa] p-6 sm:p-10 lg:col-span-7">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Open Demo Workspace</h2>
            <p className="mt-1 text-sm text-slate-600">
              Explore the full interactive CRM immediately, or sign in with the controlled demo credentials below.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/", "demo")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <span>{busy === "demo" ? "Opening…" : "Open Demo Workspace"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/pipeline", "pipeline")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Kanban className="h-4 w-4 text-blue-600" />
              <span>{busy === "pipeline" ? "Loading…" : "View Sales Pipeline"}</span>
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Database className="h-3.5 w-3.5 text-blue-600" />
              <span>Controlled Demo Credentials</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div>
                <span className="block font-sans text-slate-500">Email</span>
                <span className="text-slate-900">demo@pipelineos.studio</span>
              </div>
              <div>
                <span className="block font-sans text-slate-500">Password</span>
                <span className="text-slate-900">PipelineDemo2026!</span>
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
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0b1526] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
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

