"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type DashboardData = {
  viewerRole: string;
  kpis: {
    activeHeadcount: number;
    departmentsCount: number;
    pendingLeaveApprovals: number;
    openCandidatesCount: number;
    onboardingCompletionPct: number;
    onboardingCount: number;
    onLeaveNow: number;
  };
  analytics: {
    latestAttendanceDate: string | null;
    attendanceRatePct: number;
    remoteSharePct: number;
    leaveUtilizationPct: number;
    documentCompliancePct: number;
    totalAttendanceSamples: number;
  };
  departmentBreakdown: {
    id: string;
    name: string;
    code: string;
    headName: string;
    headcount: number;
    target: number;
    fillPct: number;
  }[];
  pendingLeaveQueue: {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeTitle: string;
    leaveBalanceDays: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysRequested: number;
    reason: string;
    status: string;
  }[];
  recentActivities: {
    id: string;
    actorName: string;
    action: string;
    summary: string;
    createdAt: string;
  }[];
};

export default function HrDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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
    const timer = window.setTimeout(() => void load(), 0);
    const onRefresh = () => void load();
    window.addEventListener("peopleos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("peopleos:refresh", onRefresh);
    };
  }, [load]);

  async function handleQuickReview(id: string, decision: "approved" | "rejected") {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/leave/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to update leave request.", "error");
        return;
      }
      if (decision === "approved") {
        toast(
          `Approved! Remaining balance: ${json.result?.remainingBalanceDays}d · Logged ${json.result?.attendanceDatesLogged?.length ?? 0} on_leave day(s).`,
          "success",
        );
      } else {
        toast("Leave request rejected. Employee leave balance unchanged.", "info");
      }
      await load();
    } finally {
      setReviewingId(null);
    }
  }

  const canApprove = data ? data.viewerRole !== "employee" : true;

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">HR Operations Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Workforce snapshot, department capacity, attendance health, and real-time leave approval queue.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Users className="h-3.5 w-3.5 text-[#16a34a]" />
            <span>Org Chart</span>
          </Link>
          <Link
            href="/leave"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#16a34a] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#15803d]"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            <span>Manage Leave</span>
          </Link>
        </div>
      </div>

      {/* 5 Core KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="HR Key Performance Indicators">
        {[
          {
            label: "Active Headcount",
            value: loading ? "—" : String(data?.kpis.activeHeadcount ?? 0),
            sub: data ? `${data.kpis.onboardingCount} onboarding · ${data.kpis.onLeaveNow} on leave` : "Loading…",
            icon: Users,
            accent: "bg-green-50 text-[#16a34a]",
          },
          {
            label: "Departments",
            value: loading ? "—" : String(data?.kpis.departmentsCount ?? 0),
            sub: "Functional business units",
            icon: Building2,
            accent: "bg-slate-100 text-slate-700",
          },
          {
            label: "Pending Leave",
            value: loading ? "—" : String(data?.kpis.pendingLeaveApprovals ?? 0),
            sub: "Awaiting manager review",
            icon: CalendarClock,
            accent: "bg-amber-50 text-amber-700",
          },
          {
            label: "Open Candidates",
            value: loading ? "—" : String(data?.kpis.openCandidatesCount ?? 0),
            sub: "Active hiring pipeline",
            icon: Briefcase,
            accent: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Onboarding Ready",
            value: loading ? "—" : `${data?.kpis.onboardingCompletionPct ?? 0}%`,
            sub: "Checklist completion rate",
            icon: ClipboardCheck,
            accent: "bg-teal-50 text-teal-700",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">{card.label}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.accent}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-1 truncate text-[11px] text-slate-500">{card.sub}</p>
            </div>
          );
        })}
      </section>

      {/* Middle 2-column grid: Department Breakdown + HR Analytics */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Department Headcount Breakdown */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Department Headcount vs. Target</h2>
              <p className="text-xs text-slate-500">Live roster distribution across teams</p>
            </div>
            <Link
              href="/directory"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803d] hover:underline"
            >
              <span>Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3.5">
            {(data?.departmentBreakdown ?? []).map((dept) => (
              <div key={dept.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900">{dept.name}</span>
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                      {dept.code}
                    </span>
                    <span className="ml-2 hidden text-slate-500 sm:inline">Lead: {dept.headName}</span>
                  </div>
                  <span className="shrink-0 font-semibold text-slate-800">
                    {dept.headcount} / {dept.target}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#16a34a] transition-all"
                    style={{ width: `${dept.fillPct}%` }}
                  />
                </div>
              </div>
            ))}
            {!loading && (data?.departmentBreakdown.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No departments found.</p>
            ) : null}
          </div>
        </section>

        {/* HR Analytics */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">HR Operations Analytics</h2>
              <p className="text-xs text-slate-500">
                Attendance, leave utilization &amp; document readiness
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-[#16a34a]" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              {
                label: "Attendance Rate",
                value: `${data?.analytics.attendanceRatePct ?? 0}%`,
                note: data?.analytics.latestAttendanceDate
                  ? `Latest: ${data.analytics.latestAttendanceDate}`
                  : "Present + Remote",
              },
              {
                label: "Remote Share",
                value: `${data?.analytics.remoteSharePct ?? 0}%`,
                note: "Of active daily check-ins",
              },
              {
                label: "Leave Utilization",
                value: `${data?.analytics.leaveUtilizationPct ?? 0}%`,
                note: "Of annual 20d allowance",
              },
              {
                label: "Doc Compliance",
                value: `${data?.analytics.documentCompliancePct ?? 0}%`,
                note: "Verified HR records",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-slate-200/80 bg-[#f6f8f7] p-3.5"
              >
                <p className="text-[11px] font-semibold text-slate-500">{metric.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{metric.value}</p>
                <p className="mt-1 text-[11px] text-slate-500">{metric.note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom 2-column grid: Quick Pending Leave Approvals + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Quick Pending Leave Approval Queue */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Quick Pending Leave Approvals</h2>
              <p className="text-xs text-slate-500">
                Atomic PostgreSQL approval deducts leave balance &amp; creates on-leave attendance entries.
              </p>
            </div>
            <Link
              href="/leave"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803d] hover:underline"
            >
              <span>All Requests</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {(data?.pendingLeaveQueue ?? []).map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-[#f6f8f7]/70 p-3.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{item.employeeName}</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-[#15803d]">
                      {item.leaveType} · {item.daysRequested}d
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Balance: <strong className="text-slate-700">{item.leaveBalanceDays}d</strong>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {item.startDate} → {item.endDate} · {item.reason}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={!canApprove || reviewingId === item.id}
                    onClick={() => void handleQuickReview(item.id, "approved")}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#16a34a] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canApprove || reviewingId === item.id}
                    onClick={() => void handleQuickReview(item.id, "rejected")}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}

            {!loading && (data?.pendingLeaveQueue.length ?? 0) === 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50/60 p-4 text-xs text-green-900">
                <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
                <span>All leave requests have been reviewed. Submit a new request in Attendance &amp; Leave.</span>
              </div>
            ) : null}
          </div>
        </section>

        {/* Recent HR Activity */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent HR Activity</h2>
              <p className="text-xs text-slate-500">Live PostgreSQL audit log</p>
            </div>
            <Activity className="h-4 w-4 text-slate-500" />
          </div>

          <ul className="mt-4 space-y-3">
            {(data?.recentActivities ?? []).map((act) => (
              <li
                key={act.id}
                className="rounded-xl border border-slate-200/70 bg-[#f6f8f7]/60 px-3 py-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{act.actorName}</span>
                  <span className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                    {act.action}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed text-slate-600">{act.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
