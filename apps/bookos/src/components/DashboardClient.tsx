"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Clock,
  DollarSign,
  Globe,
  Plus,
  Sparkles,
} from "lucide-react";
import { useWorkspaceTimezone } from "@/components/AppShell";
import {
  SUPPORTED_TIMEZONES,
  formatCurrency,
  type SupportedTimezone,
} from "@/lib/constants";
import { formatDateInTimezone, formatTimeInTimezone } from "@/lib/timezone";

type DashboardData = {
  kpis: {
    upcomingConfirmedCount: number;
    todaysScheduleCount: number;
    cancellationRate: number;
    simulatedSandboxRevenueCents: number;
    scheduledRemindersCount: number;
    totalBookings: number;
    totalCustomers: number;
  };
  upcomingBookings: Array<{
    id: string;
    bookingRef: string;
    startUtc: string;
    endUtc: string;
    customerTimezone: string;
    status: string;
    paymentStatus: string;
    paymentAmountCents: number;
    paymentReceiptRef: string | null;
    serviceName: string;
    durationMins: number;
    staffName: string;
    staffAvatarColor: string;
    customerName: string;
    customerEmail: string;
  }>;
  analytics: {
    byService: Array<{
      id: string;
      name: string;
      category: string;
      durationMins: number;
      totalBookings: number;
      activeBookings: number;
      revenueCents: number;
    }>;
    byStaff: Array<{
      id: string;
      name: string;
      roleTitle: string;
      timezone: string;
      avatarColor: string;
      activeBookings: number;
      revenueCents: number;
    }>;
  };
  recentLogs: Array<{
    id: string;
    actorName: string;
    action: string;
    entityId: string;
    summary: string;
    createdAt: string;
  }>;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rescheduled: "border-amber-200 bg-amber-50 text-amber-800",
    completed: "border-blue-200 bg-blue-50 text-[#1d4ed8]",
    cancelled: "border-stone-200 bg-stone-100 text-stone-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
        styles[status] || "border-stone-200 bg-stone-50 text-stone-700"
      }`}
    >
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "sandbox_paid") {
    return (
      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[#1d4ed8]">
        Sandbox Paid
      </span>
    );
  }
  if (status === "refunded") {
    return (
      <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
        Refunded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
      Unpaid
    </span>
  );
}

export function DashboardClient() {
  const { timezone, setTimezone } = useWorkspaceTimezone();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?timezone=${encodeURIComponent(timezone)}`);
      if (res.ok) {
        const json = (await res.json()) as DashboardData;
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const onRefresh = () => void load();
    window.addEventListener("bookos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("bookos:refresh", onRefresh);
    };
  }, [load]);

  const maxServiceBookings = Math.max(
    1,
    ...(data?.analytics.byService.map((s) => s.activeBookings) ?? [1]),
  );
  const maxStaffBookings = Math.max(
    1,
    ...(data?.analytics.byStaff.map((s) => s.activeBookings) ?? [1]),
  );

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-[#2563eb] uppercase">
            Operations Overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1c1917] sm:text-3xl">
            Booking Dashboard
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Live multi-timezone schedule, automated reminders, and simulated sandbox revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-[#1c1917] shadow-2xs">
            <Globe className="h-3.5 w-3.5 text-[#2563eb]" />
            <select
              aria-label="Dashboard timezone switcher"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value as SupportedTimezone)}
              className="bg-transparent font-medium text-[#1c1917] focus:outline-none"
            >
              {SUPPORTED_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/book"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" />
            <span>New Booking</span>
          </Link>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Upcoming Confirmed",
            value: data ? String(data.kpis.upcomingConfirmedCount) : "—",
            sub: "Active future slots",
            icon: CalendarCheck2,
          },
          {
            label: "Today's Schedule",
            value: data ? String(data.kpis.todaysScheduleCount) : "—",
            sub: `In ${timezone.split("/")[1]?.replace("_", " ") || timezone}`,
            icon: CalendarClock,
          },
          {
            label: "Cancellation Rate",
            value: data ? `${data.kpis.cancellationRate}%` : "—",
            sub: `Across ${data?.kpis.totalBookings ?? 0} bookings`,
            icon: CalendarX2,
          },
          {
            label: "Sandbox Revenue",
            value: data ? formatCurrency(data.kpis.simulatedSandboxRevenueCents) : "—",
            sub: "Simulated receipts only",
            icon: DollarSign,
          },
          {
            label: "Scheduled Reminders",
            value: data ? String(data.kpis.scheduledRemindersCount) : "—",
            sub: "Email & SMS queue",
            icon: BellRing,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-stone-500">{kpi.label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-[#1c1917] tabular-nums">
                {kpi.value}
              </div>
              <p className="mt-1 truncate text-xs text-stone-500">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Split Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Upcoming Calendar List */}
        <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-[#1c1917]">Upcoming Schedule</h2>
              <p className="text-xs text-stone-500">
                All times converted live to <span className="font-medium text-stone-700">{timezone}</span>
              </p>
            </div>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
            >
              <span>Manage Calendar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading && !data ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-100" />
              ))}
            </div>
          ) : data && data.upcomingBookings.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {data.upcomingBookings.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white"
                      style={{ backgroundColor: item.staffAvatarColor }}
                    >
                      {item.staffName
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-[#1c1917]">
                          {item.serviceName}
                        </span>
                        <span className="font-mono text-[11px] text-stone-400">
                          {item.bookingRef}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-stone-600">
                        {item.customerName} · with{" "}
                        <span className="font-medium text-stone-800">{item.staffName}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500 tabular-nums">
                        <span className="inline-flex items-center gap-1 font-medium text-[#1c1917]">
                          <Clock className="h-3 w-3 text-[#2563eb]" />
                          {formatDateInTimezone(item.startUtc, timezone)} ·{" "}
                          {formatTimeInTimezone(item.startUtc, timezone)} –{" "}
                          {formatTimeInTimezone(item.endUtc, timezone)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={item.status} />
                      <PaymentBadge status={item.paymentStatus} />
                    </div>
                    <span className="text-xs font-semibold text-stone-700 tabular-nums">
                      {formatCurrency(item.paymentAmountCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-stone-700">No upcoming bookings yet.</p>
              <Link
                href="/book"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Book First Slot
              </Link>
            </div>
          )}
        </section>

        {/* Analytics & Activity Column */}
        <div className="space-y-6 lg:col-span-5">
          {/* Analytics by Service */}
          <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
            <h2 className="text-base font-semibold text-[#1c1917]">Bookings by Service</h2>
            <p className="text-xs text-stone-500">Active volume &amp; simulated sandbox revenue</p>
            <div className="mt-4 space-y-3">
              {(data?.analytics.byService ?? []).map((svc) => (
                <div key={svc.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-[#1c1917]">{svc.name}</span>
                    <span className="shrink-0 text-stone-500 tabular-nums">
                      {svc.activeBookings} slots · {formatCurrency(svc.revenueCents)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-[#2563eb]"
                      style={{
                        width: `${Math.max(8, Math.round((svc.activeBookings / maxServiceBookings) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Analytics by Staff */}
          <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
            <h2 className="text-base font-semibold text-[#1c1917]">Specialist Utilization</h2>
            <p className="text-xs text-stone-500">Assigned active bookings per team member</p>
            <div className="mt-4 space-y-3">
              {(data?.analytics.byStaff ?? []).map((member) => (
                <div key={member.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: member.avatarColor }}
                      />
                      <span className="truncate font-medium text-[#1c1917]">{member.name}</span>
                    </div>
                    <span className="shrink-0 text-stone-500 tabular-nums">
                      {member.activeBookings} · {formatCurrency(member.revenueCents)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: member.avatarColor,
                        width: `${Math.max(8, Math.round((member.activeBookings / maxStaffBookings) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Studio Activity */}
          <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#2563eb]" />
              <h2 className="text-base font-semibold text-[#1c1917]">Recent Activity</h2>
            </div>
            <div className="mt-3 space-y-2.5">
              {(data?.recentLogs ?? []).slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-stone-100 bg-[#fafaf9] px-3 py-2 text-xs"
                >
                  <p className="leading-snug text-[#1c1917]">{log.summary}</p>
                  <p className="mt-1 text-[11px] text-stone-500">
                    {log.actorName} · {formatTimeInTimezone(log.createdAt, timezone)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
