import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { milestones, projects, taskComments, tasks, teamMembers } from "@/db/schema";
import { recordActivity } from "@/lib/activity";
import { computeTaskBlockedState } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createTaskSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const db = await getDb();

  const [allTasks, allComments, allProjects, allMilestones, allMembers] = await Promise.all([
    projectId
      ? db
          .select()
          .from(tasks)
          .where(eq(tasks.projectId, projectId))
          .orderBy(desc(tasks.updatedAt))
      : db.select().from(tasks).orderBy(desc(tasks.updatedAt)),
    db.select().from(taskComments),
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db.select().from(milestones),
    db.select().from(teamMembers),
  ]);

  const taskById = new Map(allTasks.map((t) => [t.id, t]));
  const projectById = new Map(allProjects.map((p) => [p.id, p]));
  const milestoneById = new Map(allMilestones.map((m) => [m.id, m]));
  const commentCounts = new Map<string, number>();
  for (const c of allComments) {
    commentCounts.set(c.taskId, (commentCounts.get(c.taskId) ?? 0) + 1);
  }

  const enriched = allTasks.map((t) => {
    const blocker = computeTaskBlockedState(t, taskById);
    const proj = projectById.get(t.projectId);
    const ms = t.milestoneId ? milestoneById.get(t.milestoneId) : null;
    return {
      ...t,
      projectCode: proj?.code ?? "PRJ",
      projectName: proj?.name ?? "Project",
      milestoneTitle: ms?.title ?? null,
      commentCount: commentCounts.get(t.id) ?? 0,
      blocker,
    };
  });

  return NextResponse.json({
    tasks: enriched,
    projects: allProjects,
    milestones: allMilestones,
    teamMembers: allMembers,
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "write-tasks"), 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [created] = await db
    .insert(tasks)
    .values({
      projectId: parsed.data.projectId,
      milestoneId: parsed.data.milestoneId ?? null,
      title: parsed.data.title,
      description: parsed.data.description,
      stage: parsed.data.stage,
      priority: parsed.data.priority,
      assigneeName: parsed.data.assigneeName,
      dependsOnTaskId: parsed.data.dependsOnTaskId ?? null,
      estimatedHours: parsed.data.estimatedHours,
      dueDate: parsed.data.dueDate,
      attachmentName: parsed.data.attachmentName,
    })
    .returning();

  await recordActivity(db, {
    actorName: auth.user.name,
    action: "created_task",
    entityType: "task",
    entityTitle: created.title,
    projectId: created.projectId,
    detail: `Assigned to ${created.assigneeName} (${created.priority} priority)`,
  });

  return NextResponse.json({ task: created }, { status: 201 });
}
