import type {
  MilestoneRow,
  ProjectRow,
  TaskRow,
  TeamMemberRow,
  TimeEntryRow,
} from "@/db/schema";

export type TaskBlockerInfo = {
  isBlocked: boolean;
  prerequisiteTaskId: string | null;
  prerequisiteTitle: string | null;
  prerequisiteStage: string | null;
};

export function computeTaskBlockedState(
  task: Pick<TaskRow, "dependsOnTaskId" | "stage">,
  taskById: Map<string, Pick<TaskRow, "id" | "title" | "stage">>,
): TaskBlockerInfo {
  if (!task.dependsOnTaskId) {
    return {
      isBlocked: false,
      prerequisiteTaskId: null,
      prerequisiteTitle: null,
      prerequisiteStage: null,
    };
  }
  const prereq = taskById.get(task.dependsOnTaskId);
  if (!prereq) {
    return {
      isBlocked: false,
      prerequisiteTaskId: null,
      prerequisiteTitle: null,
      prerequisiteStage: null,
    };
  }
  const isBlocked = task.stage !== "done" && prereq.stage !== "done";
  return {
    isBlocked,
    prerequisiteTaskId: prereq.id,
    prerequisiteTitle: prereq.title,
    prerequisiteStage: prereq.stage,
  };
}

export type ProjectAnalyticsSummary = {
  projectId: string;
  code: string;
  name: string;
  clientName: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  completionPct: number;
  totalMilestones: number;
  completedMilestones: number;
  loggedHours: number;
  billableHours: number;
  budgetHours: number;
  budgetUtilizationPct: number;
  blockedTasks: number;
};

export type DashboardMetrics = {
  kpis: {
    activeProjects: number;
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    tasksCompletedPct: number;
    loggedHours: number;
    budgetHours: number;
    hoursUtilizationPct: number;
    billableHours: number;
    milestonesCompleted: number;
    milestonesTotal: number;
    blockedDependencies: number;
  };
  projectAnalytics: ProjectAnalyticsSummary[];
  upcomingMilestones: Array<{
    id: string;
    projectId: string;
    projectCode: string;
    projectName: string;
    title: string;
    dueDate: string;
    status: string;
  }>;
  blockedTasks: Array<{
    id: string;
    projectId: string;
    projectCode: string;
    title: string;
    stage: string;
    assigneeName: string;
    prerequisiteTitle: string;
    prerequisiteStage: string;
  }>;
};

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeDashboardMetrics(
  projectsList: ProjectRow[],
  milestonesList: MilestoneRow[],
  tasksList: TaskRow[],
  timeEntriesList: TimeEntryRow[],
): DashboardMetrics {
  const projectById = new Map(projectsList.map((p) => [p.id, p]));
  const taskById = new Map(tasksList.map((t) => [t.id, t]));

  const activeProjects = projectsList.filter((p) => p.status !== "completed").length;
  const totalTasks = tasksList.length;
  const completedTasks = tasksList.filter((t) => t.stage === "done").length;
  const tasksCompletedPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const loggedHours = roundHours(timeEntriesList.reduce((acc, e) => acc + Number(e.hours || 0), 0));
  const billableHours = roundHours(
    timeEntriesList.filter((e) => e.billable).reduce((acc, e) => acc + Number(e.hours || 0), 0),
  );
  const budgetHours = projectsList.reduce((acc, p) => acc + Number(p.budgetHours || 0), 0);
  const hoursUtilizationPct = budgetHours > 0 ? Math.round((loggedHours / budgetHours) * 100) : 0;

  const milestonesTotal = milestonesList.length;
  const milestonesCompleted = milestonesList.filter((m) => m.status === "completed").length;

  const blockedTasks: DashboardMetrics["blockedTasks"] = [];
  for (const task of tasksList) {
    const blocker = computeTaskBlockedState(task, taskById);
    if (blocker.isBlocked && blocker.prerequisiteTitle && blocker.prerequisiteStage) {
      const proj = projectById.get(task.projectId);
      blockedTasks.push({
        id: task.id,
        projectId: task.projectId,
        projectCode: proj?.code ?? "PRJ",
        title: task.title,
        stage: task.stage,
        assigneeName: task.assigneeName,
        prerequisiteTitle: blocker.prerequisiteTitle,
        prerequisiteStage: blocker.prerequisiteStage,
      });
    }
  }

  const projectAnalytics: ProjectAnalyticsSummary[] = projectsList.map((project) => {
    const pTasks = tasksList.filter((t) => t.projectId === project.id);
    const pDone = pTasks.filter((t) => t.stage === "done").length;
    const pMilestones = milestonesList.filter((m) => m.projectId === project.id);
    const pMilestonesDone = pMilestones.filter((m) => m.status === "completed").length;
    const pEntries = timeEntriesList.filter((e) => e.projectId === project.id);
    const pHours = roundHours(pEntries.reduce((acc, e) => acc + Number(e.hours || 0), 0));
    const pBillable = roundHours(
      pEntries.filter((e) => e.billable).reduce((acc, e) => acc + Number(e.hours || 0), 0),
    );
    const pBlocked = pTasks.filter((t) => computeTaskBlockedState(t, taskById).isBlocked).length;

    return {
      projectId: project.id,
      code: project.code,
      name: project.name,
      clientName: project.clientName,
      status: project.status,
      totalTasks: pTasks.length,
      completedTasks: pDone,
      completionPct: pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0,
      totalMilestones: pMilestones.length,
      completedMilestones: pMilestonesDone,
      loggedHours: pHours,
      billableHours: pBillable,
      budgetHours: project.budgetHours,
      budgetUtilizationPct:
        project.budgetHours > 0 ? Math.round((pHours / project.budgetHours) * 100) : 0,
      blockedTasks: pBlocked,
    };
  });

  const upcomingMilestones = milestonesList
    .filter((m) => m.status !== "completed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)
    .map((m) => {
      const proj = projectById.get(m.projectId);
      return {
        id: m.id,
        projectId: m.projectId,
        projectCode: proj?.code ?? "PRJ",
        projectName: proj?.name ?? "Project",
        title: m.title,
        dueDate: m.dueDate,
        status: m.status,
      };
    });

  return {
    kpis: {
      activeProjects,
      totalProjects: projectsList.length,
      totalTasks,
      completedTasks,
      tasksCompletedPct,
      loggedHours,
      budgetHours,
      hoursUtilizationPct,
      billableHours,
      milestonesCompleted,
      milestonesTotal,
      blockedDependencies: blockedTasks.length,
    },
    projectAnalytics,
    upcomingMilestones,
    blockedTasks,
  };
}

export type UtilizationPeriod = {
  weekStart: string;
  weekEnd: string;
};

export type TeamUtilizationOptions = {
  referenceDate?: string;
  weekStart?: string;
  weekEnd?: string;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDateUtc(dateStr: string): Date | null {
  if (!ISO_DATE_RE.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatIsoDateUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysIso(dateStr: string, days: number): string {
  const parsed = parseIsoDateUtc(dateStr);
  if (!parsed) return dateStr;
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return formatIsoDateUtc(parsed);
}

/**
 * Computes the ISO Monday–Sunday 7-day calendar week containing `dateStr` (YYYY-MM-DD).
 */
export function getIsoWeekRange(dateStr: string): UtilizationPeriod {
  const parsed = parseIsoDateUtc(dateStr) ?? new Date();
  const dayOfWeek = parsed.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate() + diffToMonday),
  );
  const sunday = new Date(
    Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6),
  );
  return {
    weekStart: formatIsoDateUtc(monday),
    weekEnd: formatIsoDateUtc(sunday),
  };
}

/**
 * Resolves the single 7-day capacity period used for weekly utilization calculations.
 * Honors explicit `weekStart`/`weekEnd` or `referenceDate` when supplied; otherwise
 * anchors on the ISO week of the latest logged entry date (or today if no entries exist).
 */
export function resolveUtilizationPeriod(
  entries: Array<Pick<TimeEntryRow, "loggedDate">>,
  options: TeamUtilizationOptions = {},
): UtilizationPeriod {
  const validWeekStart =
    options.weekStart && parseIsoDateUtc(options.weekStart) ? options.weekStart : null;
  const validWeekEnd =
    options.weekEnd && parseIsoDateUtc(options.weekEnd) ? options.weekEnd : null;

  if (validWeekStart && validWeekEnd && validWeekStart <= validWeekEnd) {
    return { weekStart: validWeekStart, weekEnd: validWeekEnd };
  }
  if (validWeekStart) {
    return { weekStart: validWeekStart, weekEnd: addDaysIso(validWeekStart, 6) };
  }
  if (validWeekEnd) {
    return { weekStart: addDaysIso(validWeekEnd, -6), weekEnd: validWeekEnd };
  }
  if (options.referenceDate && parseIsoDateUtc(options.referenceDate)) {
    return getIsoWeekRange(options.referenceDate);
  }

  let latestDate: string | null = null;
  for (const entry of entries) {
    if (entry.loggedDate && parseIsoDateUtc(entry.loggedDate)) {
      if (!latestDate || entry.loggedDate > latestDate) {
        latestDate = entry.loggedDate;
      }
    }
  }

  return getIsoWeekRange(latestDate ?? formatIsoDateUtc(new Date()));
}

export type TeamUtilizationRow = {
  id: string;
  name: string;
  roleTitle: string;
  email: string;
  avatarColor: string;
  capacityHours: number;
  weekStart: string;
  weekEnd: string;
  loggedHours: number;
  billableHours: number;
  nonBillableHours: number;
  lifetimeHours: number;
  totalBillableHours: number;
  lifetimeNonBillableHours: number;
  utilizationPct: number;
  openTasks: number;
  completedTasks: number;
};

export function computeTeamUtilization(
  members: TeamMemberRow[],
  entries: TimeEntryRow[],
  tasksList: TaskRow[],
  options: TeamUtilizationOptions = {},
): TeamUtilizationRow[] {
  const period = resolveUtilizationPeriod(entries, options);

  return members.map((member) => {
    const memberEntries = entries.filter((e) => e.memberName === member.name);
    const weeklyEntries = memberEntries.filter(
      (e) =>
        Boolean(e.loggedDate) &&
        e.loggedDate >= period.weekStart &&
        e.loggedDate <= period.weekEnd,
    );

    const loggedHours = roundHours(weeklyEntries.reduce((acc, e) => acc + Number(e.hours || 0), 0));
    const billableHours = roundHours(
      weeklyEntries.filter((e) => e.billable).reduce((acc, e) => acc + Number(e.hours || 0), 0),
    );
    const nonBillableHours = roundHours(loggedHours - billableHours);

    const lifetimeHours = roundHours(
      memberEntries.reduce((acc, e) => acc + Number(e.hours || 0), 0),
    );
    const totalBillableHours = roundHours(
      memberEntries.filter((e) => e.billable).reduce((acc, e) => acc + Number(e.hours || 0), 0),
    );
    const lifetimeNonBillableHours = roundHours(lifetimeHours - totalBillableHours);

    const memberTasks = tasksList.filter((t) => t.assigneeName === member.name);
    const completedTasks = memberTasks.filter((t) => t.stage === "done").length;
    const openTasks = memberTasks.length - completedTasks;
    const utilizationPct =
      member.capacityHours > 0 ? Math.round((loggedHours / member.capacityHours) * 100) : 0;

    return {
      id: member.id,
      name: member.name,
      roleTitle: member.roleTitle,
      email: member.email,
      avatarColor: member.avatarColor,
      capacityHours: member.capacityHours,
      weekStart: period.weekStart,
      weekEnd: period.weekEnd,
      loggedHours,
      billableHours,
      nonBillableHours,
      lifetimeHours,
      totalBillableHours,
      lifetimeNonBillableHours,
      utilizationPct,
      openTasks,
      completedTasks,
    };
  });
}

export type ProjectReportPayload = {
  generatedAt: string;
  project: {
    id: string;
    code: string;
    name: string;
    clientName: string;
    status: string;
    startDate: string;
    targetDate: string;
    budgetHours: number;
    clientPortalEnabled: boolean;
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    completionPct: number;
    blockedTasks: number;
    totalMilestones: number;
    completedMilestones: number;
    loggedHours: number;
    billableHours: number;
    nonBillableHours: number;
    budgetRemainingHours: number;
    budgetUtilizationPct: number;
  };
  milestones: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    stage: string;
    priority: string;
    assigneeName: string;
    estimatedHours: number;
    dueDate: string;
    attachmentName: string;
    isBlocked: boolean;
    prerequisiteTitle: string | null;
  }>;
  timeEntries: Array<{
    id: string;
    memberName: string;
    hours: number;
    billable: boolean;
    loggedDate: string;
    note: string;
  }>;
};

export function buildProjectReport(
  project: ProjectRow,
  projectMilestones: MilestoneRow[],
  projectTasks: TaskRow[],
  projectEntries: TimeEntryRow[],
): ProjectReportPayload {
  const taskById = new Map(projectTasks.map((t) => [t.id, t]));
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((t) => t.stage === "done").length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const loggedHours = roundHours(projectEntries.reduce((acc, e) => acc + Number(e.hours || 0), 0));
  const billableHours = roundHours(
    projectEntries.filter((e) => e.billable).reduce((acc, e) => acc + Number(e.hours || 0), 0),
  );
  const nonBillableHours = roundHours(loggedHours - billableHours);
  const budgetRemainingHours = roundHours(project.budgetHours - loggedHours);
  const budgetUtilizationPct =
    project.budgetHours > 0 ? Math.round((loggedHours / project.budgetHours) * 100) : 0;

  const enrichedTasks = projectTasks.map((t) => {
    const blocker = computeTaskBlockedState(t, taskById);
    return {
      id: t.id,
      title: t.title,
      stage: t.stage,
      priority: t.priority,
      assigneeName: t.assigneeName,
      estimatedHours: t.estimatedHours,
      dueDate: t.dueDate,
      attachmentName: t.attachmentName,
      isBlocked: blocker.isBlocked,
      prerequisiteTitle: blocker.prerequisiteTitle,
    };
  });

  const blockedTasks = enrichedTasks.filter((t) => t.isBlocked).length;

  return {
    generatedAt: new Date().toISOString(),
    project: {
      id: project.id,
      code: project.code,
      name: project.name,
      clientName: project.clientName,
      status: project.status,
      startDate: project.startDate,
      targetDate: project.targetDate,
      budgetHours: project.budgetHours,
      clientPortalEnabled: project.clientPortalEnabled,
    },
    summary: {
      totalTasks,
      completedTasks,
      completionPct,
      blockedTasks,
      totalMilestones: projectMilestones.length,
      completedMilestones: projectMilestones.filter((m) => m.status === "completed").length,
      loggedHours,
      billableHours,
      nonBillableHours,
      budgetRemainingHours,
      budgetUtilizationPct,
    },
    milestones: projectMilestones
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((m) => ({
        id: m.id,
        title: m.title,
        dueDate: m.dueDate,
        status: m.status,
      })),
    tasks: enrichedTasks,
    timeEntries: projectEntries
      .slice()
      .sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))
      .map((e) => ({
        id: e.id,
        memberName: e.memberName,
        hours: e.hours,
        billable: e.billable,
        loggedDate: e.loggedDate,
        note: e.note,
      })),
  };
}

export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function serializeProjectReportCsv(report: ProjectReportPayload): string {
  const lines: string[] = [];
  lines.push(["Section", "Field / Item", "Status / Stage", "Owner / Priority", "Hours / Metric", "Date / Notes"].map(escapeCsvCell).join(","));

  lines.push(
    ["Project Summary", `${report.project.code} - ${report.project.name}`, report.project.status, report.project.clientName, `${report.summary.completionPct}% complete`, `${report.project.startDate} to ${report.project.targetDate}`]
      .map(escapeCsvCell)
      .join(","),
  );
  lines.push(
    ["Hours Rollup", "Logged vs Budget", `${report.summary.budgetUtilizationPct}% used`, `Billable ${report.summary.billableHours}h / Non-billable ${report.summary.nonBillableHours}h`, `${report.summary.loggedHours}h / ${report.project.budgetHours}h`, `Remaining ${report.summary.budgetRemainingHours}h`]
      .map(escapeCsvCell)
      .join(","),
  );

  for (const m of report.milestones) {
    lines.push(
      ["Milestone", m.title, m.status, "", "", m.dueDate].map(escapeCsvCell).join(","),
    );
  }

  for (const t of report.tasks) {
    const depNote = t.isBlocked && t.prerequisiteTitle ? `Blocked by: ${t.prerequisiteTitle}` : t.attachmentName ? `Attachment: ${t.attachmentName}` : "";
    lines.push(
      ["Task", t.title, t.stage, `${t.assigneeName} (${t.priority})`, `${t.estimatedHours}h est`, [t.dueDate, depNote].filter(Boolean).join(" | ")]
        .map(escapeCsvCell)
        .join(","),
    );
  }

  for (const e of report.timeEntries) {
    lines.push(
      ["Time Entry", e.note || "Delivery work", e.billable ? "Billable" : "Non-billable", e.memberName, `${e.hours}h`, e.loggedDate]
        .map(escapeCsvCell)
        .join(","),
    );
  }

  return lines.join("\n");
}
