import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { projects, tasks, teamMembers, timeEntries } from "@/db/schema";
import { recordActivity } from "@/lib/activity";
import { computeTeamUtilization, resolveUtilizationPeriod, roundHours } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { createTimeEntrySchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const referenceDate = url.searchParams.get("referenceDate") ?? undefined;
  const weekStart = url.searchParams.get("weekStart") ?? undefined;
  const weekEnd = url.searchParams.get("weekEnd") ?? undefined;

  const db = await getDb();
  const [entriesList, membersList, projectsList, tasksList] = await Promise.all([
    db.select().from(timeEntries).orderBy(desc(timeEntries.loggedDate), desc(timeEntries.createdAt)),
    db.select().from(teamMembers),
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db.select().from(tasks),
  ]);

  const projectById = new Map(projectsList.map((p) => [p.id, p]));
  const taskById = new Map(tasksList.map((t) => [t.id, t]));

  const totalHours = roundHours(entriesList.reduce((acc, e) => acc + Number(e.hours || 0), 0));
  const billableHours = roundHours(
    entriesList.filter((e) => e.billable).reduce((acc, e) => acc + Number(e.hours || 0), 0),
  );
  const nonBillableHours = roundHours(totalHours - billableHours);
  const billablePct = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;

  const utilizationPeriod = resolveUtilizationPeriod(entriesList, {
    referenceDate,
    weekStart,
    weekEnd,
  });
  const teamUtilization = computeTeamUtilization(
    membersList,
    entriesList,
    tasksList,
    utilizationPeriod,
  );
  const weeklyLoggedHours = roundHours(
    teamUtilization.reduce((acc, m) => acc + m.loggedHours, 0),
  );
  const weeklyBillableHours = roundHours(
    teamUtilization.reduce((acc, m) => acc + m.billableHours, 0),
  );
  const avgUtilizationPct =
    teamUtilization.length > 0
      ? Math.round(
          teamUtilization.reduce((acc, m) => acc + m.utilizationPct, 0) / teamUtilization.length,
        )
      : 0;

  const enrichedEntries = entriesList.map((e) => {
    const proj = projectById.get(e.projectId);
    const task = e.taskId ? taskById.get(e.taskId) : null;
    return {
      ...e,
      projectCode: proj?.code ?? "PRJ",
      projectName: proj?.name ?? "Project",
      taskTitle: task?.title ?? null,
    };
  });

  return NextResponse.json({
    summary: {
      totalHours,
      billableHours,
      nonBillableHours,
      billablePct,
      avgUtilizationPct,
      weeklyLoggedHours,
      weeklyBillableHours,
      utilizationPeriod,
    },
    utilizationPeriod,
    timeEntries: enrichedEntries,
    teamUtilization,
    projects: projectsList,
    tasks: tasksList.map((t) => ({ id: t.id, projectId: t.projectId, title: t.title })),
    teamMembers: membersList,
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = createTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid time entry." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [created] = await db
    .insert(timeEntries)
    .values({
      projectId: parsed.data.projectId,
      taskId: parsed.data.taskId ?? null,
      memberName: parsed.data.memberName,
      hours: parsed.data.hours,
      billable: parsed.data.billable,
      note: parsed.data.note,
      loggedDate: parsed.data.loggedDate,
    })
    .returning();

  await recordActivity(db, {
    actorName: parsed.data.memberName,
    action: "logged_time",
    entityType: "time_entry",
    entityTitle: `${created.hours}h (${created.billable ? "Billable" : "Non-billable"})`,
    projectId: created.projectId,
    detail: created.note || "Time logged against project delivery",
  });

  return NextResponse.json({ timeEntry: created }, { status: 201 });
}
