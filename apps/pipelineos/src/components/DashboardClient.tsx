"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  DollarSign,
  Kanban,
  Mail,
  MessageSquare,
  Phone,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { formatShortDate, formatUsd } from "@/lib/constants";

type DashboardPayload = {
  kpis: {
    totalContacts: number;
    newLeads: number;
    totalLeads: number;
    activeOpportunities: number;
    dealsWon: number;
    dealsLost: number;
    pipelineValue: number;
    weightedPipelineValue: number;
    totalWonRevenue: number;
    conversionRate: number;
  };
  monthlyRevenue: { month: string; revenue: number; dealsWon: number; dealsCreated: number }[];
  recentActivities: {
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    dueAt: string | null;
    createdAt: string;
    contactName: string | null;
    dealTitle: string | null;
    ownerName: string;
  }[];
  upcomingTasks: {
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    dueAt: string | null;
    contactName: string | null;
    dealTitle: string | null;
    ownerName: string;
  }[];
};

function ActivityIcon({ type }: { type: string }) {
  if (type === "call") return <Phone className="h-3.5 w-3.5 text-blue-600" />;
  if (type === "meeting") return <Video className="h-3.5 w-3.5 text-indigo-600" />;
  if (type === "email") return <Mail className="h-3.5 w-3.5 text-amber-600" />;
  return <MessageSquare className="h-3.5 w-3.5 text-slate-500" />;
}

export function DashboardClient() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load CRM dashboard metrics.");
      const json = (await res.json()) as DashboardPayload;
      setData(json);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await load();
    };
    const timer = window.setTimeout(() => void run(), 0);
    const handler = () => void load();
    window.addEventListener("pipelineos:refresh", handler);
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("pipelineos:refresh", handler);
    };
  }, [load]);

  async function toggleTask(id: string) {
    const res = await fetch(`/api/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (res.ok) {
      toast("Task marked completed.", "success");
      void load();
    } else {
      toast("Unable to update task.", "error");
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="mt-1">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpis, monthlyRevenue, recentActivities, upcomingTasks } = data;
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Revenue &amp; Pipeline Overview</h1>
          <p className="mt-1 text-sm text-slate-600">
            Live metrics calculated directly from PostgreSQL contacts, leads, deals and activities.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Manage Leads</span>
          </Link>
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Open Sales Pipeline</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid — all required metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active Pipeline Value</span>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatUsd(kpis.pipelineValue)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Weighted forecast: <strong className="text-slate-700">{formatUsd(kpis.weightedPipelineValue)}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active Opportunities</span>
            <Kanban className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.activeOpportunities}</p>
          <p className="mt-1 text-xs text-slate-500">Across New Lead → Negotiation</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Deals Won</span>
            <Trophy className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{kpis.dealsWon}</p>
          <p className="mt-1 text-xs text-slate-500">
            Revenue won: <strong className="text-slate-700">{formatUsd(kpis.totalWonRevenue)}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Win / Conversion Rate</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.conversionRate}%</p>
          <p className="mt-1 text-xs text-slate-500">
            {kpis.dealsWon} won · {kpis.dealsLost} lost
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Contacts</span>
            <Users className="h-4 w-4 text-slate-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.totalContacts}</p>
          <Link href="/contacts" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
            View directory <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>New / Active Leads</span>
            <UserPlus className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.newLeads}</p>
          <p className="mt-1 text-xs text-slate-500">{kpis.totalLeads} total leads tracked</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Deals Lost</span>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.dealsLost}</p>
          <p className="mt-1 text-xs text-slate-500">Tracked for honest win-rate reporting</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Open Follow-ups</span>
            <CalendarClock className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{upcomingTasks.length}</p>
          <Link href="/activities" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
            Open task queue <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Monthly Revenue Overview Chart + Upcoming Tasks */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Revenue Overview</h2>
              <p className="text-xs text-slate-500">Closed-won deal value over the past 6 months</p>
            </div>
            <Link href="/analytics" className="text-xs font-semibold text-blue-600 hover:underline">
              Full analytics →
            </Link>
          </div>

          <div className="mt-6 grid h-56 grid-cols-6 items-end gap-2 border-b border-slate-100 pb-3 sm:gap-3">
            {monthlyRevenue.map((item) => {
              const pct = Math.max(6, Math.round((item.revenue / maxRevenue) * 100));
              return (
                <div key={item.month} className="flex h-full min-w-0 flex-col items-center justify-end gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {item.revenue > 0 ? `$${Math.round(item.revenue / 1000)}k` : "$0"}
                  </span>
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[44px] rounded-t-md bg-blue-600 transition-all hover:bg-blue-700"
                      style={{ height: `${item.revenue > 0 ? pct : 4}%`, opacity: item.revenue > 0 ? 1 : 0.2 }}
                      title={`${item.month}: ${formatUsd(item.revenue)} (${item.dealsWon} won)`}
                    />
                  </div>
                  <span className="truncate text-[10px] font-medium text-slate-500 sm:text-[11px]">{item.month}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Total won revenue: {formatUsd(kpis.totalWonRevenue)}</span>
            <span>Source: Live PostgreSQL `deals` table</span>
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Tasks</h2>
              <p className="text-xs text-slate-500">Next pending calls, meetings and follow-ups</p>
            </div>
            <Link href="/activities" className="text-xs font-semibold text-blue-600 hover:underline">
              All tasks →
            </Link>
          </div>

          {upcomingTasks.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              All tasks are completed. Create a new follow-up from Activities.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => void toggleTask(task.id)}
                    aria-label={`Mark "${task.title}" completed`}
                    className="mt-0.5 text-slate-400 transition hover:text-emerald-600"
                  >
                    <Circle className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {task.dealTitle || task.contactName || task.ownerName} · Due {formatShortDate(task.dueAt)}
                    </p>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                    {task.type.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent Activity Log */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Activities</h2>
            <p className="text-xs text-slate-500">Latest communication and workflow updates across the team</p>
          </div>
          <Link href="/activities" className="text-xs font-semibold text-blue-600 hover:underline">
            Log activity →
          </Link>
        </div>

        <ul className="mt-4 divide-y divide-slate-100">
          {recentActivities.map((act) => (
            <li key={act.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <ActivityIcon type={act.type} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{act.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {act.ownerName}
                    {act.contactName ? ` · ${act.contactName}` : ""}
                    {act.dealTitle ? ` · ${act.dealTitle}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                {act.status === "completed" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                    Pending
                  </span>
                )}
                <span className="text-slate-400">{formatShortDate(act.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
