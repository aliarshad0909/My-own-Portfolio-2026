import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { milestones, projects } from "@/db/schema";
import { recordActivity } from "@/lib/activity";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { createMilestoneSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const db = await getDb();

  const rows = projectId
    ? await db
        .select()
        .from(milestones)
        .where(eq(milestones.projectId, projectId))
        .orderBy(asc(milestones.dueDate))
    : await db.select().from(milestones).orderBy(asc(milestones.dueDate));

  return NextResponse.json({ milestones: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = createMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid milestone." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [project] = await db
    .select({ id: projects.id, code: projects.code })
    .from(projects)
    .where(eq(projects.id, parsed.data.projectId))
    .limit(1);
  if (!project) {
    return NextResponse.json({ error: "Selected project does not exist." }, { status: 404 });
  }

  const [created] = await db
    .insert(milestones)
    .values({
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      dueDate: parsed.data.dueDate,
      status: parsed.data.status,
    })
    .returning();

  await recordActivity(db, {
    actorName: auth.user.name,
    action: "created_milestone",
    entityType: "milestone",
    entityTitle: created.title,
    projectId: created.projectId,
    detail: `${project.code} milestone targeting ${created.dueDate}`,
  });

  return NextResponse.json({ milestone: created }, { status: 201 });
}
