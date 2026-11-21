import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { logActivity } from "@/lib/ticket-service";
import { updateCustomerSchema } from "@/lib/validation";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid customer ID." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [existing] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  try {
    const [updated] = await db
      .update(customers)
      .set({
        name: parsed.data.name ?? existing.name,
        email: parsed.data.email ? parsed.data.email.toLowerCase() : existing.email,
        company: parsed.data.company ?? existing.company,
        planTier: parsed.data.planTier ?? existing.planTier,
        notes: parsed.data.notes !== undefined ? parsed.data.notes : existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    await logActivity(db, {
      actorName: auth.user.name,
      action: "customer.updated",
      entityType: "customer",
      entityId: updated.id,
      summary: `Updated customer profile for ${updated.name} (${updated.company})`,
    });

    return NextResponse.json({ customer: updated });
  } catch {
    return NextResponse.json({ error: "Unable to update customer (check email uniqueness)." }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid customer ID." }, { status: 400 });
  }

  const db = await getDb();
  const [deleted] = await db.delete(customers).where(eq(customers.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  await logActivity(db, {
    actorName: auth.user.name,
    action: "customer.deleted",
    entityType: "customer",
    entityId: deleted.id,
    summary: `Removed customer ${deleted.name} (${deleted.company})`,
  });

  return NextResponse.json({ ok: true });
}
