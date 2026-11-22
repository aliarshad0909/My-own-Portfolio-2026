"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  FileText,
  Flag,
  Lock,
  ShieldCheck,
} from "lucide-react";
import {
  MILESTONE_STATUS_META,
  PROJECT_STATUS_META,
  STAGE_META,
  type MilestoneStatus,
  type ProjectStatus,
  type TaskStage,
} from "@/lib/constants";

type ClientPortalProject = {
  id: string;
  code: string;
  name: string;
  clientName: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
  budgetHours: number;
  hoursUtilized: number;
  budgetUtilizationPct: number;
  milestoneProgressPct: number;
  deliverablesProgressPct: number;
  completedMilestones: number;
  totalMilestones: number;
  completedDeliverables: number;
  totalDeliverables: number;
  milestones: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: MilestoneStatus;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    stage: TaskStage;
    priority: string;
    dueDate: string;
    deliverableFile: string | null;
    completed: boolean;
  }>;
};

export default function ClientPortalViewPage() {
  const [projects, setProjects] = useState<ClientPortalProject[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/client-portal", { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load client portal.");
      const json = (await res.json()) as { projects: ClientPortalProject[] };
      setProjects(json.projects);
      setSelectedId((prev) =>
        prev && json.projects.some((p) => p.id === prev) ? prev : json.projects[0]?.id ?? "",
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client portal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const activeProject = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;

  return (
    <div className="space-y-6 min-w-0">
      {/* Sanitized Read-Only Client Banner */}
      <div className="rounded-2xl bg-[#18181b] text-white p-5 sm:p-6 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 px-2.5 py-0.5 text-[11px] font-medium text-violet-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Read-Only Client Stakeholder Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Client-Facing Delivery Status
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Internal team comments, cost notes, and workspace admin controls are automatically
            stripped from this stakeholder view.
          </p>
        </div>

        <div className="shrink-0">
          <label htmlFor="client-project-picker" className="sr-only">
            Select client project
          </label>
          <select
            id="client-project-picker"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full md:w-72 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-[#8b5cf6]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-96 bg-white rounded-2xl border border-[#e6e6ee] animate-pulse" />
      ) : !activeProject ? (
        <div className="rounded-2xl bg-white border border-[#e6e6ee] p-8 text-center text-sm text-zinc-500">
          No projects currently have Client Portal access enabled. Enable Client Portal on any
          project under Projects & Milestones.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Project Overview */}
          <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#7c3aed] bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
                    {activeProject.code}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    {activeProject.clientName}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                      (PROJECT_STATUS_META[activeProject.status] ?? PROJECT_STATUS_META.active)
                        .badgeClass
                    }`}
                  >
                    {(PROJECT_STATUS_META[activeProject.status] ?? PROJECT_STATUS_META.active).label}
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-[#18181b]">{activeProject.name}</h2>
                <p className="mt-1 text-sm text-zinc-600 max-w-2xl">{activeProject.description}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#f8f8fb] border border-[#e6e6ee] px-3 py-2 text-xs text-zinc-600 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-[#7c3aed]" />
                <span className="tabular-nums">
                  {activeProject.startDate} → {activeProject.targetDate}
                </span>
              </div>
            </div>

            {/* 4 Stakeholder KPI Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-4">
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-[#7c3aed]" />
                  Milestone Progress
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-[#18181b]">
                  {activeProject.milestoneProgressPct}%
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {activeProject.completedMilestones} of {activeProject.totalMilestones} gates signed
                  off
                </div>
              </div>

              <div className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-4">
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Deliverables Complete
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-[#18181b]">
                  {activeProject.deliverablesProgressPct}%
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {activeProject.completedDeliverables} of {activeProject.totalDeliverables} items
                  delivered
                </div>
              </div>

              <div className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-4">
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#7c3aed]" />
                  Hours Utilized
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-[#18181b]">
                  {activeProject.hoursUtilized}h
                  <span className="text-sm font-normal text-zinc-400">
                    {" "}
                    / {activeProject.budgetHours}h
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {activeProject.budgetUtilizationPct}% of retainer allocation
                </div>
              </div>

              <div className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-4">
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-zinc-500" />
                  Portal Privacy
                </div>
                <div className="mt-2 text-sm font-semibold text-[#18181b]">Read-Only Verified</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Internal threads & admin actions hidden
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Roadmap + Deliverables Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Milestone Roadmap */}
            <section className="lg:col-span-2 rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#efeff5] pb-3">
                <h3 className="text-base font-semibold text-[#18181b]">Milestone Roadmap</h3>
                <Eye className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="space-y-3">
                {activeProject.milestones.map((ms) => {
                  const badge =
                    MILESTONE_STATUS_META[ms.status] ?? MILESTONE_STATUS_META.upcoming;
                  return (
                    <div
                      key={ms.id}
                      className="rounded-xl border border-[#ececf4] bg-[#fafafe] p-3.5 flex items-start gap-3"
                    >
                      {ms.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#8b5cf6] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#18181b]">{ms.title}</div>
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                          <span className="text-zinc-500 tabular-nums">Target {ms.dueDate}</span>
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Deliverables Checklist */}
            <section className="lg:col-span-3 rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#efeff5] pb-3">
                <div>
                  <h3 className="text-base font-semibold text-[#18181b]">Deliverables Checklist</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Live completion status synchronized from studio delivery board.
                  </p>
                </div>
                <span className="text-xs font-medium text-[#7c3aed] tabular-nums">
                  {activeProject.completedDeliverables}/{activeProject.totalDeliverables} done
                </span>
              </div>

              <div className="divide-y divide-[#f0f0f6]">
                {activeProject.deliverables.map((item) => {
                  const stageMeta = STAGE_META[item.stage] ?? STAGE_META.todo;
                  return (
                    <div
                      key={item.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-medium ${
                              item.completed ? "text-zinc-500 line-through" : "text-[#18181b]"
                            }`}
                          >
                            {item.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            {item.dueDate && (
                              <span className="tabular-nums">Target {item.dueDate}</span>
                            )}
                            {item.deliverableFile && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 text-[#7c3aed] px-2 py-0.5 text-[11px] font-medium">
                                <FileText className="h-3 w-3" />
                                {item.deliverableFile}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 self-start sm:self-center ${stageMeta.badgeClass}`}
                      >
                        {stageMeta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
