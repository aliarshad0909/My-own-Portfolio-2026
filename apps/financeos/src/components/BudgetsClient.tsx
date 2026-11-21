"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";

type BudgetRow = {
  id: string;
  category: string;
  monthlyLimitCents: number;
  actualCents: number;
  varianceCents: number;
  utilizationPct: number;
  overBudget: boolean;
  ownerName: string;
};

type RateRow = { code: string; name: string; rateToUsd: number; note: string };

export function BudgetsClient() {
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [rates, setRates] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Software & SaaS Tools");
  const [limit, setLimit] = useState("2500");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/budgets");
      if (!res.ok) return;
      const json = (await res.json()) as { budgets: BudgetRow[]; currencyRates: RateRow[] };
      setBudgets(json.budgets);
      setRates(json.currencyRates);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, monthlyLimitCents: Math.round((Number(limit) || 0) * 100) }),
    });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Budgets &amp; Multi-Currency Reference Rates</h1>
        <p className="text-sm text-slate-500">
          Track category spend against target limits and review user-configured exchange rates.
        </p>
      </div>

      <form onSubmit={(e) => void saveBudget(e)} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Category</label>
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div className="w-44">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Budget Limit (USD)</label>
          <input
            required
            type="number"
            min="100"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
        >
          Upsert Budget
        </button>
      </form>

      {loading ? (
        <div className="text-sm text-slate-500">Loading budgets...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase">Category Budgets vs. Actual Spend</h2>
            {budgets.map((b) => (
              <div key={b.id} className="space-y-1.5 border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900">{b.category}</span>
                  <span className={`text-xs font-bold tabular-nums ${b.overBudget ? "text-red-600" : "text-teal-700"}`}>
                    {b.utilizationPct}% used
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.overBudget ? "bg-red-500" : "bg-teal-600"}`}
                    style={{ width: `${Math.min(100, b.utilizationPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 tabular-nums">
                  <span>Actual: {formatMoney(b.actualCents)}</span>
                  <span>Limit: {formatMoney(b.monthlyLimitCents)}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase">Multi-Currency Exchange Rate Table</h2>
            <p className="text-xs text-slate-500">
              Rates below are user-editable reference rates for reporting conversions — not live banking feeds.
            </p>
            <div className="divide-y divide-slate-100">
              {rates.map((r) => (
                <div key={r.code} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-bold text-slate-900">
                      {r.code} · {r.name}
                    </div>
                    <div className="text-xs text-slate-500">{r.note}</div>
                  </div>
                  <div className="font-semibold text-teal-800 tabular-nums">1 {r.code} = ${r.rateToUsd}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
