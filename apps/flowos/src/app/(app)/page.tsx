"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  GitBranch,
  Play,
  ShieldAlert,
  Sparkles,
  Workflow,
  XCircle,
} from "lucide-react";
import { RunStatusBadge, TriggerTypeBadge } from "@/components/StatusBadge";

type DashboardData = {
  kpis: {
    activeWorkflows: number;
    totalWorkflows: number;
    totalRuns: number;
    successRate: number;
    pendingApprovals: number;
    failedRuns: number;
    enabledIntegrations: number;
  };
  chart: Array<{
    dateKey: string;
    label: string;
    completed: number;
    awaiting: number;
    failed: number;
    total: number;
  }>;
  pendingApprovals: Array<{
    id: string;
    workflowId: string;
    workflowName: string;
    approvalPrompt: string | null;
    startedAt: string;
    outputJson: Record<string, unknown>;
  }>;
  recentRuns: Array<{
    id: string;
    workflowId: string;
    workflowName: string;
    status: string;
    triggerType: string;
    durationMs: number;
    retryCount: number;
    startedAt: string;
  }>;
  perWorkflow: Array<{
    id: string;
    name: string;
    category: string;
    triggerType: string;
    active: boolean;
    nodeCount: number;
    totalRuns: number;
    completedRuns: number;
    pendingApprovals: number;
    failedRuns: number;
    avgDurationMs: number;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as DashboardData;
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleQuickDecision(runId: string, decision: "approve" | "reject") {
    setBusyId(runId);
    setNotice(null);
    try {
      const res = await fetch(`/api/runs/${runId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          note:
            decision === "approve"
              ? "Approved from FlowOS Dashboard."
              : "Rejected from FlowOS Dashboard.",
        }),
      });
      const json = (await res.json()) as { run?: { status: string }; error?: string };
      if (!res.ok) {
        setNotice(json.error || "Failed to update approval.");
      } else {
        setNotice(
          decision === "approve"
            ? `Run approved and resumed -> status: ${json.run?.status ?? "completed"}.`
            : "Run rejected — downstream external dispatch blocked.",
        );
        await load();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleQuickRun(workflowId: string, workflowName: string) {
    setBusyId(workflowId);
    setNotice(null);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { run?: { status: string }; error?: string };
      if (!res.ok) {
        setNotice(json.error || "Execution failed.");
      } else {
        setNotice(
          `Executed "${workflowName}" -> ${
            json.run?.status === "awaiting_approval"
              ? "Paused at Human Approval Gate"
              : json.run?.status
          }.`,
        );
        await load();
      }
    } finally {
      setBusyId(null);
    }
  }

  const maxChartTotal = Math.max(1, ...(data?.chart.map((c) => c.total) || [1]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7c3aed] mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Automation Control Plane</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141024]">
            FlowOS Dashboard
          </h1>
          <p className="text-sm text-[#5b5575] mt-1">
            Monitor deterministic AI pipelines, inspect live execution health, and approve gated
            outbound actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 rounded-xl border border-[#dad4ec] bg-white hover:bg-[#f3efff] text-[#2a2244] text-sm font-semibold px-4 py-2.5 transition"
          >
            Browse Templates
          </Link>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold px-4 py-2.5 transition shadow-md shadow-violet-600/20"
          >
            <GitBranch className="h-4 w-4" />
            <span>Open Visual Editor</span>
          </Link>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-[#0c0a16] text-violet-100 border border-violet-500/30 px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs text-violet-300 hover:text-white shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-[#e5e1f2] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#665f82]">
              Active Workflows
            </span>
            <div className="h-9 w-9 rounded-xl bg-violet-100 text-[#7c3aed] flex items-center justify-center">
              <Workflow className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-[#141024]">
            {loading ? "—" : data?.kpis.activeWorkflows ?? 0}
          </div>
          <p className="text-xs text-[#6b6487] mt-1">
            {data?.kpis.totalWorkflows ?? 0} total pipelines configured
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#e5e1f2] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#665f82]">
              Total Runs
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-[#141024]">
            {loading ? "—" : data?.kpis.totalRuns ?? 0}
          </div>
          <p className="text-xs text-[#6b6487] mt-1">
            {data?.kpis.failedRuns ?? 0} failed (retryable)
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#e5e1f2] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#665f82]">
              Success Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-[#141024]">
            {loading ? "—" : `${data?.kpis.successRate ?? 100}%`}
          </div>
          <p className="text-xs text-[#6b6487] mt-1">Across finalized runs</p>
        </div>

        <div className="rounded-2xl bg-[#0c0a16] text-white border border-[#2c244a] p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Pending Approvals
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-white">
            {loading ? "—" : data?.kpis.pendingApprovals ?? 0}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Paused safely before external dispatch
          </p>
        </div>
      </div>

      {/* Middle Section: Execution Analytics Chart + Pending Approvals */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Execution Analytics Chart */}
        <section className="xl:col-span-7 rounded-2xl bg-white border border-[#e5e1f2] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-bold text-[#141024]">Execution Analytics (7 Days)</h2>
              <p className="text-xs text-[#665f82]">
                Run volume grouped by completed, awaiting approval, and failed states.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#5b5575]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#7c3aed]" /> Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-amber-400" /> Awaiting
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-rose-500" /> Failed
              </span>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-1 border-b border-[#ece8f7]">
            {(data?.chart || []).map((day) => {
              const barPct = Math.max(8, Math.round((day.total / maxChartTotal) * 100));
              const compPct = day.total > 0 ? (day.completed / day.total) * 100 : 0;
              const waitPct = day.total > 0 ? (day.awaiting / day.total) * 100 : 0;
              const failPct = day.total > 0 ? (day.failed / day.total) * 100 : 0;

              return (
                <div key={day.dateKey} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-semibold text-[#5b5575]">{day.total}</span>
                  <div
                    className="w-full max-w-[44px] rounded-t-lg overflow-hidden bg-[#f2eefb] flex flex-col justify-end transition-all"
                    style={{ height: `${day.total === 0 ? 10 : barPct}%` }}
                    title={`${day.label}: ${day.completed} completed, ${day.awaiting} awaiting, ${day.failed} failed`}
                  >
                    {day.failed > 0 && (
                      <div className="w-full bg-rose-500" style={{ height: `${failPct}%` }} />
                    )}
                    {day.awaiting > 0 && (
                      <div className="w-full bg-amber-400" style={{ height: `${waitPct}%` }} />
                    )}
                    {day.completed > 0 && (
                      <div className="w-full bg-[#7c3aed]" style={{ height: `${compPct}%` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 sm:gap-4 mt-2 px-1">
            {(data?.chart || []).map((day) => (
              <div key={day.dateKey} className="flex-1 text-center text-xs font-medium text-[#665f82]">
                {day.label}
              </div>
            ))}
          </div>
        </section>

        {/* Pending Human Approvals Queue */}
        <section className="xl:col-span-5 rounded-2xl bg-white border border-[#e5e1f2] p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-[#141024]">Human Approval Queue</h2>
              <p className="text-xs text-[#665f82]">
                Mandatory safety gate before external webhook/email actions.
              </p>
            </div>
            <Link
              href="/runs?status=awaiting_approval"
              className="text-xs font-semibold text-[#7c3aed] hover:text-[#5b21b6] inline-flex items-center gap-1 shrink-0"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!data || data.pendingApprovals.length === 0 ? (
            <div className="flex-1 rounded-xl bg-[#f7f6fb] border border-dashed border-[#dad4ec] p-6 text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-[#141024]">All approval gates cleared</p>
              <p className="text-xs text-[#665f82] mt-1">
                Trigger any workflow below to inspect a live human-in-the-loop pause.
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-64 pr-0.5">
              {data.pendingApprovals.map((run) => {
                const preview = String(run.outputJson?.draftPreview || run.approvalPrompt || "");
                return (
                  <div
                    key={run.id}
                    className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#141024] truncate">
                          {run.workflowName}
                        </div>
                        <p className="text-xs text-[#5b5575] line-clamp-2 mt-0.5">{preview}</p>
                      </div>
                      <RunStatusBadge status="awaiting_approval" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === run.id}
                        onClick={() => handleQuickDecision(run.id, "approve")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 transition cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve & Resume
                      </button>
                      <button
                        type="button"
                        disabled={busyId === run.id}
                        onClick={() => handleQuickDecision(run.id, "reject")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-1.5 transition cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                      <Link
                        href={`/runs?runId=${run.id}`}
                        className="text-xs font-medium text-[#5b5575] hover:text-[#7c3aed] ml-auto"
                      >
                        Inspect Trace
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Bottom Section: Active Workflows + Recent Runs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Active Workflows Quick Trigger */}
        <section className="xl:col-span-5 rounded-2xl bg-white border border-[#e5e1f2] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#141024]">Active Workflows</h2>
            <Link
              href="/editor"
              className="text-xs font-semibold text-[#7c3aed] hover:text-[#5b21b6]"
            >
              Manage All
            </Link>
          </div>
          <div className="space-y-2.5">
            {(data?.perWorkflow || []).map((wf) => (
              <div
                key={wf.id}
                className="rounded-xl border border-[#ece8f7] hover:border-[#c9b8f9] bg-[#fbfafe] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/editor/${wf.id}`}
                      className="text-sm font-semibold text-[#141024] hover:text-[#7c3aed] truncate"
                    >
                      {wf.name}
                    </Link>
                    <TriggerTypeBadge triggerType={wf.triggerType} />
                  </div>
                  <div className="text-xs text-[#665f82] mt-1 flex items-center gap-3 flex-wrap">
                    <span>{wf.nodeCount} nodes</span>
                    <span>•</span>
                    <span>{wf.totalRuns} runs</span>
                    <span>•</span>
                    <span>{wf.avgDurationMs}ms avg</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === wf.id}
                    onClick={() => handleQuickRun(wf.id, wf.name)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0c0a16] hover:bg-[#7c3aed] text-white text-xs font-semibold px-3 py-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" />
                    {busyId === wf.id ? "Running..." : "Run"}
                  </button>
                  <Link
                    href={`/editor/${wf.id}`}
                    className="rounded-lg border border-[#dad4ec] bg-white hover:bg-[#f3efff] text-[#332c4d] text-xs font-semibold px-2.5 py-1.5 transition"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Runs Table */}
        <section className="xl:col-span-7 rounded-2xl bg-white border border-[#e5e1f2] p-5 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#141024]">Recent Executions</h2>
            <Link
              href="/runs"
              className="text-xs font-semibold text-[#7c3aed] hover:text-[#5b21b6] inline-flex items-center gap-1"
            >
              Execution History <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-[#ece8f7] text-[11px] font-semibold uppercase tracking-wider text-[#746c91]">
                  <th className="py-2.5 pr-3">Workflow</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Trigger</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 pl-3 text-right">Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eef9] text-sm">
                {(data?.recentRuns || []).map((run) => (
                  <tr key={run.id} className="hover:bg-[#faf8ff] transition">
                    <td className="py-3 pr-3 font-medium text-[#141024] max-w-[220px] truncate">
                      {run.workflowName}
                    </td>
                    <td className="py-3 px-3">
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td className="py-3 px-3">
                      <TriggerTypeBadge triggerType={run.triggerType} />
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-[#5b5575]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {run.durationMs}ms
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <Link
                        href={`/runs?runId=${run.id}`}
                        className="text-xs font-semibold text-[#7c3aed] hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
