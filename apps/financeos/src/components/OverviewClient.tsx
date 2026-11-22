"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, AlertTriangle, CheckCircle2, Wallet, TrendingUp, Receipt } from "lucide-react";
import { formatMoney } from "@/lib/format";

type OverviewData = {
  companyName: string;
  baseCurrency: string;
  budgetMonth: string;
  kpis: {
    totalRevenueCents: number;
    totalCogsCents: number;
    grossProfitCents: number;
    totalOperatingExpensesCents: number;
    totalOutflowCents: number;
    netProfitCents: number;
    netMarginPct: number;
    cashBalanceCents: number;
    openReceivablesCents: number;
    overdueReceivablesCents: number;
    openPayablesCents: number;
    unmatchedBankCount: number;
    totalTransactions: number;
  };
  monthlyCashFlow: { month: string; inflowCents: number; outflowCents: number; netCents: number }[];
  budgetStatus: {
    id: string;
    category: string;
    monthlyLimitCents: number;
    actualCents: number;
    utilizationPct: number;
    overBudget: boolean;
  }[];
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    direction: string;
    accountName: string;
    status: string;
    currency: string;
    totalCents: number;
    dueDate: string;
  }[];
};

export function OverviewClient() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/overview");
      if (!res.ok) throw new Error("Failed to load financial overview");
      setData((await res.json()) as OverviewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Computing live PostgreSQL financial statements...</div>;
  }
  if (error || !data) {
    return <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>;
  }

  const maxFlow = Math.max(
    1,
    ...data.monthlyCashFlow.flatMap((m) => [m.inflowCents, m.outflowCents]),
  );

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
          <p className="text-sm text-slate-500">
            Real-time cash flow, operating profit, AR/AP exposure, and budget discipline derived directly from ledger records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/invoices"
            className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>New Invoice / Bill</span>
          </Link>
          <Link
            href="/reconciliation"
            className="px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <span>Reconcile Bank ({data.kpis.unmatchedBankCount})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Cash Balance</span>
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {formatMoney(data.kpis.cashBalanceCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Includes $45,000 opening reserve</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700 mt-2 tabular-nums">
            {formatMoney(data.kpis.totalRevenueCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Gross Profit: {formatMoney(data.kpis.grossProfitCents)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Net Operating Profit</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div
            className={`text-2xl font-bold mt-2 tabular-nums ${
              data.kpis.netProfitCents >= 0 ? "text-slate-900" : "text-red-600"
            }`}
          >
            {formatMoney(data.kpis.netProfitCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Net Margin: {data.kpis.netMarginPct}%</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 min-w-0">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Open AR / Open AP</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 tabular-nums">
            AR {formatMoney(data.kpis.openReceivablesCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            AP {formatMoney(data.kpis.openPayablesCents)} · Overdue AR {formatMoney(data.kpis.overdueReceivablesCents)}
          </div>
        </div>
      </div>

      {/* Cash-Flow Chart + Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Monthly Cash-Flow Trend (Base USD)
              </h2>
              <p className="text-xs text-slate-500">Inflows vs. Outflows calculated from PostgreSQL transactions</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-600" /> Inflows
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" /> Outflows
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end pt-4 border-t border-slate-100">
            {data.monthlyCashFlow.map((m) => {
              const inPct = Math.max(8, Math.round((m.inflowCents / maxFlow) * 140));
              const outPct = Math.max(8, Math.round((m.outflowCents / maxFlow) * 140));
              return (
                <div key={m.month} className="flex flex-col items-center gap-2 min-w-0">
                  <div className="h-36 flex items-end gap-2">
                    <div
                      className="w-7 rounded-t-md bg-teal-600 transition-all"
                      style={{ height: `${inPct}px` }}
                      title={`Inflow: ${formatMoney(m.inflowCents)}`}
                    />
                    <div
                      className="w-7 rounded-t-md bg-slate-700 transition-all"
                      style={{ height: `${outPct}px` }}
                      title={`Outflow: ${formatMoney(m.outflowCents)}`}
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-700">{m.month}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Net {formatMoney(m.netCents)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Budget Utilization</h2>
              <p className="text-[11px] text-slate-500 tabular-nums">Monthly actuals ({data.budgetMonth})</p>
            </div>
            <Link href="/budgets" className="text-xs font-semibold text-teal-700 hover:underline">
              Manage
            </Link>
          </div>
          <div className="space-y-3.5">
            {data.budgetStatus.map((b) => (
              <div key={b.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-slate-800 truncate">{b.category}</span>
                  <span className={`font-bold tabular-nums ${b.overBudget ? "text-red-600" : "text-slate-600"}`}>
                    {b.utilizationPct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.overBudget ? "bg-red-500" : "bg-teal-600"}`}
                    style={{ width: `${Math.min(100, b.utilizationPct)}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {formatMoney(b.actualCents)} of {formatMoney(b.monthlyLimitCents)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent AR/AP Invoices */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Recent Invoices &amp; Vendor Bills
          </h2>
          <Link href="/invoices" className="text-xs font-semibold text-teal-700 hover:underline">
            View All Invoices →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                <th className="py-2 pr-3">Number</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Counterparty</th>
                <th className="py-2 pr-3">Due Date</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-3 font-semibold text-slate-900 tabular-nums">{inv.invoiceNumber}</td>
                  <td className="py-2.5 pr-3 text-xs uppercase font-semibold text-slate-600">
                    {inv.direction === "receivable" ? "AR Invoice" : "AP Bill"}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-700">{inv.accountName}</td>
                  <td className="py-2.5 pr-3 text-slate-500 tabular-nums">{inv.dueDate}</td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        inv.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : inv.status === "overdue"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">
                    {formatMoney(inv.totalCents, inv.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
