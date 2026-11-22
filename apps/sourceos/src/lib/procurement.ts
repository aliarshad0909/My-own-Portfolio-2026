import { and, desc, eq, ne, sql, type SQL } from "drizzle-orm";
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

const SEQUENCE_MAP = {
  RFQ: "sourceos_rfq_seq",
  PO: "sourceos_po_seq",
  SHP: "sourceos_ship_seq",
} as const;

export type ProcurementCodePrefix = keyof typeof SEQUENCE_MAP;

export type ProcurementSqlExecutor = {
  execute: (query: SQL) => Promise<unknown>;
};

export class ProcurementError extends Error {
  readonly statusCode: number;
  readonly code: "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST";

  constructor(
    message: string,
    statusCode: number,
    code: "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST",
  ) {
    super(message);
    this.name = "ProcurementError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

type PgErrorLike = {
  code?: string;
  constraint?: string;
  message?: string;
  cause?: PgErrorLike;
};

function extractPgError(err: unknown): PgErrorLike | null {
  if (!err || typeof err !== "object") return null;
  const current = err as PgErrorLike;
  if (typeof current.code === "string") return current;
  if (
    current.cause &&
    typeof current.cause === "object" &&
    typeof current.cause.code === "string"
  ) {
    return current.cause;
  }
  return null;
}

export function isUniqueViolation(err: unknown, constraintHint?: string): boolean {
  const pgErr = extractPgError(err);
  if (!pgErr || pgErr.code !== "23505") return false;
  if (!constraintHint) return true;
  return (
    pgErr.constraint === constraintHint ||
    (pgErr.message?.includes(constraintHint) ?? false)
  );
}

/**
 * Allocates a collision-safe procurement identifier backed by a monotonic
 * PostgreSQL sequence (sourceos_rfq_seq / sourceos_po_seq / sourceos_ship_seq).
 */
export async function allocateOrderCode(
  db: ProcurementSqlExecutor,
  prefix: ProcurementCodePrefix,
): Promise<string> {
  const seqName = SEQUENCE_MAP[prefix];
  const result = await db.execute(sql.raw(`SELECT nextval('${seqName}')::text AS next_val`));
  const rows = Array.isArray(result)
    ? (result as Array<{ next_val?: string | number }>)
    : ((result as { rows?: Array<{ next_val?: string | number }> }).rows ?? []);
  const rawVal = rows[0]?.next_val;
  if (rawVal === undefined || rawVal === null) {
    throw new Error(`Failed to allocate sequence identifier for ${prefix}`);
  }
  const yr = new Date().getFullYear();
  const formatted = String(rawVal).padStart(4, "0");
  return `${prefix}-${yr}-${formatted}`;
}

/**
 * Allocates a sequence-backed code and retries cleanly if an unexpected unique
 * collision ever occurs on the code column (e.g., manual out-of-band inserts).
 */
export async function withUniqueCodeRetry<T>(
  db: ProcurementSqlExecutor,
  prefix: ProcurementCodePrefix,
  codeConstraintHint: string,
  operation: (code: string) => Promise<T>,
  maxAttempts = 5,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = await allocateOrderCode(db, prefix);
    try {
      return await operation(code);
    } catch (err) {
      if (isUniqueViolation(err, codeConstraintHint) && attempt < maxAttempts) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Unable to allocate unique ${prefix} code after ${maxAttempts} attempts`);
}

/**
 * Atomically awards a quotation on an RFQ and creates the corresponding Purchase Order:
 * 1. Verifies the quotation exists and locks the parent RFQ row (SELECT ... FOR UPDATE).
 * 2. Performs an atomic conditional transition on the parent RFQ (status <> 'awarded')
 *    before modifying quotations or creating the Purchase Order.
 * 3. Marks sibling quotations unselected and the winning quotation selected = true.
 * 4. Inserts a single Purchase Order linked to the RFQ (also guarded by unique partial
 *    index purchase_orders_rfq_id_uidx) with a sequence-backed PO number.
 */
export async function awardQuotationAndCreatePo(db: SourceOsDb, quotationId: string) {
  try {
    return await db.transaction(async (tx) => {
      const [quote] = await tx
        .select()
        .from(quotations)
        .where(eq(quotations.id, quotationId))
        .limit(1);

      if (!quote) {
        throw new ProcurementError("Quotation not found", 404, "NOT_FOUND");
      }

      // Lock the parent RFQ row before inspecting or updating its award state
      const [rfq] = await tx
        .select()
        .from(rfqs)
        .where(eq(rfqs.id, quote.rfqId))
        .for("update")
        .limit(1);

      if (!rfq) {
        throw new ProcurementError("Parent RFQ not found", 404, "NOT_FOUND");
      }

      if (rfq.status === "awarded") {
        throw new ProcurementError("This RFQ has already been awarded", 409, "CONFLICT");
      }

      const [supplier] = await tx
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, quote.supplierId))
        .limit(1);

      if (!supplier) {
        throw new ProcurementError("Supplier not found", 404, "NOT_FOUND");
      }

      // Atomic conditional transition before awarding quotations or creating a PO
      const [updatedRfq] = await tx
        .update(rfqs)
        .set({ status: "awarded", updatedAt: new Date() })
        .where(and(eq(rfqs.id, rfq.id), ne(rfqs.status, "awarded")))
        .returning();

      if (!updatedRfq) {
        throw new ProcurementError("This RFQ has already been awarded", 409, "CONFLICT");
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

      const orderQty = Math.max(rfq.targetQty, quote.moq);
      const totalCents = orderQty * quote.unitPriceCents;

      let createdPo: typeof purchaseOrders.$inferSelect | undefined;
      for (let attempt = 1; attempt <= 5; attempt++) {
        const poNumber = await allocateOrderCode(tx, "PO");
        try {
          const [inserted] = await tx.transaction(async (sp) =>
            sp
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
              .returning(),
          );
          createdPo = inserted;
          break;
        } catch (err) {
          if (isUniqueViolation(err, "purchase_orders_rfq_id_uidx")) {
            throw new ProcurementError("This RFQ has already been awarded", 409, "CONFLICT");
          }
          if (isUniqueViolation(err, "purchase_orders_po_number_key") && attempt < 5) {
            continue;
          }
          throw err;
        }
      }

      if (!createdPo) {
        throw new Error("Unable to create Purchase Order with a unique PO number");
      }

      return {
        rfq: updatedRfq,
        quotation: awardedQuote,
        purchaseOrder: createdPo,
        supplierName: supplier.name,
      };
    });
  } catch (err) {
    if (err instanceof ProcurementError) {
      throw err;
    }
    if (isUniqueViolation(err, "purchase_orders_rfq_id_uidx")) {
      throw new ProcurementError("This RFQ has already been awarded", 409, "CONFLICT");
    }
    throw err;
  }
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
