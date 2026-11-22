import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { taskComments, tasks } from "@/db/schema";
import { recordActivity } from "@/lib/activity";
import { computeTaskBlockedState } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";
import { STAGE_META, type TaskStage } from "@/lib/constants";
import { verifyCsrfOrigin } from "@/lib/security";
import { updateTaskSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = await getDb();
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const [comments, projectTasks] = await Promise.all([
    db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, id))
      .orderBy(asc(taskComments.createdAt)),
    db.select().from(tasks).where(eq(tasks.projectId, task.projectId)),
  ]);

  const taskById = new Map(projectTasks.map((t) => [t.id, t]));
  const blocker = computeTaskBlockedState(task, taskById);

  return NextResponse.json({ task: { ...task, blocker }, comments });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task update." },
      { status: 400 },
    );
  }

  if (parsed.data.dependsOnTaskId === id) {
    return NextResponse.json({ error: "A task cannot depend on itself." }, { status: 400 });
  }

  const db = await getDb();
  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const [updated] = await db
    .update(tasks)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();

  const stageChanged = parsed.data.stage && parsed.data.stage !== existing.stage;
  await recordActivity(db, {
    actorName: auth.user.name,
    action: stageChanged ? "moved_task" : "updated_task",
    entityType: "task",
    entityTitle: updated.title,
    projectId: updated.projectId,
    detail: stageChanged
      ? `Moved from ${STAGE_META[existing.stage as TaskStage]?.label ?? existing.stage} to ${STAGE_META[updated.stage as TaskStage]?.label ?? updated.stage}`
      : "Updated task details",
  });

  return NextResponse.json({ task: updated });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = await getDb();
  const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  await recordActivity(db, {
    actorName: auth.user.name,
    action: "deleted_task",
    entityType: "task",
    entityTitle: deleted.title,
    projectId: deleted.projectId,
    detail: "Removed task from board",
  });

  return NextResponse.json({ ok: true });
}
