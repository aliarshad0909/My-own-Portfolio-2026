"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Inbox,
  LifeBuoy,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CategoryBadge, PriorityBadge, SlaBadge, StatusBadge } from "@/components/Badges";
import { CATEGORY_LABELS, PRIORITY_LABELS, type TicketCategory, type TicketPriority } from "@/lib/constants";
import type { SlaComputation, SupportAnalytics } from "@/lib/support-engine";
import { formatDurationMinutes } from "@/lib/support-engine";

type AttentionTicket = {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assignedAgentName: string | null;
  slaDueAt: string;
  sla: SlaComputation;
  customer: {
    id: string;
    name: string;
    company: string;
    planTier: string;
  };
};

type ActivityItem = {
  id: string;
  actorName: string;
  action: string;
  summary: string;
  createdAt: string;
};

type DashboardPayload = {
  analytics: SupportAnalytics;
  attentionQueue: AttentionTicket[];
  recentActivity: ActivityItem[];
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load SupportOS dashboard.");
      const json = (await res.json()) as DashboardPayload;
      setData(json);
      setLoadedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const kpis = data?.analytics.kpis;
  const maxPriorityCount = Math.max(
    1,
    ...(data?.analytics.byPriority.map((p) => p.count) ?? [1]),
  );
  const maxCategoryCount = Math.max(
    1,
    ...(data?.analytics.byCategory.map((c) => c.count) ?? [1]),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header + Quick Workspace Mode Switcher */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support Operations</h1>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
              Live SLA Monitor
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Real-time help desk telemetry, SLA compliance, and agent response analytics. Synced {loadedAt}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1d4ed8]"
          >
            <Inbox className="h-3.5 w-3.5" />
            Open Shared Inbox
          </Link>
        </div>
      </div>

      {/* Quick Workspace Mode Switcher */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link
          href="/inbox"
          className="group flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/70 p-4 transition hover:border-[#2563eb] hover:bg-blue-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white">
              <Inbox className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">Agent Inbox</div>
              <div className="truncate text-xs text-slate-600">
                Triage queue, internal notes &amp; AI reply drafts
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#2563eb] transition group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/portal"
          className="group flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 transition hover:border-indigo-500 hover:bg-indigo-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e1b4b] text-white">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">Customer Portal</div>
              <div className="truncate text-xs text-slate-600">
                Submit tickets, track status &amp; search KB
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-indigo-700 transition group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/kb#sla"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#2563eb] hover:bg-slate-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">Admin SLA &amp; Analytics</div>
              <div className="truncate text-xs text-slate-600">
                SLA thresholds, KB curation &amp; compliance
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Open Tickets</span>
            <Inbox className="h-4 w-4 text-[#2563eb]" />
          </div>
          <div className="mt-2.5 text-3xl font-extrabold text-slate-900">
            {kpis ? kpis.openTickets : "—"}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {kpis ? `${kpis.totalTickets} total in workspace` : "Loading…"}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-rose-700">
            <span>SLA Risk / Breached</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700">
              {kpis ? kpis.slaBreachedCount + kpis.slaAtRiskCount : "—"}
            </span>
            {kpis ? (
              <span className="text-xs font-medium text-slate-500">
                ({kpis.slaBreachedCount} breached · {kpis.slaAtRiskCount} at risk)
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {kpis ? `${kpis.slaCompliancePct}% overall SLA health` : "Loading…"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Avg First Response</span>
            <Clock className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2.5 text-3xl font-extrabold text-slate-900">
            {kpis ? formatDurationMinutes(kpis.avgFirstResponseMinutes) : "—"}
          </div>
          <p className="mt-1 text-xs text-slate-500">Public replies only (excludes internal notes)</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <span>Resolved Tickets</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2.5 text-3xl font-extrabold text-slate-900">
            {kpis ? kpis.resolvedTickets : "—"}
          </div>
          <p className="mt-1 text-xs text-slate-500">Completed &amp; closed conversations</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>KB Articles</span>
            <BookOpen className="h-4 w-4 text-[#2563eb]" />
          </div>
          <div className="mt-2.5 text-3xl font-extrabold text-slate-900">
            {kpis ? kpis.publishedKbArticles : "—"}
          </div>
          <p className="mt-1 text-xs text-slate-500">Published &amp; powering AI drafts</p>
        </div>
      </div>

      {/* Priority & Category Distributions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ticket Volume by Priority</h2>
              <p className="text-xs text-slate-500">Includes active SLA breach and at-risk counts</p>
            </div>
            <Link href="/kb#sla" className="text-xs font-semibold text-[#2563eb] hover:underline">
              SLA Policy →
            </Link>
          </div>
          <div className="mt-4 space-y-3.5">
            {(data?.analytics.byPriority ?? []).map((row) => {
              const pct = Math.round((row.count / maxPriorityCount) * 100);
              const barColor: Record<TicketPriority, string> = {
                urgent: "bg-rose-500",
                high: "bg-amber-500",
                medium: "bg-[#2563eb]",
                low: "bg-slate-400",
              };
              return (
                <div key={row.priority} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={row.priority} />
                      <span className="font-medium text-slate-600">
                        {PRIORITY_LABELS[row.priority]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span>{row.count} tickets</span>
                      {row.breached > 0 ? (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] text-rose-700">
                          {row.breached} breached
                        </span>
                      ) : null}
                      {row.atRisk > 0 ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800">
                          {row.atRisk} at risk
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${barColor[row.priority]}`}
                      style={{ width: `${Math.max(row.count > 0 ? 8 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Category Distribution</h2>
              <p className="text-xs text-slate-500">Auto-routed across support queues</p>
            </div>
            <Link href="/inbox" className="text-xs font-semibold text-[#2563eb] hover:underline">
              Filter Queue →
            </Link>
          </div>
          <div className="mt-4 space-y-3.5">
            {(data?.analytics.byCategory ?? []).map((row) => {
              const pct = Math.round((row.count / maxCategoryCount) * 100);
              return (
                <div key={row.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={row.category} />
                      <span className="font-medium text-slate-600">
                        {CATEGORY_LABELS[row.category as TicketCategory]}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-800">{row.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#1e1b4b] transition-all"
                      style={{ width: `${Math.max(row.count > 0 ? 8 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Agent Performance Analytics Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Users className="h-4 w-4 text-[#2563eb]" />
              Agent Performance Analytics
            </h2>
            <p className="text-xs text-slate-500">
              Workload distribution, first response latency, and SLA attainment per agent
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-4">Agent</th>
                <th className="px-3 py-2.5">Assigned</th>
                <th className="px-3 py-2.5">Active Open</th>
                <th className="px-3 py-2.5">Resolved</th>
                <th className="px-3 py-2.5">Avg First Response</th>
                <th className="px-3 py-2.5">Internal Notes</th>
                <th className="pl-3 py-2.5 text-right">SLA Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.analytics.agentPerformance ?? []).map((agent) => (
                <tr key={agent.agentName} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-4 font-semibold text-slate-900">{agent.agentName}</td>
                  <td className="px-3 py-3 text-slate-700">{agent.assignedCount}</td>
                  <td className="px-3 py-3 text-slate-700">{agent.openCount}</td>
                  <td className="px-3 py-3 font-medium text-emerald-700">{agent.resolvedCount}</td>
                  <td className="px-3 py-3 text-slate-700">
                    {agent.avgFirstResponseMinutes !== null
                      ? formatDurationMinutes(agent.avgFirstResponseMinutes)
                      : "Pending"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{agent.internalNotesCount}</td>
                  <td className="pl-3 py-3 text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        agent.slaCompliancePct >= 90
                          ? "bg-emerald-50 text-emerald-700"
                          : agent.slaCompliancePct >= 75
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {agent.slaCompliancePct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Priority Queue Preview + Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">SLA Priority Queue</h2>
              <p className="text-xs text-slate-500">Active tickets ordered by nearest SLA deadline</p>
            </div>
            <Link href="/inbox" className="text-xs font-semibold text-[#2563eb] hover:underline">
              View All →
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {(data?.attentionQueue ?? []).map((t) => (
              <Link
                key={t.id}
                href={`/inbox?ticket=${t.id}`}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3.5 transition hover:border-[#2563eb] hover:bg-blue-50/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#2563eb]">
                      {t.ticketNumber}
                    </span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {t.subject}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {t.customer.name} · {t.customer.company} ·{" "}
                    {t.assignedAgentName || "Unassigned"}
                  </div>
                </div>
                <div className="shrink-0">
                  <SlaBadge state={t.sla.state} label={t.sla.label} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Activity className="h-4 w-4 text-[#2563eb]" />
            Recent Activity
          </h2>
          <p className="text-xs text-slate-500">Latest audit trail events</p>
          <div className="mt-4 space-y-3">
            {(data?.recentActivity ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs"
              >
                <div className="font-semibold text-slate-900">{item.actorName}</div>
                <div className="mt-0.5 leading-relaxed text-slate-600">{item.summary}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {new Date(item.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
