import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { purchaseOrders, shipments, suppliers } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { withUniqueCodeRetry } from "@/lib/procurement";
import { verifyCsrfOrigin } from "@/lib/security";
import { createShipmentSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [shipmentRows, poRows, supRows] = await Promise.all([
    db.select().from(shipments).orderBy(desc(shipments.createdAt)),
    db.select().from(purchaseOrders),
    db.select().from(suppliers),
  ]);

  const poMap = new Map(poRows.map((p) => [p.id, p]));
  const supMap = new Map(supRows.map((s) => [s.id, s]));

  return NextResponse.json({
    shipments: shipmentRows.map((s) => {
      const po = poMap.get(s.poId);
      const sup = po ? supMap.get(po.supplierId) : undefined;
      return {
        ...s,
        poNumber: po?.poNumber ?? "N/A",
        itemName: po?.itemName ?? "Cargo",
        supplierName: sup?.name ?? "Unknown Supplier",
      };
    }),
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = createShipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid shipment payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const created = await withUniqueCodeRetry(
    db,
    "SHP",
    "shipments_tracking_code_key",
    async (trackingCode) => {
      const [row] = await db
        .insert(shipments)
        .values({
          trackingCode,
          poId: parsed.data.poId,
          carrier: parsed.data.carrier,
          mode: parsed.data.mode,
          originPort: parsed.data.originPort,
          destPort: parsed.data.destPort,
          status: "booked",
          etaDate: parsed.data.etaDate,
          freightCents: parsed.data.freightCents,
          insuranceCents: parsed.data.insuranceCents,
          dutyCents: parsed.data.dutyCents,
        })
        .returning();
      return row;
    },
  );

  return NextResponse.json({ shipment: created }, { status: 201 });
}
