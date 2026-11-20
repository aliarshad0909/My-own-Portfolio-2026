import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activities, dealHistory, deals } from "@/db/schema";
import { isAllowedWorkspaceRole, requireApiUser } from "@/lib/auth";
import { stageProbability } from "@/lib/constants";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { dealUpdateSchema } from "@/lib/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });

  const db = await getDb();
  const [deal] = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const [history, dealActivities] = await Promise.all([
    db.select().from(dealHistory).where(eq(dealHistory.dealId, id)).orderBy(desc(dealHistory.createdAt)),
    db.select().from(activities).where(eq(activities.dealId, id)).orderBy(desc(activities.createdAt)),
  ]);

  return NextResponse.json({ deal, history, activities: dealActivities });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isAllowedWorkspaceRole(auth.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const limit = checkRateLimit(clientKey(request, "write"), 120, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = dealUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid deal update" }, { status: 400 });
  }

  const db = await getDb();
  const [existing] = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  const { stageNote, ...updates } = parsed.data;
  const stageChanged = updates.stage !== undefined && updates.stage !== existing.stage;
  const nextStage = updates.stage ?? existing.stage;
  const nextClosedAt =
    nextStage === "won" || nextStage === "lost" ? existing.closedAt ?? new Date() : stageChanged ? null : existing.closedAt;

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(deals)
      .set({
        ...updates,
        ...(stageChanged && updates.probability === undefined ? { probability: stageProbability(nextStage) } : {}),
        closedAt: nextClosedAt,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning();

    if (stageChanged) {
      await tx.insert(dealHistory).values({
        dealId: id,
        fromStage: existing.stage,
        toStage: nextStage,
        changedBy: auth.user.name,
        note: stageNote || `Moved stage from ${existing.stage} to ${nextStage}`,
      });
    }

    return row;
  });

  return NextResponse.json({ deal: updated });
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
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });

  const db = await getDb();
  const [deleted] = await db.delete(deals).where(eq(deals.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  return NextResponse.json({ ok: true, id: deleted.id });
}

