import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { purchaseOrders, suppliers } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { isUniqueViolation, withUniqueCodeRetry } from "@/lib/procurement";
import { verifyCsrfOrigin } from "@/lib/security";
import { createPurchaseOrderSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [poRows, supplierRows] = await Promise.all([
    db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt)),
    db.select().from(suppliers),
  ]);
  const supMap = new Map(supplierRows.map((s) => [s.id, s]));

  return NextResponse.json({
    purchaseOrders: poRows.map((p) => ({
      ...p,
      supplierName: supMap.get(p.supplierId)?.name ?? "Unknown Supplier",
      supplierCountry: supMap.get(p.supplierId)?.country ?? "—",
    })),
    suppliers: supplierRows,
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = createPurchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid purchase order payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const totalCents = parsed.data.quantity * parsed.data.unitCostCents;

  try {
    const created = await withUniqueCodeRetry(
      db,
      "PO",
      "purchase_orders_po_number_key",
      async (poNumber) => {
        const [row] = await db
          .insert(purchaseOrders)
          .values({
            poNumber,
            supplierId: parsed.data.supplierId,
            rfqId: parsed.data.rfqId ?? null,
            itemName: parsed.data.itemName,
            quantity: parsed.data.quantity,
            unitCostCents: parsed.data.unitCostCents,
            totalCents,
            incoterms: parsed.data.incoterms,
            status: "ordered",
          })
          .returning();
        return row;
      },
    );

    return NextResponse.json({ purchaseOrder: created }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err, "purchase_orders_rfq_id_uidx")) {
      return NextResponse.json(
        { error: "A purchase order already exists for this RFQ." },
        { status: 409 },
      );
    }
    throw err;
  }
}
