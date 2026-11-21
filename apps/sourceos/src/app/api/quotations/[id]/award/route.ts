import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireApiUser } from "@/lib/auth";
import { awardQuotationAndCreatePo } from "@/lib/procurement";
import { verifyCsrfOrigin } from "@/lib/security";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = await getDb();

  try {
    const result = await awardQuotationAndCreatePo(db, id);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to award quotation.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
