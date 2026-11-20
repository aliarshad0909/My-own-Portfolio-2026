"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Boxes, CheckCircle2, Database, Lock, ShieldCheck, Smartphone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ops@stockflow.studio");
  const [password, setPassword] = useState("StockFlowDemo2026!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"demo" | "form" | "products" | null>(null);

  async function enterDemo(redirectTo = "/", mode: "demo" | "products" = "demo") {
    setError("");
    setBusy(mode);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true, clientType: "web" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Unable to open StockFlow demo.");
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
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, clientType: "web" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      <div className="flex flex-col justify-between bg-[#0c1a17] p-8 text-emerald-50 lg:col-span-5 lg:p-12">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Boxes className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold tracking-tight text-white">StockFlow</p>
              <p className="text-xs text-emerald-300/80">Inventory &amp; Operations Platform</p>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-3 py-1 text-xs font-medium text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Original Studio Demonstration</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Multi-warehouse inventory control from desktop to loading dock.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-emerald-100/80">
            Track SKUs, EAN-13 barcodes, warehouse stock levels, supplier purchase orders, customer sales orders, and
            live movements — synced with the StockFlow React Native Expo companion mobile app.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-emerald-100/85">
            {[
              "Atomic PostgreSQL stock receipts, adjustments, inter-warehouse transfers & reservations",
              "Real-time low-stock threshold alerts & immutable movement audit trail",
              "Shared Bearer-authenticated /api/v1/* backend powering StockFlow Mobile (Expo)",
              "Adapted from InvenTree MIT inventory architecture (Ali Arshad Personal Studio)",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 border-t border-emerald-950 pt-5 text-xs text-emerald-300/70">
          All products, warehouses, suppliers and orders in this workspace are fictional demonstration records.
        </p>
      </div>

      <div className="flex items-center justify-center bg-[#f6f7f9] p-6 sm:p-10 lg:col-span-7">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Open Operations Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
              Launch the interactive inventory workspace immediately or sign in with the controlled demo credentials.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/", "demo")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <span>{busy === "demo" ? "Opening…" : "Open Operations Dashboard"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={busy !== null}
              onClick={() => enterDemo("/products", "products")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <span>Explore Inventory</span>
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Database className="h-3.5 w-3.5 text-emerald-600" />
              <span>Controlled Demo Credentials (Web &amp; Mobile App)</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div>
                <span className="block font-sans text-slate-500">Email</span>
                <span className="text-slate-900">ops@stockflow.studio</span>
              </div>
              <div>
                <span className="block font-sans text-slate-500">Password</span>
                <span className="text-slate-900">StockFlowDemo2026!</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                Operations email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0c1a17] px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-60"
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

