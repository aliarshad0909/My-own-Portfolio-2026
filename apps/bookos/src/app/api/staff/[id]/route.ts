import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, bookings, staff } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { staffUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = staffUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid staff update." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const payload = parsed.data.email
    ? { ...parsed.data, email: parsed.data.email.toLowerCase() }
    : parsed.data;

  const [updated] = await db.update(staff).set(payload).where(eq(staff.id, id)).returning();
  if (!updated) {
    return NextResponse.json({ error: "Staff specialist not found." }, { status: 404 });
  }

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "staff.updated",
    entityType: "staff",
    entityId: updated.id,
    summary: `Updated specialist ${updated.name}.`,
  });

  return NextResponse.json({ staffMember: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = await getDb();

  const linked = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.staffId, id))
    .limit(1);

  if (linked.length > 0) {
    return NextResponse.json(
      {
        error:
          "This specialist has booking history. Mark them inactive instead of deleting to preserve records.",
      },
      { status: 409 },
    );
  }

  const [deleted] = await db.delete(staff).where(eq(staff.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Staff specialist not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
