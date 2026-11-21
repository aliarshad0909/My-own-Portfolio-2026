"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Database,
  Lock,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("learner@orexa.studio");
  const [password, setPassword] = useState("OrexaDemo2026!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"demo" | "courses" | "form" | null>(null);

  async function enterDemo(redirectTo = "/", mode: "demo" | "courses" = "demo") {
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
        setError(data.error || "Unable to launch Orexa demo workspace.");
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
    <div className="grid min-h-screen bg-[#0d0f14] text-[#f3f5f8] lg:grid-cols-12">
      {/* Left obsidian & coral narrative panel */}
      <div className="relative flex flex-col justify-between overflow-hidden border-b border-[#232938] bg-[#10131b] p-7 sm:p-10 lg:col-span-6 lg:border-r lg:border-b-0 lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#ff6b4a]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-[#f97316]/10 blur-3xl"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b4a] to-[#f97316] text-base font-bold text-white shadow-lg shadow-[#ff6b4a]/25">
              <BrainCircuit className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold tracking-tight text-white">Orexa</p>
              <p className="text-xs text-[#9ca7bc]">AI Learning Operating System</p>
            </div>
          </div>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#ff6b4a]/35 bg-[#ff6b4a]/10 px-3 py-1 text-xs font-medium text-[#ffb4a2]">
            <Sparkles className="h-3.5 w-3.5 text-[#ff6b4a]" />
            <span>Interactive Learning OS Demonstration · Zero Paid API Keys</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Adaptive mastery, curriculum-grounded AI tutoring, and live instructor authoring.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#a8b2c5]">
            Explore an interactive AI Learning Operating System demonstration backed by real PostgreSQL persistence.
            Track lesson mastery, run adaptive assessments that calibrate difficulty tiers, consult a deterministic
            syllabus-grounded AI tutor, and author lessons in Instructor Studio.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-[#cbd4e4]">
            {[
              "Real PostgreSQL persistence across courses, modules, lessons, progress & study resources",
              "Adaptive quizzes grading server-side (< 60% foundation review · 60–84% practice · ≥ 85% advanced unlock)",
              "Deterministic AI Tutor grounded directly in course syllabus content with persisted chat threads",
              "Instructor & Admin Studio with CRUD authoring, deterministic outline generator & cohort analytics",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b4a]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-10 border-t border-[#232938] pt-5 text-xs text-[#7e8a9f]">
          Interactive demonstration workspace built for Ali Arshad Personal Studio — self-contained showcase separate
          from enterprise Orexa deployments. All courses and learner telemetry are seeded demonstration records.
        </p>
      </div>

      {/* Right login & instant demo access panel */}
      <div className="flex items-center justify-center bg-[#0d0f14] p-6 sm:p-10 lg:col-span-6">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-[#262d3d] bg-[#141821] p-6 shadow-2xl shadow-black/40 sm:p-8">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#ff6b4a] uppercase">Workspace Access</p>
            <h2 className="mt-1 text-xl font-bold text-white">Enter Orexa Demo Workspace</h2>
            <p className="mt-1.5 text-sm text-[#9ca7bc]">
              Launch immediately with one click or sign in using the controlled demo learner credentials below.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/", "demo")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#ff6b4a]/20 transition hover:brightness-110 disabled:opacity-60"
            >
              <span>{busy === "demo" ? "Launching…" : "Enter Demo Workspace"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/courses", "courses")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#323b4f] bg-[#1a202d] px-4 py-2.5 text-sm font-semibold text-[#e2e8f0] transition hover:border-[#ff6b4a]/60 hover:bg-[#202738] disabled:opacity-60"
            >
              <BookOpen className="h-4 w-4 text-[#ff6b4a]" />
              <span>{busy === "courses" ? "Loading…" : "Browse Courses"}</span>
            </button>
          </div>

          <div className="rounded-xl border border-[#262d3d] bg-[#0f131b] p-3.5 text-xs text-[#9ca7bc]">
            <div className="flex items-center gap-2 font-semibold text-[#e2e8f0]">
              <Database className="h-3.5 w-3.5 text-[#ff6b4a]" />
              <span>Controlled Demo Credentials</span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 font-mono text-[11px] sm:grid-cols-2">
              <div>
                <span className="block font-sans text-[#7e8a9f]">Email</span>
                <span className="text-white">learner@orexa.studio</span>
              </div>
              <div>
                <span className="block font-sans text-[#7e8a9f]">Password</span>
                <span className="text-white">OrexaDemo2026!</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 border-t border-[#232938] pt-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#cbd4e4]">
                Learner Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#2d3548] bg-[#0f131b] px-3.5 py-2.5 text-sm text-white placeholder-[#64748b] focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/25 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#cbd4e4]">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#2d3548] bg-[#0f131b] px-3.5 py-2.5 text-sm text-white placeholder-[#64748b] focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/25 focus:outline-none"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-500/35 bg-red-950/50 px-3.5 py-2.5 text-xs font-medium text-red-200"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#323b4f] bg-[#1c2231] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#ff6b4a]/60 hover:bg-[#232a3c] disabled:opacity-60"
            >
              <Lock className="h-4 w-4 text-[#ff6b4a]" />
              <span>{busy === "form" ? "Signing in…" : "Sign in with credentials"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
