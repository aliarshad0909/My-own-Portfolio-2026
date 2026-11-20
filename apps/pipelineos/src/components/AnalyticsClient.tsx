"use client";

import { useCallback, useEffect, useState } from "react";
import { formatUsd } from "@/lib/constants";

type AnalyticsPayload = {
  summary: {
    totalRevenueWon: number;
    activePipelineValue: number;
    avgDealSize: number;
    winRate: number;
  };
  monthlyDeals: { month: string; created: number; won: number; lost: number; revenue: number }[];
  pipelineDistribution: { stage: string; label: string; color: string; count: number; value: number }[];
  leadFunnel: { label: string; count: number }[];
  leadConversionBySource: {
    source: string;
    label: string;
    total: number;
    qualified: number;
    converted: number;
    conversionRate: number;
  }[];
  salesPerformance: {
    id: string;
    name: string;
    avatarColor: string;
    openDeals: number;
    pipelineValue: number;
    wonDeals: number;
    wonRevenue: number;
    winRate: number;
    completedTasks: number;
  }[];
};

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const handler = () => void load();
    window.addEventListener("pipelineos:refresh", handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pipelineos:refresh", handler);
    };
  }, [load]);

  if (loading && !data) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Computing live analytics…</div>;
  }
  if (!data) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Unable to load analytics.</div>;
  }

  const maxMonthlyRev = Math.max(...data.monthlyDeals.map((m) => m.revenue), 1);
  const maxDealsCount = Math.max(...data.monthlyDeals.map((m) => Math.max(m.created, m.won + m.lost)), 1);
  const maxStageVal = Math.max(...data.pipelineDistribution.map((s) => s.value), 1);
  const maxFunnel = Math.max(data.leadFunnel[0]?.count ?? 1, 1);

  // Build SVG polyline points for Revenue Trend
  const revPoints = data.monthlyDeals
    .map((m, idx) => {
      const x = 36 + (idx * 468) / Math.max(data.monthlyDeals.length - 1, 1);
      const y = 160 - Math.round((m.revenue / maxMonthlyRev) * 125);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales &amp; Pipeline Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every chart below updates dynamically from live PostgreSQL records — move a deal to Won or convert a lead to see totals shift immediately.
        </p>
      </div>

      {/* Top KPI summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Total Revenue Won</p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-700">{formatUsd(data.summary.totalRevenueWon)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Active Pipeline Value</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{formatUsd(data.summary.activePipelineValue)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Average Won Deal Size</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{formatUsd(data.summary.avgDealSize)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Closed-Deal Win Rate</p>
          <p className="mt-1.5 text-2xl font-bold text-blue-700">{data.summary.winRate}%</p>
        </div>
      </div>

      {/* Row 1: Revenue Trends + Monthly Deals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Revenue Trends (6 Months)</h2>
          <p className="text-xs text-slate-500">Closed-won deal value trajectory</p>
          <div className="mt-4 overflow-x-auto">
            <svg viewBox="0 0 540 195" className="h-48 w-full min-w-[360px]" role="img" aria-label="6-month revenue trend chart">
              {[0, 0.5, 1].map((ratio) => {
                const y = 160 - Math.round(ratio * 125);
                return (
                  <g key={ratio}>
                    <line x1="28" y1={y} x2="516" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                  </g>
                );
              })}
              <polyline fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={revPoints} />
              {data.monthlyDeals.map((m, idx) => {
                const x = 36 + (idx * 468) / Math.max(data.monthlyDeals.length - 1, 1);
                const y = 160 - Math.round((m.revenue / maxMonthlyRev) * 125);
                return (
                  <g key={m.month}>
                    <circle cx={x} cy={y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                    <text x={x} y={y - 11} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e293b">
                      {m.revenue > 0 ? `$${Math.round(m.revenue / 1000)}k` : "$0"}
                    </text>
                    <text x={x} y="183" textAnchor="middle" fontSize="11" fill="#64748b">
                      {m.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Monthly Deals Activity</h2>
          <p className="text-xs text-slate-500">Deals created vs. closed won &amp; lost per month</p>
          <div className="mt-5 grid h-48 grid-cols-6 items-end gap-3 border-b border-slate-100 pb-2">
            {data.monthlyDeals.map((m) => (
              <div key={m.month} className="flex h-full flex-col items-center justify-end gap-1.5">
                <div className="flex w-full flex-1 items-end justify-center gap-1">
                  <div
                    className="w-3.5 rounded-t bg-slate-400"
                    style={{ height: `${Math.max(6, Math.round((m.created / maxDealsCount) * 100))}%`, opacity: m.created ? 1 : 0.2 }}
                    title={`${m.month}: ${m.created} created`}
                  />
                  <div
                    className="w-3.5 rounded-t bg-emerald-500"
                    style={{ height: `${Math.max(6, Math.round((m.won / maxDealsCount) * 100))}%`, opacity: m.won ? 1 : 0.2 }}
                    title={`${m.month}: ${m.won} won`}
                  />
                  <div
                    className="w-3.5 rounded-t bg-red-400"
                    style={{ height: `${Math.max(6, Math.round((m.lost / maxDealsCount) * 100))}%`, opacity: m.lost ? 1 : 0.2 }}
                    title={`${m.month}: ${m.lost} lost`}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-500">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" /> Created
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Won
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Lost
            </span>
          </div>
        </section>
      </div>

      {/* Row 2: Pipeline Distribution + Lead Conversion Funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Pipeline Distribution by Stage</h2>
          <p className="text-xs text-slate-500">Deal volume and USD value across every stage</p>
          <div className="mt-4 space-y-3">
            {data.pipelineDistribution.map((s) => (
              <div key={s.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {s.label} ({s.count})
                  </span>
                  <span className="font-mono font-semibold text-slate-700">{formatUsd(s.value)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(s.value > 0 ? 5 : 0, Math.round((s.value / maxStageVal) * 100))}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Lead Conversion Funnel &amp; Sources</h2>
          <p className="text-xs text-slate-500">Qualification efficiency across acquisition channels</p>

          <div className="mt-4 space-y-2.5">
            {data.leadFunnel.map((step) => (
              <div key={step.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{step.label}</span>
                  <span className="font-semibold text-slate-900">
                    {step.count} ({Math.round((step.count / maxFunnel) * 100)}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${Math.round((step.count / maxFunnel) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto border-t border-slate-100 pt-4">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-2 font-semibold">Source</th>
                  <th className="pb-2 font-semibold">Leads</th>
                  <th className="pb-2 font-semibold">Qualified+</th>
                  <th className="pb-2 text-right font-semibold">Qual. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.leadConversionBySource.map((src) => (
                  <tr key={src.source}>
                    <td className="py-1.5 font-medium text-slate-800">{src.label}</td>
                    <td className="py-1.5 text-slate-600">{src.total}</td>
                    <td className="py-1.5 text-slate-600">{src.qualified}</td>
                    <td className="py-1.5 text-right font-semibold text-blue-700">{src.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Row 3: Sales Performance Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">Sales Team Performance</h2>
        <p className="text-xs text-slate-500">Open pipeline, closed-won revenue, win rate and completed activities by owner</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2.5">Owner</th>
                <th className="pb-2.5">Open Deals</th>
                <th className="pb-2.5">Active Pipeline</th>
                <th className="pb-2.5">Won Deals</th>
                <th className="pb-2.5">Won Revenue</th>
                <th className="pb-2.5">Win Rate</th>
                <th className="pb-2.5 text-right">Completed Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.salesPerformance.map((rep) => (
                <tr key={rep.id}>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ backgroundColor: rep.avatarColor }}
                      >
                        {rep.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-900">{rep.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-700">{rep.openDeals}</td>
                  <td className="py-3 font-medium text-slate-900">{formatUsd(rep.pipelineValue)}</td>
                  <td className="py-3 text-slate-700">{rep.wonDeals}</td>
                  <td className="py-3 font-semibold text-emerald-700">{formatUsd(rep.wonRevenue)}</td>
                  <td className="py-3 font-semibold text-blue-700">{rep.winRate}%</td>
                  <td className="py-3 text-right text-slate-700">{rep.completedTasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
