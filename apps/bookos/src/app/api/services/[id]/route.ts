import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, bookings, services } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { serviceUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = serviceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid service update." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [updated] = await db
    .update(services)
    .set(parsed.data)
    .where(eq(services.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "service.updated",
    entityType: "service",
    entityId: updated.id,
    summary: `Updated service "${updated.name}".`,
  });

  return NextResponse.json({ service: updated });
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
    .where(eq(bookings.serviceId, id))
    .limit(1);

  if (linked.length > 0) {
    return NextResponse.json(
      {
        error:
          "This service has existing booking history. Deactivate it instead of deleting to preserve records.",
      },
      { status: 409 },
    );
  }

  const [deleted] = await db.delete(services).where(eq(services.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
