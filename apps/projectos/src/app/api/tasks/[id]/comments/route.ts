import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { taskComments, tasks } from "@/db/schema";
import { recordActivity } from "@/lib/activity";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { createCommentSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = await getDb();
  const rows = await db
    .select()
    .from(taskComments)
    .where(eq(taskComments.taskId, id))
    .orderBy(asc(taskComments.createdAt));

  return NextResponse.json({ comments: rows });
}

export async function POST(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid comment." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const [created] = await db
    .insert(taskComments)
    .values({
      taskId: id,
      authorName: parsed.data.authorName || auth.user.name,
      body: parsed.data.body,
    })
    .returning();

  await recordActivity(db, {
    actorName: created.authorName,
    action: "commented",
    entityType: "task",
    entityTitle: task.title,
    projectId: task.projectId,
    detail: created.body.slice(0, 110),
  });

  return NextResponse.json({ comment: created }, { status: 201 });
}
