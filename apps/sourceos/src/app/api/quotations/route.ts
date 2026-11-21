import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { quotations, rfqs } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { createQuotationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = createQuotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid quotation payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, parsed.data.rfqId)).limit(1);
  if (!rfq) {
    return NextResponse.json({ error: "Target RFQ not found." }, { status: 404 });
  }
  if (rfq.status === "awarded") {
    return NextResponse.json({ error: "Cannot add quotation to an already awarded RFQ." }, { status: 400 });
  }

  const [created] = await db.insert(quotations).values(parsed.data).returning();
  if (rfq.status === "open") {
    await db
      .update(rfqs)
      .set({ status: "evaluating", updatedAt: new Date() })
      .where(eq(rfqs.id, rfq.id));
  }

  return NextResponse.json({ quotation: created }, { status: 201 });
}
