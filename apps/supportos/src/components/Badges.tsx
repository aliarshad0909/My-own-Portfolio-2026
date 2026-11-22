"use client";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  CATEGORY_LABELS,
  PLAN_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type PlanTier,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/constants";
import type { SlaState } from "@/lib/support-engine";

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-rose-100 text-rose-800 border-rose-200",
    high: "bg-amber-100 text-amber-800 border-amber-200",
    medium: "bg-blue-100 text-blue-800 border-blue-200",
    low: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[priority] ?? styles.medium}`}
    >
      {PRIORITY_LABELS[priority as TicketPriority] ?? priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
    waiting_customer: "bg-amber-50 text-amber-800 border-amber-200",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.open}`}
    >
      {STATUS_LABELS[status as TicketStatus] ?? status}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    incident: "bg-rose-50 text-rose-700 border-rose-200",
    billing: "bg-violet-50 text-violet-700 border-violet-200",
    technical: "bg-sky-50 text-sky-700 border-sky-200",
    onboarding: "bg-teal-50 text-teal-700 border-teal-200",
    feature_request: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles[category] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
    >
      {CATEGORY_LABELS[category as TicketCategory] ?? category}
    </span>
  );
}

export function PlanBadge({ planTier }: { planTier: string }) {
  const styles: Record<string, string> = {
    enterprise: "bg-indigo-100 text-indigo-900 border-indigo-200",
    growth: "bg-blue-50 text-blue-700 border-blue-200",
    starter: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[planTier] ?? styles.growth}`}
    >
      {PLAN_LABELS[planTier as PlanTier] ?? planTier}
    </span>
  );
}

export function SlaBadge({ state, label }: { state: SlaState; label: string }) {
  if (state === "breached") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
        <AlertTriangle className="h-3 w-3" />
        {label}
      </span>
    );
  }
  if (state === "at_risk") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
        <Clock className="h-3 w-3" />
        {label}
      </span>
    );
  }
  if (state === "met") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        {label}
      </span>
    );
  }
  if (state === "breached_resolved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        <Clock className="h-3 w-3" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}
