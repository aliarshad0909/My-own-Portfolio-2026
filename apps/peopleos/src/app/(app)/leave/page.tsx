"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CalendarCheck2,
  CalendarClock,
  Check,
  Clock,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { MAX_LEAVE_WINDOW_DAYS, validateLeaveDateWindow } from "@/lib/leave-dates";

type EmployeeLite = {
  id: string;
  fullName: string;
  employeeCode: string;
  leaveBalanceDays: number;
};

type LeaveRequestRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeTitle: string;
  leaveBalanceDays: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
};

type AttendanceRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeTitle: string;
  logDate: string;
  status: "present" | "remote" | "on_leave" | "absent";
  checkInTime: string;
  notes: string;
};

function dateDaysFromNow(offset: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function LeaveAndAttendancePage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRow[]>([]);
  const [viewerRole, setViewerRole] = useState("demo");
  const [viewerEmployeeId, setViewerEmployeeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [leaveForm, setLeaveForm] = useState(() => ({
    employeeId: "",
    leaveType: "annual",
    startDate: dateDaysFromNow(5),
    endDate: dateDaysFromNow(6),
    reason: "",
  }));
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const [attForm, setAttForm] = useState(() => ({
    employeeId: "",
    logDate: dateDaysFromNow(0),
    status: "present",
    checkInTime: "09:00",
    notes: "Checked in via PeopleOS",
  }));
  const [submittingAtt, setSubmittingAtt] = useState(false);

  const load = useCallback(async () => {
    const [empRes, leaveRes, attRes] = await Promise.all([
      fetch("/api/employees", { cache: "no-store" }),
      fetch(`/api/leave${statusFilter ? `?status=${statusFilter}` : ""}`, { cache: "no-store" }),
      fetch("/api/attendance", { cache: "no-store" }),
    ]);

    if (empRes.ok) {
      const empJson = await empRes.json();
      const list = (empJson.employees ?? []) as EmployeeLite[];
      setEmployees(list);
      setViewerRole(empJson.viewerRole ?? "demo");
      setViewerEmployeeId(empJson.viewerEmployeeId ?? null);

      const defaultEmpId =
        empJson.viewerRole === "employee" && empJson.viewerEmployeeId
          ? empJson.viewerEmployeeId
          : list[0]?.id ?? "";

      setLeaveForm((prev) => ({
        ...prev,
        employeeId:
          empJson.viewerRole === "employee" && empJson.viewerEmployeeId
            ? empJson.viewerEmployeeId
            : prev.employeeId || defaultEmpId,
      }));
      setAttForm((prev) => ({
        ...prev,
        employeeId:
          empJson.viewerRole === "employee" && empJson.viewerEmployeeId
            ? empJson.viewerEmployeeId
            : prev.employeeId || defaultEmpId,
      }));
    }

    if (leaveRes.ok) {
      const leaveJson = await leaveRes.json();
      setLeaveRequests(leaveJson.leaveRequests ?? []);
    }

    if (attRes.ok) {
      const attJson = await attRes.json();
      setAttendanceLogs(attJson.attendanceLogs ?? []);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const onRefresh = () => void load();
    window.addEventListener("peopleos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("peopleos:refresh", onRefresh);
    };
  }, [load]);

  async function handleSubmitLeave(e: FormEvent) {
    e.preventDefault();
    const validation = validateLeaveDateWindow(leaveForm.startDate, leaveForm.endDate);
    if (!validation.ok) {
      toast(validation.error, "error");
      return;
    }

    setSubmittingLeave(true);
    try {
      const daysRequested = validation.days;
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leaveForm,
          daysRequested,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to submit leave request.", "error");
        return;
      }
      toast(`Submitted ${daysRequested}-day ${leaveForm.leaveType} leave request for review.`, "success");
      setLeaveForm((prev) => ({ ...prev, reason: "" }));
      await load();
    } finally {
      setSubmittingLeave(false);
    }
  }

  async function handleReview(id: string, decision: "approved" | "rejected") {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/leave/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to review leave request.", "error");
        return;
      }
      if (decision === "approved") {
        toast(
          `Approved atomically! Balance updated to ${json.result?.remainingBalanceDays}d and ${json.result?.attendanceDatesLogged?.length ?? 0} "on_leave" attendance row(s) recorded.`,
          "success",
        );
      } else {
        toast("Leave request rejected. Employee leave balance left untouched.", "info");
      }
      await load();
    } finally {
      setReviewingId(null);
    }
  }

  async function handleLogAttendance(e: FormEvent) {
    e.preventDefault();
    setSubmittingAtt(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attForm),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to log attendance.", "error");
        return;
      }
      toast("Attendance check-in recorded in PostgreSQL.", "success");
      await load();
    } finally {
      setSubmittingAtt(false);
    }
  }

  const canApprove = viewerRole !== "employee";
  const dateValidation = validateLeaveDateWindow(leaveForm.startDate, leaveForm.endDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Attendance &amp; Leave Management
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit leave requests, run atomic manager approvals (balance deduction + automatic on-leave attendance logs),
          and monitor daily check-ins.
        </p>
      </div>

      {/* Top Grid: Leave Submission Form + Leave Queue */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Submit Leave Request */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#16a34a]" />
            <h2 className="text-base font-bold text-slate-900">Request Time Off</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            New requests enter the manager approval queue as <span className="font-semibold">pending</span>.
          </p>

          <form onSubmit={handleSubmitLeave} className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700">Employee</label>
              <select
                required
                disabled={viewerRole === "employee" && Boolean(viewerEmployeeId)}
                value={leaveForm.employeeId}
                onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-[#16a34a] focus:outline-none disabled:bg-slate-100"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.leaveBalanceDays}d left)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Leave Type</label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-[#16a34a] focus:outline-none"
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="parental">Parental Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700">Start Date</label>
                <input
                  required
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 focus:border-[#16a34a] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">End Date</label>
                <input
                  required
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 focus:border-[#16a34a] focus:outline-none"
                />
              </div>
            </div>

            {dateValidation.ok ? (
              <div className="rounded-lg border border-green-200 bg-green-50/70 px-3 py-2 text-[11px] font-medium text-[#15803d]">
                Duration: <strong>{dateValidation.days} calendar day(s)</strong> will be validated &amp; deducted upon approval.
              </div>
            ) : (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700"
              >
                {dateValidation.days !== null && dateValidation.days > MAX_LEAVE_WINDOW_DAYS ? (
                  <>
                    Selected duration: <strong>{dateValidation.days} calendar days</strong>. {dateValidation.error}
                  </>
                ) : (
                  dateValidation.error
                )}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700">Reason</label>
              <textarea
                required
                rows={2}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Brief handoff note or reason for time off…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#16a34a] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingLeave || !leaveForm.employeeId || !dateValidation.ok}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submittingLeave ? "Submitting…" : "Submit Leave Request"}</span>
            </button>
          </form>
        </section>

        {/* Leave Requests Queue */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Leave Approval Queue</h2>
              <p className="text-xs text-slate-500">
                Single atomic transaction updates status, deducts balance, and inserts &quot;on_leave&quot; attendance rows.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {["", "pending", "approved", "rejected"].map((st) => (
                <button
                  key={st || "all"}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                    statusFilter === st
                      ? "bg-[#1e293b] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {st || "All"}
                </button>
              ))}
            </div>
          </div>

          {!canApprove ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" />
              <span>
                You are in <strong>Employee</strong> role view. Approval controls are disabled — switch Role View to{" "}
                <strong>Manager</strong> or <strong>HR Demo</strong> to approve or reject requests.
              </span>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {leaveRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-[#f6f8f7]/70 p-3.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{req.employeeName}</span>
                    <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                      {req.employeeCode}
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-[#15803d]">
                      {req.leaveType} · {req.daysRequested}d
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        req.status === "approved"
                          ? "bg-green-600 text-white"
                          : req.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong>
                      {req.startDate} → {req.endDate}
                    </strong>{" "}
                    · {req.reason}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Current employee balance: <strong className="text-slate-800">{req.leaveBalanceDays} days</strong>
                    {req.reviewedBy ? ` · Reviewed by ${req.reviewedBy}` : ""}
                  </p>
                </div>

                {req.status === "pending" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={!canApprove || reviewingId === req.id}
                      onClick={() => void handleReview(req.id, "approved")}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#16a34a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      disabled={!canApprove || reviewingId === req.id}
                      onClick={() => void handleReview(req.id, "rejected")}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ))}

            {leaveRequests.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No leave requests match this filter.</p>
            ) : null}
          </div>
        </section>
      </div>

      {/* Bottom Grid: Quick Attendance Check-In + Attendance Log Table */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#16a34a]" />
            <h2 className="text-base font-bold text-slate-900">Daily Attendance Check-In</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">Record office presence, remote work, or absence.</p>

          <form onSubmit={handleLogAttendance} className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700">Employee</label>
              <select
                required
                disabled={viewerRole === "employee" && Boolean(viewerEmployeeId)}
                value={attForm.employeeId}
                onChange={(e) => setAttForm({ ...attForm, employeeId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-[#16a34a] focus:outline-none disabled:bg-slate-100"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700">Date</label>
                <input
                  required
                  type="date"
                  value={attForm.logDate}
                  onChange={(e) => setAttForm({ ...attForm, logDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Status</label>
                <select
                  value={attForm.status}
                  onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                >
                  <option value="present">Present (Office)</option>
                  <option value="remote">Remote</option>
                  <option value="on_leave">On Leave</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700">Check-In Time</label>
                <input
                  value={attForm.checkInTime}
                  onChange={(e) => setAttForm({ ...attForm, checkInTime: e.target.value })}
                  placeholder="09:00"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Notes</label>
                <input
                  value={attForm.notes}
                  onChange={(e) => setAttForm({ ...attForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submittingAtt || !attForm.employeeId}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1e293b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>{submittingAtt ? "Recording…" : "Record Attendance"}</span>
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs lg:col-span-8">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">Attendance Logbook</h2>
            <p className="text-xs text-slate-500">
              Includes daily office/remote check-ins and automated &quot;on_leave&quot; entries from approved leave requests.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-[#f6f8f7] text-[11px] font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Check-In</th>
                  <th className="px-4 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLogs.slice(0, 18).map((row) => (
                  <tr key={row.id} className="hover:bg-[#f6f8f7]/60">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">{row.logDate}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{row.employeeName}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          row.status === "present"
                            ? "bg-green-100 text-[#15803d]"
                            : row.status === "remote"
                              ? "bg-teal-100 text-teal-800"
                              : row.status === "on_leave"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {row.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{row.checkInTime}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.notes}</td>
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
