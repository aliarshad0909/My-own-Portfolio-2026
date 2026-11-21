"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { RunStatusBadge, TriggerTypeBadge } from "@/components/StatusBadge";

type WorkflowOption = {
  id: string;
  name: string;
  triggerType: string;
  samplePayload: Record<string, unknown>;
};

type RunSummary = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  triggerType: string;
  triggerPayload: Record<string, unknown>;
  outputJson: Record<string, unknown>;
  approvalPrompt: string | null;
  approvedBy: string | null;
  approvalNote: string | null;
  retryCount: number;
  durationMs: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
};

type RunStepRecord = {
  id: string;
  stepOrder: number;
  nodeId: string;
  nodeType: string;
  label: string;
  status: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown>;
  durationMs: number;
  errorMessage: string | null;
  executedAt: string;
};

const FILTERS = [
  { key: "all", label: "All Runs" },
  { key: "awaiting_approval", label: "Awaiting Approval" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
  { key: "rejected", label: "Rejected" },
];

function RunsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const initialRunId = searchParams.get("runId");

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunSummary | null>(null);
  const [steps, setSteps] = useState<RunStepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Trigger modal
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [triggerWfId, setTriggerWfId] = useState("");
  const [triggerPayloadText, setTriggerPayloadText] = useState("{}");
  const [simulateFailure, setSimulateFailure] = useState(false);

  const loadRunDetail = useCallback(async (runId: string) => {
    const res = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { run: RunSummary; steps: RunStepRecord[] };
    setSelectedRun(json.run);
    setSteps(json.steps);
  }, []);

  const loadList = useCallback(
    async (keepRunId?: string | null) => {
      try {
        const [runsRes, wfRes] = await Promise.all([
          fetch(`/api/runs?status=${encodeURIComponent(statusFilter)}`, { cache: "no-store" }),
          fetch("/api/workflows", { cache: "no-store" }),
        ]);
        if (runsRes.ok) {
          const rJson = (await runsRes.json()) as { runs: RunSummary[] };
          setRuns(rJson.runs);
          const targetId =
            keepRunId ||
            initialRunId ||
            (rJson.runs[0]?.id ?? null);
          if (targetId && rJson.runs.some((r) => r.id === targetId)) {
            await loadRunDetail(targetId);
          } else if (rJson.runs[0]) {
            await loadRunDetail(rJson.runs[0].id);
          } else {
            setSelectedRun(null);
            setSteps([]);
          }
        }
        if (wfRes.ok) {
          const wJson = (await wfRes.json()) as { workflows: WorkflowOption[] };
          setWorkflows(wJson.workflows);
          if (!triggerWfId && wJson.workflows[0]) {
            setTriggerWfId(wJson.workflows[0].id);
            setTriggerPayloadText(JSON.stringify(wJson.workflows[0].samplePayload || {}, null, 2));
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [initialRunId, loadRunDetail, statusFilter, triggerWfId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadList();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadList]);

  async function handleApproval(decision: "approve" | "reject") {
    if (!selectedRun) return;
    setActionBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/runs/${selectedRun.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          note:
            approvalNote.trim() ||
            (decision === "approve"
              ? "Approved via FlowOS Runs Inspector."
              : "Rejected via FlowOS Runs Inspector."),
        }),
      });
      const json = (await res.json()) as { run?: RunSummary; steps?: RunStepRecord[]; error?: string };
      if (!res.ok || !json.run) {
        setNotice(json.error || "Approval action failed.");
      } else {
        setSelectedRun(json.run);
        setSteps(json.steps || []);
        setApprovalNote("");
        setNotice(
          decision === "approve"
            ? `Run approved and resumed -> final status: ${json.run.status}.`
            : "Run rejected — downstream external actions were blocked.",
        );
        await loadList(json.run.id);
      }
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRetry() {
    if (!selectedRun) return;
    setActionBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/runs/${selectedRun.id}/retry`, { method: "POST" });
      const json = (await res.json()) as { run?: RunSummary; steps?: RunStepRecord[]; error?: string };
      if (!res.ok || !json.run) {
        setNotice(json.error || "Retry failed.");
      } else {
        setSelectedRun(json.run);
        setSteps(json.steps || []);
        setNotice(
          `Retry #${json.run.retryCount} executed -> status: ${json.run.status}.`,
        );
        await loadList(json.run.id);
      }
    } finally {
      setActionBusy(false);
    }
  }

  async function handleTriggerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!triggerWfId) return;
    let payloadObj: Record<string, unknown> = {};
    try {
      payloadObj = JSON.parse(triggerPayloadText || "{}") as Record<string, unknown>;
    } catch {
      setNotice("Trigger payload must be valid JSON.");
      return;
    }
    if (simulateFailure) {
      payloadObj._simulateHttpFailure = true;
    }

    setActionBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/workflows/${triggerWfId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: payloadObj }),
      });
      const json = (await res.json()) as { run?: RunSummary; steps?: RunStepRecord[]; error?: string };
      if (!res.ok || !json.run) {
        setNotice(json.error || "Unable to trigger workflow.");
      } else {
        setTriggerOpen(false);
        setSimulateFailure(false);
        setStatusFilter("all");
        setSelectedRun(json.run);
        setSteps(json.steps || []);
        setNotice(`Triggered "${json.run.workflowName}" -> status: ${json.run.status}.`);
        await loadList(json.run.id);
      }
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#141024]">
            Execution History &amp; Approvals
          </h1>
          <p className="text-sm text-[#5b5575] mt-0.5">
            Trigger custom JSON runs, inspect per-step inputs/outputs, approve gated runs, and retry
            failures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void loadList(selectedRun?.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#dad4ec] bg-white hover:bg-[#f3efff] text-[#332c4d] text-xs font-semibold px-3.5 py-2.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setTriggerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold px-4 py-2.5 shadow-md shadow-violet-600/20 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            Trigger Workflow
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-[#0c0a16] text-violet-100 border border-violet-500/30 px-4 py-3 text-xs flex items-center justify-between gap-2">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-violet-300 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer border ${
              statusFilter === f.key
                ? "bg-[#0c0a16] text-white border-[#0c0a16]"
                : "bg-white text-[#473f66] border-[#e2dcf2] hover:border-[#7c3aed]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Run List */}
        <section className="xl:col-span-5 rounded-2xl bg-white border border-[#e5e1f2] p-4 space-y-2.5 max-h-[760px] overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-[#665f82] px-1">
            Runs ({runs.length})
          </div>
          {loading ? (
            <div className="py-12 text-center text-sm text-[#665f82]">Loading runs...</div>
          ) : runs.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#665f82]">
              No runs match this filter.
            </div>
          ) : (
            runs.map((run) => {
              const active = selectedRun?.id === run.id;
              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => void loadRunDetail(run.id)}
                  className={`w-full text-left rounded-xl p-3.5 border transition cursor-pointer ${
                    active
                      ? "bg-[#f4f0ff] border-[#7c3aed] shadow-xs"
                      : "bg-[#fbfafe] border-[#ece8f7] hover:border-[#c9b8f9]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-[#141024] truncate">
                      {run.workflowName}
                    </div>
                    <RunStatusBadge status={run.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#665f82]">
                    <TriggerTypeBadge triggerType={run.triggerType} />
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" /> {run.durationMs}ms
                    </span>
                    {run.retryCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold">
                        Retry #{run.retryCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </section>

        {/* Step-by-Step Inspector */}
        <section className="xl:col-span-7 rounded-2xl bg-white border border-[#e5e1f2] p-5 sm:p-6 min-w-0 space-y-5">
          {!selectedRun ? (
            <div className="py-16 text-center text-sm text-[#665f82]">
              Select a workflow run to inspect step-by-step inputs, outputs, and approval gates.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#ece8f7]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-[#141024]">{selectedRun.workflowName}</h2>
                    <RunStatusBadge status={selectedRun.status} />
                  </div>
                  <div className="text-xs font-mono text-[#665f82] mt-1 break-all">
                    Run ID: {selectedRun.id} • Duration: {selectedRun.durationMs}ms • Retries:{" "}
                    {selectedRun.retryCount}
                  </div>
                </div>
                <Link
                  href={`/editor/${selectedRun.workflowId}`}
                  className="text-xs font-semibold text-[#7c3aed] hover:underline shrink-0"
                >
                  Open in Editor
                </Link>
              </div>

              {/* Mandatory Human Approval Gate Banner */}
              {selectedRun.status === "awaiting_approval" && (
                <div className="rounded-2xl bg-[#0c0a16] text-white border-2 border-amber-400/70 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Human Approval Gate — Execution Paused</span>
                  </div>
                  <p className="text-sm text-slate-200">
                    {selectedRun.approvalPrompt ||
                      "Operator approval is required before resuming downstream outbound nodes."}
                  </p>
                  {Boolean(selectedRun.outputJson?.draftPreview) && (
                    <div className="rounded-xl bg-[#18132d] border border-[#312854] p-3 text-xs text-violet-100 font-mono whitespace-pre-wrap break-words">
                      {String(selectedRun.outputJson.draftPreview)}
                    </div>
                  )}
                  <input
                    type="text"
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Optional audit note (e.g. Verified CRM record & draft copy)..."
                    className="w-full rounded-xl bg-[#18132d] border border-[#352b5c] text-white placeholder:text-slate-400 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => void handleApproval("approve")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve &amp; Resume Execution
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => void handleApproval("reject")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-400/50 text-rose-200 text-xs font-semibold px-4 py-2.5 transition cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject &amp; Block Dispatch
                    </button>
                  </div>
                </div>
              )}

              {/* Retry Failed Run Banner */}
              {selectedRun.status === "failed" && (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-700">
                      Execution Failed
                    </div>
                    <p className="text-xs text-rose-900 mt-1 break-words">
                      {selectedRun.errorMessage || "A node encountered a downstream error."}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleRetry()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry Failed Run
                  </button>
                </div>
              )}

              {/* Step Trace Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#665f82]">
                  <Activity className="h-3.5 w-3.5 text-[#7c3aed]" />
                  <span>Step Execution Trace ({steps.length} steps)</span>
                </div>

                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-xl border border-[#e5e1f2] bg-[#fbfafe] p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-6 w-6 rounded-lg bg-[#0c0a16] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {step.stepOrder}
                        </span>
                        <span className="font-semibold text-sm text-[#141024] truncate">
                          {step.label}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-100 text-violet-800">
                          {step.nodeType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#665f82]">
                          {step.durationMs}ms
                        </span>
                        <RunStatusBadge status={step.status} />
                      </div>
                    </div>

                    {step.errorMessage && (
                      <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
                        {step.errorMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#746c91] mb-1">
                          Input Context
                        </div>
                        <pre className="rounded-lg bg-white border border-[#e8e4f5] p-2.5 text-[11px] font-mono text-[#2e2647] overflow-x-auto max-h-40">
                          {JSON.stringify(step.inputJson, null, 2)}
                        </pre>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#746c91] mb-1">
                          Step Output
                        </div>
                        <pre className="rounded-lg bg-[#0c0a16] text-violet-100 p-2.5 text-[11px] font-mono overflow-x-auto max-h-40">
                          {JSON.stringify(step.outputJson, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Trigger Workflow Modal */}
      {triggerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleTriggerSubmit}
            className="w-full max-w-lg rounded-2xl bg-white border border-[#e5e1f2] shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#141024]">Trigger Workflow with JSON</h3>
              <button
                type="button"
                onClick={() => setTriggerOpen(false)}
                className="text-xs font-semibold text-[#5b5575]"
              >
                Close
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#332c4d] mb-1">
                Select Workflow
              </label>
              <select
                value={triggerWfId}
                onChange={(e) => {
                  setTriggerWfId(e.target.value);
                  const found = workflows.find((w) => w.id === e.target.value);
                  if (found) {
                    setTriggerPayloadText(JSON.stringify(found.samplePayload || {}, null, 2));
                  }
                }}
                className="w-full rounded-xl border border-[#dad4ec] bg-[#faf9fd] px-3 py-2 text-sm"
              >
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#332c4d] mb-1">
                Custom Trigger JSON Payload
              </label>
              <textarea
                rows={8}
                value={triggerPayloadText}
                onChange={(e) => setTriggerPayloadText(e.target.value)}
                className="w-full rounded-xl bg-[#0c0a16] text-violet-100 font-mono text-xs p-3.5 border border-[#2a2245]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[#473f66]">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
              />
              Simulate transient HTTP 503 failure on final dispatch (to test Retry)
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTriggerOpen(false)}
                className="rounded-xl border border-[#dad4ec] px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionBusy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                {actionBusy ? "Running..." : "Execute Run"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function RunsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl bg-white border border-[#e5e1f2] p-10 text-center text-sm text-[#5b5575]">
          Loading Execution History...
        </div>
      }
    >
      <RunsContent />
    </Suspense>
  );
}
