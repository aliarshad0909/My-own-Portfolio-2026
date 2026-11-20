import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activities, contacts, deals } from "@/db/schema";
import { isAllowedWorkspaceRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { contactUpdateSchema } from "@/lib/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid contact ID" }, { status: 400 });

  const db = await getDb();
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const [contactActivities, contactDeals] = await Promise.all([
    db.select().from(activities).where(eq(activities.contactId, id)).orderBy(desc(activities.createdAt)),
    db.select().from(deals).where(eq(deals.contactId, id)).orderBy(desc(deals.updatedAt)),
  ]);

  return NextResponse.json({ contact, activities: contactActivities, deals: contactDeals });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isAllowedWorkspaceRole(auth.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const limit = checkRateLimit(clientKey(request, "write"), 90, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid contact ID" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = contactUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid contact update" }, { status: 400 });
  }

  const db = await getDb();
  const [updated] = await db
    .update(contacts)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json({ contact: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isAllowedWorkspaceRole(auth.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const limit = checkRateLimit(clientKey(request, "write"), 90, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid contact ID" }, { status: 400 });

  const db = await getDb();
  const [deleted] = await db.delete(contacts).where(eq(contacts.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json({ ok: true, id: deleted.id });
}

