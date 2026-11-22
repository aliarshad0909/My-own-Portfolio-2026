"use client";

import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DEMO_ACCOUNT } from "@/lib/demo-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_ACCOUNT.email);
  const [password, setPassword] = useState(DEMO_ACCOUNT.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Sign-in failed.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Demo sign-in failed.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] lg:flex-row">
      {/* Left Brand Panel */}
      <div className="flex flex-col justify-between bg-[#1e1b4b] px-8 py-10 text-indigo-100 lg:w-5/12 lg:px-12 lg:py-14">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563eb] text-white shadow-md">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-white">SupportOS</div>
              <div className="text-xs font-medium text-indigo-300">
                Customer Support &amp; Help Desk SaaS
              </div>
            </div>
          </div>

          <h1 className="mt-10 text-3xl leading-tight font-extrabold text-white sm:text-4xl">
            Resolve every ticket on SLA with complete team clarity.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-indigo-200 sm:text-base">
            Shared agent inbox, internal collaboration notes, deterministic KB-grounded AI reply
            drafts, and a live customer self-service portal backed by PostgreSQL.
          </p>

          <div className="mt-8 space-y-3.5 text-sm">
            {[
              "Split-pane Shared Inbox with live SLA countdown & breach alerts",
              "Public Customer Replies vs. Internal Agent Notes separation",
              "1-Click Canned Responses + Editable AI Drafts (never auto-sent)",
              "Dedicated Customer Portal with auto-categorization & KB search",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <span className="text-indigo-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-indigo-800/80 bg-indigo-950/70 p-4 text-xs text-indigo-200">
          <div className="flex items-center gap-2 font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            Studio Demonstration Workspace
          </div>
          <p className="mt-1.5 leading-relaxed text-indigo-300">
            Pre-populated with realistic enterprise &amp; growth accounts, live SLA timers, canned
            macros, and knowledge base articles. Reset any time from the sidebar.
          </p>
        </div>
      </div>

      {/* Right Sign-In Card */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563eb]">
              <Sparkles className="h-3.5 w-3.5" />
              Agent &amp; Admin Access
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Lock className="h-3.5 w-3.5" />
              scrypt + HttpOnly
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">Sign in to SupportOS</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Launch the pre-seeded workspace in one click or sign in with credentials.
          </p>

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {loading ? "Launching Workspace…" : "Enter Demo Workspace"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span>or sign in with email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-blue-500/20"
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
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-60"
            >
              Sign in with Email
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Demo Credentials:</span>{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-slate-800">
              {DEMO_ACCOUNT.email}
            </code>{" "}
            /{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-slate-800">
              {DEMO_ACCOUNT.password}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
