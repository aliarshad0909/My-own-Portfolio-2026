import { desc, eq } from "drizzle-orm";
import type { SourceOsDb } from "@/db";
import {
  documents,
  landedCostScenarios,
  purchaseOrders,
  quotations,
  rfqs,
  shipments,
  suppliers,
  type PoStatus,
  type QualificationStatus,
  type ShipmentStatus,
} from "@/db/schema";

export function generateOrderCode(prefix: "RFQ" | "PO" | "SHP"): string {
  const yr = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${yr}-${suffix}`;
}

/**
 * Atomically awards a quotation on an RFQ and creates the corresponding Purchase Order:
 * 1. Verifies quotation and parent RFQ exist.
 * 2. Marks all sibling quotations unselected and the winning quotation selected = true.
 * 3. Updates the RFQ status to 'awarded'.
 * 4. Inserts a new Purchase Order linked to the RFQ and supplier.
 */
export async function awardQuotationAndCreatePo(db: SourceOsDb, quotationId: string) {
  return db.transaction(async (tx) => {
    const [quote] = await tx
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId))
      .limit(1);

    if (!quote) {
      throw new Error("Quotation not found");
    }

    const [rfq] = await tx
      .select()
      .from(rfqs)
      .where(eq(rfqs.id, quote.rfqId))
      .limit(1);

    if (!rfq) {
      throw new Error("Parent RFQ not found");
    }

    if (rfq.status === "awarded") {
      throw new Error("This RFQ has already been awarded");
    }

    const [supplier] = await tx
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, quote.supplierId))
      .limit(1);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Deselect any sibling quotations and select the awarded one
    await tx
      .update(quotations)
      .set({ selected: false })
      .where(eq(quotations.rfqId, rfq.id));

    const [awardedQuote] = await tx
      .update(quotations)
      .set({ selected: true })
      .where(eq(quotations.id, quote.id))
      .returning();

    const [updatedRfq] = await tx
      .update(rfqs)
      .set({ status: "awarded", updatedAt: new Date() })
      .where(eq(rfqs.id, rfq.id))
      .returning();

    const orderQty = Math.max(rfq.targetQty, quote.moq);
    const totalCents = orderQty * quote.unitPriceCents;
    const poNumber = generateOrderCode("PO");

    const [createdPo] = await tx
      .insert(purchaseOrders)
      .values({
        poNumber,
        supplierId: quote.supplierId,
        rfqId: rfq.id,
        itemName: rfq.title,
        quantity: orderQty,
        unitCostCents: quote.unitPriceCents,
        totalCents,
        incoterms: quote.incoterms,
        status: "ordered",
      })
      .returning();

    return {
      rfq: updatedRfq,
      quotation: awardedQuote,
      purchaseOrder: createdPo,
      supplierName: supplier.name,
    };
  });
}

export async function updateSupplierQualification(
  db: SourceOsDb,
  supplierId: string,
  qualificationStatus: QualificationStatus,
) {
  const [updated] = await db
    .update(suppliers)
    .set({ qualificationStatus, updatedAt: new Date() })
    .where(eq(suppliers.id, supplierId))
    .returning();
  return updated ?? null;
}

export async function updatePurchaseOrderStatus(
  db: SourceOsDb,
  poId: string,
  status: PoStatus,
) {
  const [updated] = await db
    .update(purchaseOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(purchaseOrders.id, poId))
    .returning();
  return updated ?? null;
}

export async function updateShipmentStatus(
  db: SourceOsDb,
  shipmentId: string,
  status: ShipmentStatus,
  etaDate?: string,
) {
  const [updated] = await db
    .update(shipments)
    .set({
      status,
      ...(etaDate ? { etaDate } : {}),
      updatedAt: new Date(),
    })
    .where(eq(shipments.id, shipmentId))
    .returning();
  return updated ?? null;
}

export async function getDashboardSummary(db: SourceOsDb) {
  const [allSuppliers, allRfqs, allQuotes, allPos, allShipments, allDocs, allScenarios] =
    await Promise.all([
      db.select().from(suppliers).orderBy(desc(suppliers.onTimePct)),
      db.select().from(rfqs).orderBy(desc(rfqs.createdAt)),
      db.select().from(quotations),
      db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt)),
      db.select().from(shipments).orderBy(desc(shipments.createdAt)),
      db.select().from(documents).orderBy(desc(documents.createdAt)),
      db.select().from(landedCostScenarios).orderBy(desc(landedCostScenarios.createdAt)),
    ]);

  const supplierMap = new Map(allSuppliers.map((s) => [s.id, s]));
  const poMap = new Map(allPos.map((p) => [p.id, p]));

  const approvedSuppliers = allSuppliers.filter((s) => s.qualificationStatus === "approved").length;
  const openRfqs = allRfqs.filter((r) => r.status !== "awarded").length;
  const activePos = allPos.filter((p) => p.status !== "delivered");
  const totalPoSpendCents = allPos.reduce((acc, p) => acc + Number(p.totalCents), 0);
  const inTransitShipments = allShipments.filter(
    (s) => s.status === "in_transit" || s.status === "customs",
  ).length;
  const avgOnTimePct =
    allSuppliers.length > 0
      ? Number(
          (
            allSuppliers.reduce((acc, s) => acc + s.onTimePct, 0) / allSuppliers.length
          ).toFixed(1),
        )
      : 0;

  const quoteCountByRfq = new Map<string, number>();
  for (const q of allQuotes) {
    quoteCountByRfq.set(q.rfqId, (quoteCountByRfq.get(q.rfqId) ?? 0) + 1);
  }

  return {
    kpis: {
      totalSuppliers: allSuppliers.length,
      approvedSuppliers,
      openRfqs,
      activePoCount: activePos.length,
      totalPoCount: allPos.length,
      totalPoSpendCents,
      inTransitShipments,
      avgOnTimePct,
      pendingDocuments: allDocs.filter((d) => d.status !== "verified").length,
      savedScenarios: allScenarios.length,
    },
    topSuppliers: allSuppliers.slice(0, 6),
    recentRfqs: allRfqs.slice(0, 5).map((r) => ({
      ...r,
      quotationCount: quoteCountByRfq.get(r.id) ?? 0,
    })),
    activeShipments: allShipments.slice(0, 5).map((s) => {
      const po = poMap.get(s.poId);
      const sup = po ? supplierMap.get(po.supplierId) : undefined;
      return {
        ...s,
        poNumber: po?.poNumber ?? "N/A",
        itemName: po?.itemName ?? "Procurement Cargo",
        supplierName: sup?.name ?? "Global Supplier",
      };
    }),
    recentPos: allPos.slice(0, 5).map((p) => ({
      ...p,
      supplierName: supplierMap.get(p.supplierId)?.name ?? "Unknown Supplier",
    })),
    recentDocuments: allDocs.slice(0, 4),
  };
}
