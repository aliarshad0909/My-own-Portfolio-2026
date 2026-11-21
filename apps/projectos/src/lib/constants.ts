export const TASK_STAGES = ["backlog", "todo", "in_progress", "review", "done"] as const;
export type TaskStage = (typeof TASK_STAGES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PROJECT_STATUSES = ["active", "at_risk", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MILESTONE_STATUSES = ["upcoming", "in_progress", "completed"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const STAGE_META: Record<
  TaskStage,
  { label: string; shortLabel: string; dotColor: string; badgeClass: string; columnBg: string }
> = {
  backlog: {
    label: "Backlog",
    shortLabel: "Backlog",
    dotColor: "#71717a",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
    columnBg: "bg-zinc-50/90",
  },
  todo: {
    label: "To Do",
    shortLabel: "To Do",
    dotColor: "#3b82f6",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    columnBg: "bg-slate-50/90",
  },
  in_progress: {
    label: "In Progress",
    shortLabel: "In Progress",
    dotColor: "#8b5cf6",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    columnBg: "bg-violet-50/40",
  },
  review: {
    label: "In Review",
    shortLabel: "Review",
    dotColor: "#f59e0b",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    columnBg: "bg-amber-50/35",
  },
  done: {
    label: "Done",
    shortLabel: "Done",
    dotColor: "#10b981",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    columnBg: "bg-emerald-50/35",
  },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; badgeClass: string }> = {
  low: { label: "Low", badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  medium: { label: "Medium", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" },
  high: { label: "High", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  urgent: { label: "Urgent", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; badgeClass: string }> = {
  active: { label: "Active", badgeClass: "bg-violet-50 text-violet-700 border-violet-200" },
  at_risk: { label: "At Risk", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
  completed: { label: "Completed", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const MILESTONE_STATUS_META: Record<MilestoneStatus, { label: string; badgeClass: string }> = {
  upcoming: { label: "Upcoming", badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  in_progress: { label: "In Progress", badgeClass: "bg-violet-50 text-violet-700 border-violet-200" },
  completed: { label: "Completed", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};
