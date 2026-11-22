import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireApiUser } from "@/lib/auth";
import {
  awardQuotationAndCreatePo,
  isUniqueViolation,
  ProcurementError,
} from "@/lib/procurement";
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
    if (err instanceof ProcurementError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "This RFQ has already been awarded." },
        { status: 409 },
      );
    }
    const message = err instanceof Error ? err.message : "Failed to award quotation.";
    const status = message.includes("not found")
      ? 404
      : message.includes("already been awarded")
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
