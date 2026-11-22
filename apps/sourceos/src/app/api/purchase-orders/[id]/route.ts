import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireApiUser } from "@/lib/auth";
import { updatePurchaseOrderStatus } from "@/lib/procurement";
import { verifyCsrfOrigin } from "@/lib/security";
import { updatePurchaseOrderSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updatePurchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid PO status." }, { status: 400 });
  }

  const db = await getDb();
  const updated = await updatePurchaseOrderStatus(db, id, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: "Purchase order not found." }, { status: 404 });
  }
  return NextResponse.json({ purchaseOrder: updated });
}
