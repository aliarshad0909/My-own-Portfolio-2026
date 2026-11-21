import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, candidates } from "@/db/schema";
import { canApproveLeave, requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { updateCandidateSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canApproveLeave(auth.user.role)) {
    return NextResponse.json(
      { error: "Standard Employee role cannot modify candidate stages." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateCandidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid candidate update." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [updated] = await db
    .update(candidates)
    .set(parsed.data)
    .where(eq(candidates.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "candidate.updated",
    entityType: "candidate",
    entityId: updated.id,
    summary: `Moved ${updated.fullName} (${updated.roleTitle}) to stage "${updated.stage}".`,
  });

  return NextResponse.json({ candidate: updated });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canApproveLeave(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const db = await getDb();
  const [deleted] = await db.delete(candidates).where(eq(candidates.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
