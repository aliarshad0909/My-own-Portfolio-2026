import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { budgets, currencyRates } from "@/db/schema";
import { isFinanceWriter, requireApiUser } from "@/lib/auth";
import { getFinancialOverview, logAudit } from "@/lib/accounting";
import { checkRateLimit, clientKey, verifyCsrfOrigin } from "@/lib/security";
import { budgetUpsertSchema, currencyRateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const overview = await getFinancialOverview();
  return NextResponse.json({
    budgets: overview.budgetStatus,
    currencyRates: overview.currencyRates,
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isFinanceWriter(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const db = await getDb();

  if (body && body.kind === "currency") {
    const parsed = currencyRateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid FX rate" }, { status: 400 });
    }
    const existing = await db
      .select()
      .from(currencyRates)
      .where(eq(currencyRates.code, parsed.data.code))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(currencyRates)
        .set({
          name: parsed.data.name,
          rateToUsd: parsed.data.rateToUsd,
          note: parsed.data.note,
          updatedAt: new Date(),
        })
        .where(eq(currencyRates.code, parsed.data.code));
    } else {
      await db.insert(currencyRates).values(parsed.data);
    }
    await logAudit({
      action: "FX_RATE_UPDATED",
      entityType: "currency",
      entityId: parsed.data.code,
      summary: `Set ${parsed.data.code} reference rate to ${parsed.data.rateToUsd} USD.`,
      actor: auth.user.name,
    });
    return NextResponse.json({ ok: true });
  }

  const parsed = budgetUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid budget" }, { status: 400 });
  }

  const existing = await db.select().from(budgets).where(eq(budgets.category, parsed.data.category)).limit(1);
  if (existing.length > 0) {
    await db
      .update(budgets)
      .set({
        monthlyLimitCents: parsed.data.monthlyLimitCents,
        period: parsed.data.period,
        ownerName: parsed.data.ownerName,
      })
      .where(eq(budgets.id, existing[0].id));
  } else {
    await db.insert(budgets).values(parsed.data);
  }

  await logAudit({
    action: "BUDGET_UPSERT",
    entityType: "budget",
    summary: `Configured budget for "${parsed.data.category}" at $${(parsed.data.monthlyLimitCents / 100).toFixed(2)}.`,
    actor: auth.user.name,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
