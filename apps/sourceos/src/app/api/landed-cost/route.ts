import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { landedCostScenarios } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { calculateLandedCost } from "@/lib/landed-cost";
import { verifyCsrfOrigin } from "@/lib/security";
import { createLandedCostSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const rows = await db
    .select()
    .from(landedCostScenarios)
    .orderBy(desc(landedCostScenarios.createdAt));

  return NextResponse.json({ scenarios: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = createLandedCostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid landed-cost scenario." },
      { status: 400 },
    );
  }

  const calc = calculateLandedCost(parsed.data);
  const db = await getDb();
  const [created] = await db
    .insert(landedCostScenarios)
    .values({
      title: parsed.data.title,
      productPriceCents: parsed.data.productPriceCents,
      quantity: parsed.data.quantity,
      freightCents: parsed.data.freightCents,
      insuranceCents: parsed.data.insuranceCents,
      customsDutyPct: parsed.data.customsDutyPct,
      otherExpensesCents: parsed.data.otherExpensesCents,
      currency: calc.currency,
      exchangeRateToUsd: calc.exchangeRateToUsd,
      totalLandedUsdCents: calc.totalLandedUsdCents,
      perUnitLandedUsdCents: calc.perUnitLandedUsdCents,
      notes: parsed.data.notes,
    })
    .returning();

  return NextResponse.json({ scenario: created, breakdown: calc }, { status: 201 });
}
