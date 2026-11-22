"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  FolderKanban,
  Layers,
  ShieldAlert,
} from "lucide-react";
import {
  MILESTONE_STATUS_META,
  PROJECT_STATUS_META,
  STAGE_META,
  type MilestoneStatus,
  type ProjectStatus,
  type TaskStage,
} from "@/lib/constants";
import type { DashboardMetrics } from "@/lib/analytics";

type ActivityItem = {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityTitle: string;
  detail: string;
  createdAt: string;
};

type DashboardResponse = DashboardMetrics & {
  activityLogs: ActivityItem[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load dashboard metrics.");
      const json = (await res.json()) as DashboardResponse;
      setData(json);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-zinc-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-[#e6e6ee] rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-white border border-[#e6e6ee] rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error || "Unable to load ProjectOS dashboard."}
      </div>
    );
  }

  const { kpis, projectAnalytics, upcomingMilestones, blockedTasks, activityLogs } = data;

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[#7c3aed]">
            Portfolio Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#18181b] mt-1">
            Project Delivery Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Live milestone velocity, task completion, dependency health, and budget burn across
            client programs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/board"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e6e6ee] bg-white hover:bg-zinc-50 px-3.5 py-2 text-sm font-medium text-[#18181b] transition-colors"
          >
            <FolderKanban className="h-4 w-4 text-[#7c3aed]" />
            <span>Open Kanban</span>
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
          >
            <span>Projects & Reports</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Active Projects</span>
            <span className="h-8 w-8 rounded-lg bg-violet-50 text-[#7c3aed] flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-[#18181b]">
            {kpis.activeProjects}
            <span className="text-sm font-normal text-zinc-400"> / {kpis.totalProjects}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">In active studio delivery</div>
        </div>

        <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Tasks Completed</span>
            <span className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-[#18181b]">
            {kpis.tasksCompletedPct}%
          </div>
          <div className="mt-1 text-xs text-zinc-500 tabular-nums">
            {kpis.completedTasks} of {kpis.totalTasks} tasks done
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Logged vs Budget</span>
            <span className="h-8 w-8 rounded-lg bg-violet-50 text-[#7c3aed] flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-[#18181b]">
            {kpis.loggedHours}h
            <span className="text-sm font-normal text-zinc-400"> / {kpis.budgetHours}h</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500 tabular-nums">
            {kpis.hoursUtilizationPct}% budget burn ({kpis.billableHours}h billable)
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Milestones Complete</span>
            <span className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Flag className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-[#18181b]">
            {kpis.milestonesCompleted}
            <span className="text-sm font-normal text-zinc-400"> / {kpis.milestonesTotal}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">Client sign-off checkpoints</div>
        </div>

        <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Blocked Dependencies</span>
            <span
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                kpis.blockedDependencies > 0
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-[#18181b]">
            {kpis.blockedDependencies}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {kpis.blockedDependencies > 0
              ? "Waiting on prerequisite tasks"
              : "All task chains clear"}
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Progress Analytics Bar Chart per Project */}
        <section className="xl:col-span-2 rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#efeff5]">
            <div>
              <h2 className="text-base font-semibold text-[#18181b]">
                Project Progress & Budget Analytics
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Task completion velocity compared against hours burned per client program.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />
                Task Progress %
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                Budget Burn %
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {projectAnalytics.map((p) => {
              const statusMeta =
                PROJECT_STATUS_META[p.status as ProjectStatus] ?? PROJECT_STATUS_META.active;
              return (
                <div key={p.projectId} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-semibold text-[#7c3aed] bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md shrink-0">
                        {p.code}
                      </span>
                      <span className="text-sm font-medium text-[#18181b] truncate">{p.name}</span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 tabular-nums shrink-0">
                      {p.completedTasks}/{p.totalTasks} tasks · {p.loggedHours}h/{p.budgetHours}h
                    </div>
                  </div>

                  {/* Dual horizontal progress bars */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-[11px] text-zinc-500 shrink-0">Delivery</span>
                      <div className="flex-1 h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#7c3aed] transition-all duration-300"
                          style={{ width: `${Math.min(100, p.completionPct)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-medium tabular-nums text-[#18181b]">
                        {p.completionPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-[11px] text-zinc-500 shrink-0">Hours</span>
                      <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            p.budgetUtilizationPct > 90 ? "bg-rose-500" : "bg-zinc-800"
                          }`}
                          style={{ width: `${Math.min(100, p.budgetUtilizationPct)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-medium tabular-nums text-zinc-600">
                        {p.budgetUtilizationPct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Upcoming Milestones */}
        <section className="rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs min-w-0 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#efeff5]">
            <div>
              <h2 className="text-base font-semibold text-[#18181b]">Upcoming Milestones</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Next scheduled delivery gates</p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9]"
            >
              Manage
            </Link>
          </div>

          <div className="mt-4 space-y-3 flex-1">
            {upcomingMilestones.length === 0 ? (
              <div className="text-xs text-zinc-500 py-6 text-center">
                All milestones are completed.
              </div>
            ) : (
              upcomingMilestones.map((m) => {
                const badge =
                  MILESTONE_STATUS_META[m.status as MilestoneStatus] ??
                  MILESTONE_STATUS_META.upcoming;
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-[#ececf3] bg-[#fafafe] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-[#7c3aed]">
                        {m.projectCode}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-[#18181b] leading-snug">{m.title}</div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="tabular-nums">Due {m.dueDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Bottom Row: Blocked Dependencies + Activity History Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Blocked Dependencies Watchlist */}
        <section className="rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs min-w-0">
          <div className="flex items-center justify-between pb-4 border-b border-[#efeff5]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold text-[#18181b]">
                Blocked Dependency Watchlist
              </h2>
            </div>
            <Link href="/board" className="text-xs font-medium text-[#7c3aed] hover:text-[#6d28d9]">
              Resolve on Board
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {blockedTasks.length === 0 ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
                Zero blocked dependencies — every downstream task has its prerequisite completed.
              </div>
            ) : (
              blockedTasks.map((bt) => {
                const prereqLabel =
                  STAGE_META[bt.prerequisiteStage as TaskStage]?.label ?? bt.prerequisiteStage;
                return (
                  <div
                    key={bt.id}
                    className="rounded-xl border border-amber-200/80 bg-amber-50/45 p-3.5 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {bt.projectCode}
                      </span>
                      <span className="text-xs text-zinc-600">Owner: {bt.assigneeName}</span>
                    </div>
                    <div className="text-sm font-medium text-[#18181b]">{bt.title}</div>
                    <div className="text-xs text-amber-800 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Waiting on <strong>{bt.prerequisiteTitle}</strong> ({prereqLabel})
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Activity History Feed */}
        <section className="rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs min-w-0">
          <div className="flex items-center justify-between pb-4 border-b border-[#efeff5]">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#7c3aed]" />
              <h2 className="text-base font-semibold text-[#18181b]">Recent Activity History</h2>
            </div>
            <span className="text-xs text-zinc-400">Live PostgreSQL audit log</span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f0f6]">
            {activityLogs.map((log) => (
              <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-violet-100 text-[#7c3aed] flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                  {log.actorName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[#18181b]">
                    <span className="font-medium">{log.actorName}</span>{" "}
                    <span className="text-zinc-500">{log.action.replace(/_/g, " ")}</span>{" "}
                    <span className="font-medium">{log.entityTitle}</span>
                  </div>
                  {log.detail && <div className="text-xs text-zinc-500 mt-0.5">{log.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
