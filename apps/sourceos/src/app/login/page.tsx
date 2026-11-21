"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Anchor,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Container,
  Database,
  Lock,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("buyer@sourceos.studio");
  const [password, setPassword] = useState("SourceDemo2026!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"demo" | "calc" | "form" | null>(null);

  async function enterDemo(redirectTo = "/", mode: "demo" | "calc" = "demo") {
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
        setError(data.error || "Unable to open SourceOS demo workspace.");
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
      {/* Left Industrial Navy Panel */}
      <div className="industrial-grid flex flex-col justify-between bg-[#0f1d33] p-8 text-slate-100 lg:col-span-5 lg:p-12">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ea580c] text-white shadow-lg shadow-orange-950/40">
              <Container className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">SourceOS</p>
              <p className="text-xs font-medium uppercase tracking-wider text-orange-300">
                Global Procurement &amp; Sourcing
              </p>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#172a47] px-3 py-1 text-xs font-medium text-orange-200">
            <ShieldCheck className="h-3.5 w-3.5 text-[#f97316]" />
            <span>Industrial Supply-Chain Command Center</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Qualify global factories, compare RFQs, and model true landed cost.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Consolidate supplier audits, multi-vendor bid sheets, atomic purchase order issuance,
            ocean/air shipment tracking, trade compliance checklists, and scenario-based landed-cost
            modeling in one operational workspace.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {[
              "Supplier qualification lifecycle (Under Review → Approved / Probation) with OTD & defect scorecards",
              "Side-by-side RFQ quotation matrix with 1-click atomic Award → Purchase Order generation",
              "PO lifecycle, ocean/air/express freight corridor tracking & trade compliance document checks",
              "Persisted Landed-Cost Calculator (FOB, CIF, Customs Duty %, FX rate & per-unit USD breakdown)",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f97316]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 border-t border-slate-700/70 pt-5 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300">
            <Anchor className="h-3.5 w-3.5 text-[#f97316]" />
            <span className="font-semibold">Original Studio Demonstration — Product 06</span>
          </div>
          <p className="mt-1">
            All suppliers, RFQs, purchase orders, vessels, and cost scenarios are fictional
            demonstration records persisted in PostgreSQL.
          </p>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div className="flex items-center justify-center bg-[#f2f4f8] p-6 sm:p-10 lg:col-span-7">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-[#d7dee8] bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#ea580c]">
              Procurement Desk Access
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0f1d33]">
              Sign in to SourceOS
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Launch the interactive global procurement workspace immediately or sign in with demo
              credentials.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/", "demo")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ea580c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c2410c] disabled:opacity-60"
            >
              <span>{busy === "demo" ? "Entering…" : "Enter SourceOS Demo"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/landed-cost", "calc")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1d33] transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Calculator className="h-4 w-4 text-[#ea580c]" />
              <span>Landed-Cost Tool</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-[#0f1d33]">
              <Database className="h-3.5 w-3.5 text-[#ea580c]" />
              <span>Controlled Demo Credentials</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 font-mono text-[11px] sm:grid-cols-2">
              <div>
                <span className="block font-sans text-slate-500">Email</span>
                <span className="text-slate-900">buyer@sourceos.studio</span>
              </div>
              <div>
                <span className="block font-sans text-slate-500">Password</span>
                <span className="text-slate-900">SourceDemo2026!</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                Buyer email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f1d33] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#192d4d] disabled:opacity-60"
            >
              <Lock className="h-4 w-4 text-[#f97316]" />
              <span>{busy === "form" ? "Signing in…" : "Sign in with credentials"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
