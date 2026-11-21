"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Plus,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type Candidate = {
  id: string;
  fullName: string;
  roleTitle: string;
  departmentName: string;
  stage: "applied" | "screening" | "interview" | "offer" | "hired" | "archived";
  source: string;
  rating: number;
  notes: string;
};

type OnboardingTaskRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeTitle: string;
  employeeStatus: string;
  startDate: string;
  title: string;
  ownerRole: string;
  completed: boolean;
};

const ACTIVE_STAGES: { key: Candidate["stage"]; label: string; next?: Candidate["stage"] }[] = [
  { key: "applied", label: "Applied", next: "screening" },
  { key: "screening", label: "Screening", next: "interview" },
  { key: "interview", label: "Interview", next: "offer" },
  { key: "offer", label: "Offer", next: "hired" },
  { key: "hired", label: "Hired" },
];

export default function RecruitmentAndOnboardingPage() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tasks, setTasks] = useState<OnboardingTaskRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [candForm, setCandForm] = useState({
    fullName: "",
    roleTitle: "",
    departmentName: "Product Engineering",
    stage: "applied",
    source: "Direct Application",
    rating: "4",
    notes: "",
  });

  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [candRes, taskRes] = await Promise.all([
      fetch("/api/candidates", { cache: "no-store" }),
      fetch("/api/onboarding", { cache: "no-store" }),
    ]);

    if (candRes.ok) {
      const json = await candRes.json();
      setCandidates(json.candidates ?? []);
    }
    if (taskRes.ok) {
      const json = await taskRes.json();
      setTasks(json.onboardingTasks ?? []);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const onRefresh = () => void load();
    window.addEventListener("peopleos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("peopleos:refresh", onRefresh);
    };
  }, [load]);

  async function handleAddCandidate(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...candForm,
        rating: Number(candForm.rating),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || "Unable to add candidate.", "error");
      return;
    }
    toast(`Added ${json.candidate?.fullName} to recruitment pipeline.`, "success");
    setAddOpen(false);
    setCandForm({
      fullName: "",
      roleTitle: "",
      departmentName: "Product Engineering",
      stage: "applied",
      source: "Direct Application",
      rating: "4",
      notes: "",
    });
    await load();
  }

  async function handleMoveCandidate(id: string, nextStage: Candidate["stage"]) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to advance candidate.", "error");
        return;
      }
      toast(`Moved candidate to "${nextStage}".`, "success");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleTask(task: OnboardingTaskRow) {
    setBusyId(task.id);
    try {
      const res = await fetch(`/api/onboarding/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to update onboarding checklist.", "error");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddTask(employeeId: string) {
    const title = (newTaskTitle[employeeId] || "").trim();
    if (!title) return;
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, title, ownerRole: "HR Ops" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || "Unable to add onboarding task.", "error");
      return;
    }
    setNewTaskTitle((prev) => ({ ...prev, [employeeId]: "" }));
    toast("Added onboarding checklist item.", "success");
    await load();
  }

  // Group onboarding tasks by employee
  const onboardingGroups = Array.from(
    tasks.reduce((map, row) => {
      const existing = map.get(row.employeeId);
      if (existing) {
        existing.tasks.push(row);
      } else {
        map.set(row.employeeId, {
          employeeId: row.employeeId,
          employeeName: row.employeeName,
          employeeTitle: row.employeeTitle,
          startDate: row.startDate,
          tasks: [row],
        });
      }
      return map;
    }, new Map<string, { employeeId: string; employeeName: string; employeeTitle: string; startDate: string; tasks: OnboardingTaskRow[] }>()),
  ).map(([, value]) => value);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Recruitment Pipeline &amp; Onboarding
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track candidates from application to hire and verify new-hire onboarding checklists in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803d]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Recruitment Pipeline Board */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Hiring Pipeline</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {ACTIVE_STAGES.map((stage) => {
            const list = candidates.filter((c) => c.stage === stage.key);
            return (
              <div
                key={stage.key}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-slate-900">{stage.label}</span>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-[#15803d]">
                    {list.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {list.map((cand) => (
                    <div
                      key={cand.id}
                      className="rounded-xl border border-slate-200/80 bg-[#f6f8f7]/80 p-3 text-xs"
                    >
                      <p className="font-bold text-slate-900">{cand.fullName}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-700">{cand.roleTitle}</p>
                      <p className="text-[11px] text-slate-500">{cand.departmentName}</p>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate">{cand.source}</span>
                        <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          {cand.rating}
                        </span>
                      </div>

                      {cand.notes ? (
                        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                          {cand.notes}
                        </p>
                      ) : null}

                      {stage.next ? (
                        <div className="mt-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busyId === cand.id}
                            onClick={() => void handleMoveCandidate(cand.id, stage.next!)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#16a34a] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#15803d] disabled:opacity-50"
                          >
                            <span>Advance</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === cand.id}
                            onClick={() => void handleMoveCandidate(cand.id, "archived")}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                          >
                            Archive
                          </button>
                        </div>
                      ) : (
                        <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-[#15803d]">
                          <CheckCircle2 className="h-3 w-3" />
                          Offer Accepted
                        </span>
                      )}
                    </div>
                  ))}

                  {list.length === 0 ? (
                    <p className="py-6 text-center text-[11px] text-slate-400">No candidates in stage</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* New-Hire Onboarding Checklists */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-[#16a34a]" />
          <div>
            <h2 className="text-base font-bold text-slate-900">New-Hire Onboarding Checklists</h2>
            <p className="text-xs text-slate-500">
              Toggle tasks to update onboarding readiness percentage live across PeopleOS.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {onboardingGroups.map((group) => {
            const done = group.tasks.filter((t) => t.completed).length;
            const pct = Math.round((done / Math.max(group.tasks.length, 1)) * 100);
            return (
              <div
                key={group.employeeId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{group.employeeName}</h3>
                    <p className="text-xs text-slate-500">
                      {group.employeeTitle} · Start Date: {group.startDate}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-[#15803d]">
                    {pct}% ({done}/{group.tasks.length})
                  </span>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#16a34a] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <ul className="mt-4 space-y-2">
                  {group.tasks.map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        disabled={busyId === task.id}
                        onClick={() => void handleToggleTask(task)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-[#f6f8f7]/70 px-3 py-2.5 text-left text-xs transition hover:border-[#16a34a]"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          {task.completed ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span
                            className={`truncate ${
                              task.completed ? "text-slate-500 line-through" : "font-medium text-slate-900"
                            }`}
                          >
                            {task.title}
                          </span>
                        </span>
                        <span className="shrink-0 rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {task.ownerRole}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex gap-2">
                  <input
                    value={newTaskTitle[group.employeeId] || ""}
                    onChange={(e) =>
                      setNewTaskTitle((prev) => ({ ...prev, [group.employeeId]: e.target.value }))
                    }
                    placeholder="Add onboarding checklist item…"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#16a34a] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddTask(group.employeeId)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#1e293b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Candidate Modal */}
      {addOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add recruitment candidate"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Candidate to Pipeline</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Candidate Name</label>
                <input
                  required
                  value={candForm.fullName}
                  onChange={(e) => setCandForm({ ...candForm, fullName: e.target.value })}
                  placeholder="e.g. Amina Yusuf"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Target Role</label>
                <input
                  required
                  value={candForm.roleTitle}
                  onChange={(e) => setCandForm({ ...candForm, roleTitle: e.target.value })}
                  placeholder="e.g. Staff Frontend Engineer"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700">Department</label>
                  <input
                    required
                    value={candForm.departmentName}
                    onChange={(e) => setCandForm({ ...candForm, departmentName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Rating (1–5)</label>
                  <select
                    value={candForm.rating}
                    onChange={(e) => setCandForm({ ...candForm, rating: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} / 5
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Source</label>
                <input
                  required
                  value={candForm.source}
                  onChange={(e) => setCandForm({ ...candForm, source: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Interview Notes</label>
                <textarea
                  rows={2}
                  value={candForm.notes}
                  onChange={(e) => setCandForm({ ...candForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16a34a] px-4 py-2 font-semibold text-white hover:bg-[#15803d]"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
