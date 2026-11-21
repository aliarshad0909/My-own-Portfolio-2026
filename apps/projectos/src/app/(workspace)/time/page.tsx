"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Clock,
  DollarSign,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { TeamUtilizationRow } from "@/lib/analytics";

type TimeEntryItem = {
  id: string;
  projectId: string;
  taskId: string | null;
  memberName: string;
  hours: number;
  billable: boolean;
  note: string;
  loggedDate: string;
  projectCode: string;
  projectName: string;
  taskTitle: string | null;
};

type TimeApiResponse = {
  summary: {
    totalHours: number;
    billableHours: number;
    nonBillableHours: number;
    billablePct: number;
    avgUtilizationPct: number;
  };
  timeEntries: TimeEntryItem[];
  teamUtilization: TeamUtilizationRow[];
  projects: Array<{ id: string; code: string; name: string }>;
  tasks: Array<{ id: string; projectId: string; title: string }>;
  teamMembers: Array<{ id: string; name: string; roleTitle: string }>;
};

export default function TimeAndTeamPage() {
  const [data, setData] = useState<TimeApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Log time entry form
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [hours, setHours] = useState("2.5");
  const [billable, setBillable] = useState(true);
  const [loggedDate, setLoggedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loggingTime, setLoggingTime] = useState(false);

  // Add team member modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [mName, setMName] = useState("");
  const [mRole, setMRole] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mCapacity, setMCapacity] = useState("40");
  const [addingMember, setAddingMember] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/time-entries", { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load time tracking data.");
      const json = (await res.json()) as TimeApiResponse;
      setData(json);
      setProjectId((prev) => prev || json.projects[0]?.id || "");
      setMemberName((prev) => prev || json.teamMembers[0]?.name || "");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load time data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  async function handleLogTime(e: FormEvent) {
    e.preventDefault();
    setLoggingTime(true);
    setError("");
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          taskId: taskId || null,
          memberName,
          hours: Number(hours),
          billable,
          note,
          loggedDate,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Failed to log time entry.");
      } else {
        setNote("");
        setHours("2");
        await load();
      }
    } finally {
      setLoggingTime(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    setAddingMember(true);
    setError("");
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mName,
          roleTitle: mRole,
          email: mEmail,
          capacityHours: Number(mCapacity),
          avatarColor: "#7c3aed",
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Failed to add team member.");
      } else {
        setShowMemberModal(false);
        setMName("");
        setMRole("");
        setMEmail("");
        await load();
      }
    } finally {
      setAddingMember(false);
    }
  }

  const projectTasks = data?.tasks.filter((t) => t.projectId === projectId) ?? [];

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[#7c3aed]">
            Utilization & Billables
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#18181b] mt-1">
            Time Tracking & Team Capacity
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Record billable and internal hours against tasks and track weekly squad utilization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowMemberModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white text-xs font-medium px-4 py-2.5 transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="h-4 w-4 text-[#8b5cf6]" />
          <span>Add Team Member</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="h-96 bg-white rounded-2xl border border-[#e6e6ee] animate-pulse" />
      ) : (
        <>
          {/* Billable Rollup Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Total Logged Hours</span>
                <Clock className="h-4 w-4 text-[#7c3aed]" />
              </div>
              <div className="mt-2.5 text-2xl font-semibold tabular-nums text-[#18181b]">
                {data.summary.totalHours}h
              </div>
              <div className="text-xs text-zinc-500 mt-1">Across all active programs</div>
            </div>

            <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Billable Hours</span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2.5 text-2xl font-semibold tabular-nums text-emerald-700">
                {data.summary.billableHours}h
              </div>
              <div className="text-xs text-zinc-500 mt-1 tabular-nums">
                {data.summary.billablePct}% billable ratio
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Non-Billable / Internal</span>
                <Clock className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="mt-2.5 text-2xl font-semibold tabular-nums text-[#18181b]">
                {data.summary.nonBillableHours}h
              </div>
              <div className="text-xs text-zinc-500 mt-1">Planning, QA & studio ops</div>
            </div>

            <div className="rounded-2xl bg-white border border-[#e6e6ee] p-5">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Avg Team Utilization</span>
                <Users className="h-4 w-4 text-[#7c3aed]" />
              </div>
              <div className="mt-2.5 text-2xl font-semibold tabular-nums text-[#18181b]">
                {data.summary.avgUtilizationPct}%
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {data.teamUtilization.length} studio specialists
              </div>
            </div>
          </div>

          {/* Log Time Entry Form + Team Capacity Table */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Log Time Form */}
            <section className="rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-semibold text-[#18181b]">Log Time Entry</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Attach delivery hours to a client project and optional Kanban task.
              </p>

              <form onSubmit={(e) => void handleLogTime(e)} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Project</label>
                  <select
                    required
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value);
                      setTaskId("");
                    }}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs text-[#18181b]"
                  >
                    {data.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Task (Optional)
                  </label>
                  <select
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs text-[#18181b]"
                  >
                    <option value="">General project delivery</option>
                    {projectTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Member</label>
                    <select
                      required
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs text-[#18181b]"
                    >
                      {data.teamMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Hours</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="24"
                      required
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs text-[#18181b]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={loggedDate}
                      onChange={(e) => setLoggedDate(e.target.value)}
                      className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs text-[#18181b]"
                    />
                  </div>
                  <div className="pt-4">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={billable}
                        onChange={(e) => setBillable(e.target.checked)}
                        className="rounded border-zinc-300 text-[#7c3aed]"
                      />
                      Billable to Client
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Work Note</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What was delivered in this session?"
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs text-[#18181b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loggingTime}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium px-4 py-2.5 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  <span>{loggingTime ? "Recording..." : "Record Time Entry"}</span>
                </button>
              </form>
            </section>

            {/* Team Capacity & Utilization Table */}
            <section className="xl:col-span-2 rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs min-w-0">
              <div className="flex items-center justify-between pb-4 border-b border-[#efeff5]">
                <div>
                  <h2 className="text-base font-semibold text-[#18181b]">
                    Team Capacity & Utilization
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Logged hours against weekly capacity and active task load per specialist.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="text-zinc-500 border-b border-[#ececf4]">
                    <tr>
                      <th className="pb-2.5 font-medium">Member</th>
                      <th className="pb-2.5 font-medium text-right">Capacity</th>
                      <th className="pb-2.5 font-medium text-right">Logged</th>
                      <th className="pb-2.5 font-medium text-right">Billable</th>
                      <th className="pb-2.5 font-medium text-center">Open Tasks</th>
                      <th className="pb-2.5 font-medium w-36">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f2f7]">
                    {data.teamUtilization.map((m) => (
                      <tr key={m.id}>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                              style={{ backgroundColor: m.avatarColor }}
                            >
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-[#18181b]">{m.name}</div>
                              <div className="text-[11px] text-zinc-500">{m.roleTitle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right tabular-nums text-zinc-600">
                          {m.capacityHours}h
                        </td>
                        <td className="py-3 text-right tabular-nums font-medium text-[#18181b]">
                          {m.loggedHours}h
                        </td>
                        <td className="py-3 text-right tabular-nums text-emerald-700">
                          {m.billableHours}h
                        </td>
                        <td className="py-3 text-center tabular-nums text-zinc-600">
                          {m.openTasks}
                        </td>
                        <td className="py-3 pl-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  m.utilizationPct > 100 ? "bg-rose-500" : "bg-[#7c3aed]"
                                }`}
                                style={{ width: `${Math.min(100, m.utilizationPct)}%` }}
                              />
                            </div>
                            <span className="w-9 text-right tabular-nums font-medium text-[#18181b]">
                              {m.utilizationPct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Time Entries Ledger */}
          <section className="rounded-2xl bg-white border border-[#e6e6ee] p-5 sm:p-6 shadow-xs min-w-0">
            <div className="flex items-center justify-between pb-4 border-b border-[#efeff5]">
              <h2 className="text-base font-semibold text-[#18181b]">
                Logged Time Ledger ({data.timeEntries.length})
              </h2>
              <span className="text-xs text-zinc-500">Most recent first</span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="text-zinc-500 border-b border-[#ececf4]">
                  <tr>
                    <th className="pb-2.5 font-medium">Date</th>
                    <th className="pb-2.5 font-medium">Project / Task</th>
                    <th className="pb-2.5 font-medium">Member</th>
                    <th className="pb-2.5 font-medium">Type</th>
                    <th className="pb-2.5 font-medium">Note</th>
                    <th className="pb-2.5 font-medium text-right">Hours</th>
                    <th className="pb-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f7]">
                  {data.timeEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-3 tabular-nums text-zinc-500 whitespace-nowrap">
                        {entry.loggedDate}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-medium text-[#18181b]">
                          <span className="font-mono text-[#7c3aed] mr-1.5">
                            {entry.projectCode}
                          </span>
                          {entry.projectName}
                        </div>
                        {entry.taskTitle && (
                          <div className="text-[11px] text-zinc-500 mt-0.5">{entry.taskTitle}</div>
                        )}
                      </td>
                      <td className="py-3 text-zinc-700 whitespace-nowrap">{entry.memberName}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                            entry.billable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {entry.billable ? "Billable" : "Non-Billable"}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-600 max-w-xs truncate">{entry.note || "—"}</td>
                      <td className="py-3 text-right font-semibold tabular-nums text-[#18181b]">
                        {entry.hours}h
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDeleteEntry(entry.id)}
                          aria-label="Delete time entry"
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Add Team Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e6e6ee] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#18181b]">Add Team Member</h2>
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => void handleAddMember(e)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Full Name</label>
                <input
                  required
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  placeholder="Jordan Patel"
                  className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Role Title</label>
                <input
                  required
                  value={mRole}
                  onChange={(e) => setMRole(e.target.value)}
                  placeholder="Senior Backend Engineer"
                  className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={mEmail}
                    onChange={(e) => setMEmail(e.target.value)}
                    placeholder="jordan@projectos.studio"
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Weekly Hrs
                  </label>
                  <input
                    type="number"
                    min={8}
                    max={80}
                    required
                    value={mCapacity}
                    onChange={(e) => setMCapacity(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="rounded-xl border border-[#e6e6ee] px-4 py-2 text-xs font-medium text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 text-xs font-medium cursor-pointer disabled:opacity-60"
                >
                  {addingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
