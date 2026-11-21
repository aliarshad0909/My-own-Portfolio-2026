"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileBarChart2,
  Flag,
  Plus,
  Printer,
  Users,
  X,
} from "lucide-react";
import {
  MILESTONE_STATUS_META,
  PROJECT_STATUS_META,
  STAGE_META,
  type MilestoneStatus,
  type ProjectStatus,
  type TaskStage,
} from "@/lib/constants";
import type { ProjectAnalyticsSummary, ProjectReportPayload } from "@/lib/analytics";

type MilestoneItem = {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  status: MilestoneStatus;
};

type ProjectItem = {
  id: string;
  code: string;
  name: string;
  clientName: string;
  description: string;
  status: ProjectStatus;
  budgetHours: number;
  startDate: string;
  targetDate: string;
  clientPortalEnabled: boolean;
  metrics?: ProjectAnalyticsSummary;
  milestones: MilestoneItem[];
  assignedMembers: string[];
};

type TeamMemberItem = {
  id: string;
  name: string;
  roleTitle: string;
  avatarColor: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create project form
  const [code, setCode] = useState("PRJ-105");
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [budgetHours, setBudgetHours] = useState("140");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().slice(0, 10);
  });
  const [clientPortalEnabled, setClientPortalEnabled] = useState(true);
  const [submittingProject, setSubmittingProject] = useState(false);

  // Create milestone form
  const [msTitle, setMsTitle] = useState("");
  const [msDueDate, setMsDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [submittingMs, setSubmittingMs] = useState(false);

  // Project Report modal
  const [report, setReport] = useState<ProjectReportPayload | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load projects.");
      const json = (await res.json()) as {
        projects: ProjectItem[];
        teamMembers: TeamMemberItem[];
      };
      setProjects(json.projects);
      setTeamMembers(json.teamMembers);
      setSelectedId((prev) =>
        prev && json.projects.some((p) => p.id === prev) ? prev : json.projects[0]?.id ?? "",
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const selectedProject = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    setSubmittingProject(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          clientName,
          description,
          budgetHours: Number(budgetHours),
          startDate,
          targetDate,
          clientPortalEnabled,
        }),
      });
      const json = (await res.json()) as { project?: { id: string }; error?: string };
      if (!res.ok) {
        setError(json.error || "Could not create project.");
      } else {
        setShowCreateModal(false);
        setName("");
        setClientName("");
        setDescription("");
        setCode(`PRJ-${Math.floor(106 + Math.random() * 80)}`);
        if (json.project?.id) setSelectedId(json.project.id);
        await load();
      }
    } finally {
      setSubmittingProject(false);
    }
  }

  async function handleStatusChange(projectId: string, status: ProjectStatus) {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function handlePortalToggle(projectId: string, enabled: boolean) {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientPortalEnabled: enabled }),
    });
    await load();
  }

  async function handleAddMilestone(e: FormEvent) {
    e.preventDefault();
    if (!selectedProject || !msTitle.trim()) return;
    setSubmittingMs(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          title: msTitle.trim(),
          dueDate: msDueDate,
          status: "upcoming",
        }),
      });
      if (res.ok) {
        setMsTitle("");
        await load();
      }
    } finally {
      setSubmittingMs(false);
    }
  }

  async function handleCompleteMilestone(milestoneId: string, currentStatus: MilestoneStatus) {
    const nextStatus: MilestoneStatus = currentStatus === "completed" ? "in_progress" : "completed";
    await fetch(`/api/milestones/${milestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await load();
  }

  async function handleGenerateReport(projectId: string) {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/report`, { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { report: ProjectReportPayload };
        setReport(json.report);
      }
    } finally {
      setLoadingReport(false);
    }
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[#7c3aed]">
            Delivery Programs & Roadmaps
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#18181b] mt-1">
            Projects & Milestones
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Plan delivery timelines, sign off milestones in one click, and export live database
            progress reports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-4 py-2.5 shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-700 no-print">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-96 bg-white rounded-2xl border border-[#e6e6ee]" />
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-[#e6e6ee]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          {/* Left: Project Selector List */}
          <div className="space-y-3 min-w-0">
            {projects.map((project) => {
              const active = project.id === selectedProject?.id;
              const statusMeta =
                PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META.active;
              const completion = project.metrics?.completionPct ?? 0;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                    active
                      ? "bg-white border-[#7c3aed] ring-2 ring-[#8b5cf6]/20 shadow-sm"
                      : "bg-white border-[#e6e6ee] hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#7c3aed]">
                      {project.code}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[#18181b]">{project.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{project.clientName}</div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 tabular-nums">
                      <span>{completion}% tasks complete</span>
                      <span>
                        {project.metrics?.loggedHours ?? 0}h / {project.budgetHours}h
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#7c3aed]"
                        style={{ width: `${Math.min(100, completion)}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Selected Project Details, Timeline, Milestones & Report */}
          {selectedProject && (
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Project Overview Card */}
              <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#7c3aed] bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
                        {selectedProject.code}
                      </span>
                      <span className="text-xs text-zinc-500">{selectedProject.clientName}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-[#18181b]">
                      {selectedProject.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">{selectedProject.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleGenerateReport(selectedProject.id)}
                      disabled={loadingReport}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white text-xs font-medium px-3.5 py-2 transition-colors cursor-pointer"
                    >
                      <FileBarChart2 className="h-3.5 w-3.5 text-[#8b5cf6]" />
                      <span>{loadingReport ? "Building..." : "Generate Report"}</span>
                    </button>
                    <a
                      href={`/api/projects/${selectedProject.id}/report?format=csv`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6e6ee] bg-white hover:bg-zinc-50 text-xs font-medium text-[#18181b] px-3 py-2 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5 text-[#7c3aed]" />
                      <span>CSV</span>
                    </a>
                  </div>
                </div>

                {/* Controls Row: Status, Portal Visibility, Assigned Team */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#f0f0f6]">
                  <div>
                    <label
                      htmlFor="project-status-select"
                      className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1"
                    >
                      Program Status
                    </label>
                    <select
                      id="project-status-select"
                      value={selectedProject.status}
                      onChange={(e) =>
                        void handleStatusChange(selectedProject.id, e.target.value as ProjectStatus)
                      }
                      className="w-full rounded-xl border border-[#e6e6ee] bg-[#f8f8fb] px-3 py-2 text-xs font-medium text-[#18181b] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="active">Active</option>
                      <option value="at_risk">At Risk</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                      Client Portal Access
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handlePortalToggle(
                          selectedProject.id,
                          !selectedProject.clientPortalEnabled,
                        )
                      }
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        selectedProject.clientPortalEnabled
                          ? "bg-violet-50 border-violet-200 text-[#7c3aed]"
                          : "bg-zinc-50 border-zinc-200 text-zinc-600"
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>
                        {selectedProject.clientPortalEnabled ? "Portal Enabled" : "Portal Hidden"}
                      </span>
                    </button>
                  </div>

                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Assigned Squad
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(selectedProject.assignedMembers.length > 0
                        ? selectedProject.assignedMembers
                        : teamMembers.slice(0, 2).map((m) => m.name)
                      ).map((member) => (
                        <span
                          key={member}
                          className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-700 px-2.5 py-0.5 text-[11px] font-medium"
                        >
                          {member.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Visual Project Timeline */}
                <div className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#18181b] flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#7c3aed]" />
                      Project Timeline
                    </span>
                    <span className="font-mono text-zinc-500">
                      {selectedProject.startDate} → {selectedProject.targetDate}
                    </span>
                  </div>
                  <div className="mt-4 relative">
                    <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#8b5cf6]"
                        style={{
                          width: `${Math.min(100, selectedProject.metrics?.completionPct ?? 0)}%`,
                        }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {selectedProject.milestones.map((m) => (
                        <div
                          key={m.id}
                          className={`rounded-lg border px-3 py-2 text-xs ${
                            m.status === "completed"
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                              : m.status === "in_progress"
                                ? "bg-violet-50/70 border-violet-200 text-violet-900"
                                : "bg-white border-zinc-200 text-zinc-700"
                          }`}
                        >
                          <div className="font-medium truncate">{m.title}</div>
                          <div className="text-[11px] opacity-75 mt-0.5 tabular-nums">
                            {m.dueDate}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestones Management Panel */}
              <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-[#18181b] flex items-center gap-2">
                      <Flag className="h-4 w-4 text-[#7c3aed]" />
                      Milestones & Sign-Off Gates
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Add client checkpoints or complete milestones with a single click.
                    </p>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-zinc-500">
                    {selectedProject.milestones.filter((m) => m.status === "completed").length}/
                    {selectedProject.milestones.length} complete
                  </span>
                </div>

                {/* Add Milestone Form */}
                <form
                  onSubmit={(e) => void handleAddMilestone(e)}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-[#f8f8fb] p-3 rounded-xl border border-[#ececf4]"
                >
                  <input
                    type="text"
                    required
                    value={msTitle}
                    onChange={(e) => setMsTitle(e.target.value)}
                    placeholder="New milestone title (e.g. M4: UAT Client Sign-Off)"
                    className="sm:col-span-6 rounded-xl border border-[#e6e6ee] bg-white px-3 py-2 text-xs text-[#18181b] focus:outline-none focus:border-[#7c3aed]"
                  />
                  <input
                    type="date"
                    required
                    value={msDueDate}
                    onChange={(e) => setMsDueDate(e.target.value)}
                    className="sm:col-span-3 rounded-xl border border-[#e6e6ee] bg-white px-3 py-2 text-xs text-[#18181b] focus:outline-none focus:border-[#7c3aed]"
                  />
                  <button
                    type="submit"
                    disabled={submittingMs}
                    className="sm:col-span-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium px-3 py-2 cursor-pointer disabled:opacity-60"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Milestone</span>
                  </button>
                </form>

                {/* Milestone Rows */}
                <div className="divide-y divide-[#f0f0f6]">
                  {selectedProject.milestones.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-500">
                      No milestones created yet for this project.
                    </div>
                  ) : (
                    selectedProject.milestones.map((ms) => {
                      const badge =
                        MILESTONE_STATUS_META[ms.status] ?? MILESTONE_STATUS_META.upcoming;
                      const isDone = ms.status === "completed";
                      return (
                        <div
                          key={ms.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`h-4 w-4 shrink-0 ${
                                  isDone ? "text-emerald-600" : "text-zinc-300"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium ${
                                  isDone ? "line-through text-zinc-400" : "text-[#18181b]"
                                }`}
                              >
                                {ms.title}
                              </span>
                            </div>
                            <div className="mt-1 pl-6 flex items-center gap-2.5 text-xs text-zinc-500">
                              <span className="tabular-nums">Target {ms.dueDate}</span>
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => void handleCompleteMilestone(ms.id, ms.status)}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                              isDone
                                ? "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{isDone ? "Reopen" : "Complete Milestone"}</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable / Executive Project Report Modal */}
      {report && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#e6e6ee] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#ececf4] pb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#7c3aed]">
                  ProjectOS Delivery Report · {report.project.code}
                </div>
                <h2 className="text-xl font-semibold text-[#18181b] mt-1">
                  {report.project.name}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Client: {report.project.clientName} · Schedule: {report.project.startDate} to{" "}
                  {report.project.targetDate}
                </p>
              </div>
              <div className="flex items-center gap-2 no-print">
                <a
                  href={`/api/projects/${report.project.id}/report?format=csv`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6e6ee] px-3 py-1.5 text-xs font-medium text-[#18181b] hover:bg-zinc-50"
                >
                  <Download className="h-3.5 w-3.5 text-[#7c3aed]" />
                  Export CSV
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c3aed] text-white px-3 py-1.5 text-xs font-medium hover:bg-[#6d28d9] cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setReport(null)}
                  aria-label="Close report"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-3">
                <div className="text-[11px] text-zinc-500">Task Completion</div>
                <div className="text-lg font-semibold tabular-nums text-[#18181b] mt-0.5">
                  {report.summary.completionPct}%
                </div>
                <div className="text-[11px] text-zinc-500">
                  {report.summary.completedTasks}/{report.summary.totalTasks} tasks
                </div>
              </div>
              <div className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-3">
                <div className="text-[11px] text-zinc-500">Milestones</div>
                <div className="text-lg font-semibold tabular-nums text-[#18181b] mt-0.5">
                  {report.summary.completedMilestones}/{report.summary.totalMilestones}
                </div>
                <div className="text-[11px] text-zinc-500">Signed off</div>
              </div>
              <div className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-3">
                <div className="text-[11px] text-zinc-500">Hours Logged</div>
                <div className="text-lg font-semibold tabular-nums text-[#18181b] mt-0.5">
                  {report.summary.loggedHours}h
                </div>
                <div className="text-[11px] text-zinc-500">
                  {report.summary.billableHours}h billable
                </div>
              </div>
              <div className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-3">
                <div className="text-[11px] text-zinc-500">Budget Remaining</div>
                <div className="text-lg font-semibold tabular-nums text-[#18181b] mt-0.5">
                  {report.summary.budgetRemainingHours}h
                </div>
                <div className="text-[11px] text-zinc-500">
                  {report.summary.budgetUtilizationPct}% utilized
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Milestones ({report.milestones.length})
              </h3>
              <div className="space-y-1.5">
                {report.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs rounded-lg border border-[#ececf4] px-3 py-2"
                  >
                    <span className="font-medium text-[#18181b]">{m.title}</span>
                    <span className="text-zinc-500 tabular-nums">
                      {m.dueDate} · {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Tasks Breakdown ({report.tasks.length})
              </h3>
              <div className="overflow-x-auto border border-[#ececf4] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f8fb] text-zinc-500 border-b border-[#ececf4]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Task</th>
                      <th className="px-3 py-2 font-medium">Stage</th>
                      <th className="px-3 py-2 font-medium">Owner</th>
                      <th className="px-3 py-2 font-medium text-right">Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f6]">
                    {report.tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="px-3 py-2 font-medium text-[#18181b]">
                          {t.title}
                          {t.isBlocked && (
                            <span className="ml-2 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              Blocked
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-zinc-600">
                          {STAGE_META[t.stage as TaskStage]?.label ?? t.stage}
                        </td>
                        <td className="px-3 py-2 text-zinc-600">{t.assigneeName}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                          {t.estimatedHours}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e6e6ee] shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#18181b]">Create New Project</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => void handleCreateProject(e)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Code</label>
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm font-mono"
                    placeholder="PRJ-105"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Project Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                    placeholder="Solstice Cloud Migration"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Client Organization
                  </label>
                  <input
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                    placeholder="Solstice Energy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Budget Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={budgetHours}
                    onChange={(e) => setBudgetHours(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Target Delivery
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Scope Brief</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                  placeholder="Key deliverables, goals, and stakeholder expectations..."
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-700">
                <input
                  type="checkbox"
                  checked={clientPortalEnabled}
                  onChange={(e) => setClientPortalEnabled(e.target.checked)}
                  className="rounded border-zinc-300 text-[#7c3aed]"
                />
                Enable read-only Client Portal view for this project
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[#e6e6ee] px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProject}
                  className="rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 text-xs font-medium cursor-pointer disabled:opacity-60"
                >
                  {submittingProject ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
