"use client";

import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { formatMoney, formatShortDate } from "@/lib/format";

type ReportData = {
  companyName: string;
  kpis: {
    totalRevenueCents: number;
    totalCogsCents: number;
    grossProfitCents: number;
    totalOperatingExpensesCents: number;
    netProfitCents: number;
    netMarginPct: number;
    openReceivablesCents: number;
    openPayablesCents: number;
  };
  pnl: {
    revenueLines: { category: string; amountCents: number }[];
    expenseLines: { category: string; amountCents: number }[];
  };
  auditLogs: { id: string; action: string; entityType: string; summary: string; actor: string; createdAt: string }[];
};

export function ReportsClient() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/overview");
      if (!res.ok) return;
      setData((await res.json()) as ReportData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  function exportCsv() {
    if (!data) return;
    const lines = [
      "Section,Category,AmountUSD",
      ...data.pnl.revenueLines.map((l) => `Revenue,"${l.category}",${(l.amountCents / 100).toFixed(2)}`),
      ...data.pnl.expenseLines.map((l) => `Expense,"${l.category}",${(-l.amountCents / 100).toFixed(2)}`),
      `Summary,Net Operating Profit,${(data.kpis.netProfitCents / 100).toFixed(2)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "financeos-pnl-statement.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !data) return <div className="text-sm text-slate-500 p-6">Compiling financial reports...</div>;

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profit &amp; Loss Statement &amp; Audit Logs</h1>
          <p className="text-sm text-slate-500">
            Computed directly from PostgreSQL ledger entries (demonstration reporting only — not a certified CPA audit).
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export P&amp;L CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase">Statement of Profit &amp; Loss (USD)</h2>
          <div className="space-y-2 text-sm">
            <div className="text-xs font-bold uppercase text-teal-700">Operating Revenue</div>
            {data.pnl.revenueLines.map((l) => (
              <div key={l.category} className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">{l.category}</span>
                <span className="font-semibold tabular-nums">{formatMoney(l.amountCents)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-bold text-slate-900">
              <span>Total Revenue</span>
              <span className="tabular-nums">{formatMoney(data.kpis.totalRevenueCents)}</span>
            </div>

            <div className="text-xs font-bold uppercase text-slate-600 pt-3">Cost of Goods &amp; Operating Expenses</div>
            {data.pnl.expenseLines.map((l) => (
              <div key={l.category} className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">{l.category}</span>
                <span className="font-semibold tabular-nums text-slate-800">({formatMoney(l.amountCents)})</span>
              </div>
            ))}

            <div className="flex justify-between pt-3 mt-2 border-t-2 border-slate-900 text-base font-bold">
              <span>Net Operating Income ({data.kpis.netMarginPct}%)</span>
              <span className="text-teal-700 tabular-nums">{formatMoney(data.kpis.netProfitCents)}</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase">Immutable Financial Audit Trail</h2>
          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {data.auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {log.action}
                  </span>
                  <span className="text-[11px] text-slate-400">{formatShortDate(log.createdAt)}</span>
                </div>
                <div className="text-xs text-slate-800">{log.summary}</div>
                <div className="text-[11px] text-slate-500">Actor: {log.actor}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
