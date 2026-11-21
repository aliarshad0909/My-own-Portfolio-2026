import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { milestones, projects, tasks, timeEntries } from "@/db/schema";
import { recordActivity } from "@/lib/activity";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { updateProjectSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const [pMilestones, pTasks, pEntries] = await Promise.all([
    db.select().from(milestones).where(eq(milestones.projectId, id)),
    db.select().from(tasks).where(eq(tasks.projectId, id)),
    db.select().from(timeEntries).where(eq(timeEntries.projectId, id)),
  ]);

  return NextResponse.json({
    project,
    milestones: pMilestones,
    tasks: pTasks,
    timeEntries: pEntries,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid project update." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [updated] = await db
    .update(projects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await recordActivity(db, {
    actorName: auth.user.name,
    action: "updated_project",
    entityType: "project",
    entityTitle: `${updated.code}: ${updated.name}`,
    projectId: updated.id,
    detail: parsed.data.status ? `Status set to ${parsed.data.status}` : "Project settings updated",
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = await getDb();
  const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await recordActivity(db, {
    actorName: auth.user.name,
    action: "deleted_project",
    entityType: "project",
    entityTitle: `${deleted.code}: ${deleted.name}`,
    projectId: null,
    detail: "Removed project from workspace",
  });

  return NextResponse.json({ ok: true });
}
