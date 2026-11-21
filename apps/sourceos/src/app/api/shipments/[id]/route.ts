import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireApiUser } from "@/lib/auth";
import { updateShipmentStatus } from "@/lib/procurement";
import { verifyCsrfOrigin } from "@/lib/security";
import { updateShipmentSchema } from "@/lib/validation";

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
  const parsed = updateShipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid shipment status update." }, { status: 400 });
  }

  const db = await getDb();
  const updated = await updateShipmentStatus(db, id, parsed.data.status, parsed.data.etaDate);
  if (!updated) {
    return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  }
  return NextResponse.json({ shipment: updated });
}
