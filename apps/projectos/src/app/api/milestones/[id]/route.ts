import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { milestones } from "@/db/schema";
import { recordActivity } from "@/lib/activity";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { updateMilestoneSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid milestone update." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [updated] = await db
    .update(milestones)
    .set(parsed.data)
    .where(eq(milestones.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
  }

  await recordActivity(db, {
    actorName: auth.user.name,
    action: parsed.data.status === "completed" ? "completed_milestone" : "updated_milestone",
    entityType: "milestone",
    entityTitle: updated.title,
    projectId: updated.projectId,
    detail:
      parsed.data.status === "completed"
        ? "Marked milestone as completed"
        : `Milestone status: ${updated.status}`,
  });

  return NextResponse.json({ milestone: updated });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const db = await getDb();
  const [deleted] = await db.delete(milestones).where(eq(milestones.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
