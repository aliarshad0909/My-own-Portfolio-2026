"use client";

export function RunStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; label: string; dot: string }> = {
    completed: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      label: "Completed",
    },
    awaiting_approval: {
      bg: "bg-amber-50 text-amber-800 border-amber-300",
      dot: "bg-amber-500 animate-pulse",
      label: "Awaiting Approval",
    },
    running: {
      bg: "bg-sky-50 text-sky-700 border-sky-200",
      dot: "bg-sky-500 animate-pulse",
      label: "Running",
    },
    failed: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
      label: "Failed",
    },
    rejected: {
      bg: "bg-slate-100 text-slate-700 border-slate-300",
      dot: "bg-slate-500",
      label: "Rejected",
    },
  };

  const s = styles[status] || {
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${s.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function TriggerTypeBadge({ triggerType }: { triggerType: string }) {
  const map: Record<string, string> = {
    trigger: "bg-violet-50 text-violet-700 border-violet-200",
    schedule: "bg-indigo-50 text-indigo-700 border-indigo-200",
    webhook: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide border ${
        map[triggerType] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {triggerType}
    </span>
  );
}
