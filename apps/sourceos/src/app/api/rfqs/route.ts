import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { quotations, rfqs, suppliers } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { generateOrderCode } from "@/lib/procurement";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createRfqSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [rfqRows, quoteRows, supplierRows] = await Promise.all([
    db.select().from(rfqs).orderBy(desc(rfqs.createdAt)),
    db.select().from(quotations).orderBy(desc(quotations.createdAt)),
    db.select().from(suppliers),
  ]);

  const supplierMap = new Map(supplierRows.map((s) => [s.id, s]));

  const enriched = rfqRows.map((rfq) => {
    const rfqQuotes = quoteRows
      .filter((q) => q.rfqId === rfq.id)
      .map((q) => {
        const sup = supplierMap.get(q.supplierId);
        return {
          ...q,
          supplierName: sup?.name ?? "Unknown Supplier",
          supplierCountry: sup?.country ?? "—",
          supplierRating: sup?.rating ?? 0,
          supplierOnTimePct: sup?.onTimePct ?? 0,
          supplierStatus: sup?.qualificationStatus ?? "under_review",
          estimatedTotalCents:
            Math.max(rfq.targetQty, q.moq) * q.unitPriceCents + q.freightEstimateCents,
        };
      });
    return { ...rfq, quotations: rfqQuotes };
  });

  return NextResponse.json({ rfqs: enriched, suppliers: supplierRows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const rl = checkRateLimit(clientKey(request, "rfqs-write"), 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createRfqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid RFQ data." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [created] = await db
    .insert(rfqs)
    .values({
      rfqNumber: generateOrderCode("RFQ"),
      title: parsed.data.title,
      targetQty: parsed.data.targetQty,
      targetUnitCents: parsed.data.targetUnitCents,
      currency: parsed.data.currency.toUpperCase(),
      status: "open",
      dueDate: parsed.data.dueDate,
      notes: parsed.data.notes,
    })
    .returning();

  return NextResponse.json({ rfq: created }, { status: 201 });
}
