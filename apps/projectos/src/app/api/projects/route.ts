import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { milestones, projects, tasks, teamMembers, timeEntries } from "@/db/schema";
import { recordActivity } from "@/lib/activity";
import { computeDashboardMetrics } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createProjectSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [projectsList, milestonesList, tasksList, entriesList, membersList] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db.select().from(milestones),
    db.select().from(tasks),
    db.select().from(timeEntries),
    db.select().from(teamMembers),
  ]);

  const metrics = computeDashboardMetrics(projectsList, milestonesList, tasksList, entriesList);
  const analyticsByProject = new Map(metrics.projectAnalytics.map((a) => [a.projectId, a]));

  const enriched = projectsList.map((p) => {
    const pMilestones = milestonesList
      .filter((m) => m.projectId === p.id)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const pTasks = tasksList.filter((t) => t.projectId === p.id);
    const assignedMembers = Array.from(
      new Set(pTasks.map((t) => t.assigneeName).filter((n) => n && n !== "Unassigned")),
    );
    return {
      ...p,
      metrics: analyticsByProject.get(p.id),
      milestones: pMilestones,
      assignedMembers,
    };
  });

  return NextResponse.json({ projects: enriched, teamMembers: membersList });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "write-projects"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Slow down slightly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid project payload." },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const [created] = await db
      .insert(projects)
      .values({
        code: parsed.data.code,
        name: parsed.data.name,
        clientName: parsed.data.clientName,
        description: parsed.data.description,
        status: parsed.data.status,
        budgetHours: parsed.data.budgetHours,
        startDate: parsed.data.startDate,
        targetDate: parsed.data.targetDate,
        clientPortalEnabled: parsed.data.clientPortalEnabled,
      })
      .returning();

    await recordActivity(db, {
      actorName: auth.user.name,
      action: "created_project",
      entityType: "project",
      entityTitle: `${created.code}: ${created.name}`,
      projectId: created.id,
      detail: `Client ${created.clientName} (${created.budgetHours}h budget)`,
    });

    return NextResponse.json({ project: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create project.";
    const status = message.toLowerCase().includes("unique") ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? "A project with this code already exists." : message },
      { status },
    );
  }
}
