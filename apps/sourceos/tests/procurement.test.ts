import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";

// Force isolated in-memory PostgreSQL (PGlite) for deterministic DB tests
process.env.DATABASE_URL = "";
process.env.SOURCEOS_DATABASE_URL = "";
process.env.PGLITE_DATA_DIR = "memory://";

import { getDb, resetDemoWorkspace } from "@/db";
import {
  documents,
  landedCostScenarios,
  purchaseOrders,
  quotations,
  rfqs,
  shipments,
  suppliers,
} from "@/db/schema";
import {
  generateLockedPassword,
  hashPassword,
  resolveSessionSecret,
  verifyPassword,
} from "@/lib/crypto";
import { calculateLandedCost } from "@/lib/landed-cost";
import {
  allocateOrderCode,
  awardQuotationAndCreatePo,
  getDashboardSummary,
  isUniqueViolation,
  ProcurementError,
  updateShipmentStatus,
  updateSupplierQualification,
  withUniqueCodeRetry,
} from "@/lib/procurement";
import {
  getLandedCostSnapshotKey,
  getOrdersSnapshotKey,
  getRfqsSnapshotKey,
  getSuppliersSnapshotKey,
  reconcileWorkspaceSelections,
} from "@/lib/workspace-sync";

describe("Landed-Cost Calculator Engine", () => {
  it("computes FOB, CIF, customs duty, total landed, and per-unit cost accurately in USD", () => {
    const result = calculateLandedCost({
      productPriceCents: 5000, // $50.00
      quantity: 1000,
      freightCents: 400000, // $4,000.00
      insuranceCents: 50000, // $500.00
      customsDutyPct: 10, // 10% of CIF
      otherExpensesCents: 150000, // $1,500.00
      currency: "USD",
      exchangeRateToUsd: 1.0,
    });

    // FOB = 50 * 1000 = $50,000 (5,000,000 cents)
    assert.equal(result.fobSourceCents, 5_000_000);
    // CIF = 50,000 + 4,000 + 500 = $54,500 (5,450,000 cents)
    assert.equal(result.cifSourceCents, 5_450_000);
    // Duty = 10% of $54,500 = $5,450 (545,000 cents)
    assert.equal(result.dutySourceCents, 545_000);
    // Total = 54,500 + 5,450 + 1,500 = $61,450 (6,145,000 cents)
    assert.equal(result.totalLandedSourceCents, 6_145_000);
    assert.equal(result.totalLandedUsdCents, 6_145_000);
    // Per-unit = $61.45 (6,145 cents)
    assert.equal(result.perUnitLandedUsdCents, 6_145);
    assert.equal(result.overheadPctOverFob, 22.9);
  });

  it("applies FX exchange rate accurately for EUR/CNY scenarios", () => {
    const result = calculateLandedCost({
      productPriceCents: 10000, // €100.00
      quantity: 200,
      freightCents: 200000, // €2,000.00
      insuranceCents: 25000, // €250.00
      customsDutyPct: 5, // 5%
      otherExpensesCents: 75000, // €750.00
      currency: "EUR",
      exchangeRateToUsd: 1.1,
    });

    // FOB = €20,000 (2,000,000)
    // CIF = €22,250 (2,225,000)
    // Duty = 5% of 2,225,000 = 111,250 (€1,112.50)
    // Total EUR = 2,225,000 + 111,250 + 75,000 = 2,411,250 (€24,112.50)
    // Total USD @ 1.1 = 2,652,375 ($26,523.75)
    // Per-unit USD = round(2,652,375 / 200) = 13,262 ($132.62)
    assert.equal(result.fobSourceCents, 2_000_000);
    assert.equal(result.cifSourceCents, 2_225_000);
    assert.equal(result.dutySourceCents, 111_250);
    assert.equal(result.totalLandedSourceCents, 2_411_250);
    assert.equal(result.totalLandedUsdCents, 2_652_375);
    assert.equal(result.perUnitLandedUsdCents, 13_262);
  });
});

describe("Security & Crypto Hardening", () => {
  it("hashes and verifies passwords with scrypt and generates unique locked passwords", () => {
    const hash = hashPassword("SourceDemo2026!");
    assert.equal(verifyPassword("SourceDemo2026!", hash), true);
    assert.equal(verifyPassword("WrongPassword", hash), false);
    const lockedA = generateLockedPassword();
    const lockedB = generateLockedPassword();
    assert.equal(lockedA.length, 64);
    assert.notEqual(lockedA, lockedB);
  });

  it("enforces minimum 32-char SESSION_SECRET when RENDER=true", () => {
    const prevRender = process.env.RENDER;
    const prevSecret = process.env.SESSION_SECRET;
    try {
      process.env.RENDER = "true";
      process.env.SESSION_SECRET = "too-short";
      assert.throws(() => resolveSessionSecret(), /at least 32 random characters/);
      process.env.SESSION_SECRET = "a".repeat(40);
      assert.equal(resolveSessionSecret(), "a".repeat(40));
    } finally {
      if (prevRender === undefined) delete process.env.RENDER;
      else process.env.RENDER = prevRender;
      if (prevSecret === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = prevSecret;
    }
  });
});

describe("PostgreSQL Procurement Workflows (PGlite)", () => {
  it("awards an RFQ quotation atomically and auto-creates a Purchase Order", async () => {
    const db = await getDb();
    const [openRfq] = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.rfqNumber, "RFQ-2026-104"))
      .limit(1);
    assert.ok(openRfq, "Seeded RFQ-2026-104 should exist");
    assert.notEqual(openRfq.status, "awarded");

    const rfqQuotes = await db
      .select()
      .from(quotations)
      .where(eq(quotations.rfqId, openRfq.id));
    assert.ok(rfqQuotes.length >= 2, "RFQ-2026-104 should have multiple quotations");

    const winningQuote = rfqQuotes[0];
    const result = await awardQuotationAndCreatePo(db, winningQuote.id);

    assert.equal(result.rfq.status, "awarded");
    assert.equal(result.quotation.selected, true);
    assert.equal(result.purchaseOrder.rfqId, openRfq.id);
    assert.equal(result.purchaseOrder.supplierId, winningQuote.supplierId);
    assert.equal(result.purchaseOrder.status, "ordered");
    const expectedQty = Math.max(openRfq.targetQty, winningQuote.moq);
    assert.equal(result.purchaseOrder.quantity, expectedQty);
    assert.equal(result.purchaseOrder.totalCents, expectedQty * winningQuote.unitPriceCents);

    // Persisted in purchase_orders table
    const [persistedPo] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, result.purchaseOrder.id))
      .limit(1);
    assert.ok(persistedPo);

    // Double-awarding the same RFQ must fail cleanly
    await assert.rejects(
      () => awardQuotationAndCreatePo(db, rfqQuotes[1].id),
      /already been awarded/,
    );
  });

  it("updates shipment status, supplier qualification, and saves landed-cost scenarios in PostgreSQL", async () => {
    const db = await getDb();

    // Shipment status transition
    const [shipment] = await db.select().from(shipments).limit(1);
    assert.ok(shipment);
    const updatedShip = await updateShipmentStatus(db, shipment.id, "delivered");
    assert.equal(updatedShip?.status, "delivered");

    // Supplier qualification transition
    const [sup] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.qualificationStatus, "under_review"))
      .limit(1);
    assert.ok(sup);
    const approvedSup = await updateSupplierQualification(db, sup.id, "approved");
    assert.equal(approvedSup?.qualificationStatus, "approved");

    // Landed-cost persistence
    const calc = calculateLandedCost({
      productPriceCents: 3500,
      quantity: 400,
      freightCents: 210000,
      insuranceCents: 28000,
      customsDutyPct: 8.5,
      otherExpensesCents: 75000,
      currency: "USD",
      exchangeRateToUsd: 1.0,
    });
    const [savedScenario] = await db
      .insert(landedCostScenarios)
      .values({
        title: "Test Scenario — Vietnam Enclosures",
        productPriceCents: 3500,
        quantity: 400,
        freightCents: 210000,
        insuranceCents: 28000,
        customsDutyPct: 8.5,
        otherExpensesCents: 75000,
        currency: "USD",
        exchangeRateToUsd: 1.0,
        totalLandedUsdCents: calc.totalLandedUsdCents,
        perUnitLandedUsdCents: calc.perUnitLandedUsdCents,
        notes: "Automated test scenario",
      })
      .returning();
    assert.equal(savedScenario.totalLandedUsdCents, calc.totalLandedUsdCents);

    const summary = await getDashboardSummary(db);
    assert.ok(summary.kpis.totalSuppliers >= 8);
    assert.ok(summary.kpis.savedScenarios >= 4);
  });

  it("resets the demo workspace cleanly back to baseline seed state and reconciles stale client IDs", async () => {
    const db = await getDb();

    // Snapshot pre-reset IDs and workspace keys
    const [
      preSuppliers,
      preRfqs,
      preQuotes,
      prePos,
      preShipments,
      preDocs,
      preScenarios,
    ] = await Promise.all([
      db.select().from(suppliers),
      db.select().from(rfqs),
      db.select().from(quotations),
      db.select().from(purchaseOrders),
      db.select().from(shipments),
      db.select().from(documents),
      db.select().from(landedCostScenarios),
    ]);

    const preSupplierIds = new Set(preSuppliers.map((s) => s.id));
    const preRfqIds = new Set(preRfqs.map((r) => r.id));
    const prePoIds = new Set(prePos.map((p) => p.id));
    const preScenarioIds = new Set(preScenarios.map((s) => s.id));

    const preSuppliersKey = getSuppliersSnapshotKey(preSuppliers);
    const preRfqsKey = getRfqsSnapshotKey(
      preRfqs.map((r) => ({
        ...r,
        quotations: preQuotes.filter((q) => q.rfqId === r.id),
      })),
      preSuppliers,
    );
    const preOrdersKey = getOrdersSnapshotKey(prePos, preShipments, preDocs, preSuppliers);
    const preLandedKey = getLandedCostSnapshotKey(preScenarios);

    await resetDemoWorkspace();

    const [
      postSuppliers,
      postRfqs,
      postQuotes,
      postPos,
      postShipments,
      postDocs,
      postScenarios,
    ] = await Promise.all([
      db.select().from(suppliers),
      db.select().from(rfqs),
      db.select().from(quotations),
      db.select().from(purchaseOrders),
      db.select().from(shipments),
      db.select().from(documents),
      db.select().from(landedCostScenarios),
    ]);

    const resetRfq = postRfqs.find((r) => r.rfqNumber === "RFQ-2026-104");
    assert.ok(resetRfq);
    assert.equal(resetRfq.status, "evaluating");
    assert.equal(postScenarios.length, 3);
    assert.equal(postPos.length, 4);

    // Every pre-reset UUID must be gone after workspace reset
    assert.equal(postSuppliers.some((s) => preSupplierIds.has(s.id)), false);
    assert.equal(postRfqs.some((r) => preRfqIds.has(r.id)), false);
    assert.equal(postPos.some((p) => prePoIds.has(p.id)), false);
    assert.equal(postScenarios.some((s) => preScenarioIds.has(s.id)), false);

    // Every client workspace snapshot key must change so mounted views remount cleanly
    const postSuppliersKey = getSuppliersSnapshotKey(postSuppliers);
    const postRfqsKey = getRfqsSnapshotKey(
      postRfqs.map((r) => ({
        ...r,
        quotations: postQuotes.filter((q) => q.rfqId === r.id),
      })),
      postSuppliers,
    );
    const postOrdersKey = getOrdersSnapshotKey(postPos, postShipments, postDocs, postSuppliers);
    const postLandedKey = getLandedCostSnapshotKey(postScenarios);

    assert.notEqual(postSuppliersKey, preSuppliersKey);
    assert.notEqual(postRfqsKey, preRfqsKey);
    assert.notEqual(postOrdersKey, preOrdersKey);
    assert.notEqual(postLandedKey, preLandedKey);

    // Client selection reconciliation replaces all stale deleted UUIDs with valid post-reset IDs
    const reconciled = reconcileWorkspaceSelections({
      previous: {
        selectedSupplierId: preSuppliers[0]?.id ?? null,
        selectedRfqId: preRfqs[0]?.id ?? "",
        quoteSupplierId: preSuppliers[0]?.id ?? "",
        poSupplierId: preSuppliers[0]?.id ?? "",
        shipPoId: prePos[0]?.id ?? "",
        docEntityRef: "PO-DELETED-9999",
      },
      next: {
        suppliers: postSuppliers,
        rfqs: postRfqs,
        pos: postPos,
      },
    });

    assert.equal(reconciled.selectedSupplierId, postSuppliers[0].id);
    assert.equal(preSupplierIds.has(reconciled.selectedSupplierId ?? ""), false);
    assert.equal(reconciled.selectedRfqId, postRfqs[0].id);
    assert.equal(preRfqIds.has(reconciled.selectedRfqId), false);
    assert.equal(reconciled.quoteSupplierId, postSuppliers[0].id);
    assert.equal(reconciled.poSupplierId, postSuppliers[0].id);
    assert.equal(reconciled.shipPoId, postPos[0].id);
    assert.equal(prePoIds.has(reconciled.shipPoId), false);
    assert.equal(reconciled.docEntityRef, postPos[0].poNumber);
  });

  it("serializes concurrent RFQ awards so only one succeeds and only one PO exists per RFQ", async () => {
    await resetDemoWorkspace();
    const db = await getDb();

    const [openRfq] = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.rfqNumber, "RFQ-2026-105"))
      .limit(1);
    assert.ok(openRfq, "Seeded RFQ-2026-105 should exist");

    const rfqQuotes = await db
      .select()
      .from(quotations)
      .where(eq(quotations.rfqId, openRfq.id));
    assert.ok(rfqQuotes.length >= 2, "RFQ-2026-105 should have at least two quotations");

    // Fire two simultaneous award requests for different quotations on the same RFQ
    const outcomes = await Promise.allSettled([
      awardQuotationAndCreatePo(db, rfqQuotes[0].id),
      awardQuotationAndCreatePo(db, rfqQuotes[1].id),
    ]);

    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    const rejected = outcomes.filter((o) => o.status === "rejected");

    assert.equal(fulfilled.length, 1, "Exactly one concurrent award must succeed");
    assert.equal(rejected.length, 1, "Second concurrent award must reject cleanly");

    const conflictErr = rejected[0].reason;
    assert.ok(conflictErr instanceof ProcurementError, "Rejection should be a ProcurementError");
    assert.equal(conflictErr.statusCode, 409);
    assert.equal(conflictErr.code, "CONFLICT");
    assert.match(conflictErr.message, /already been awarded/);

    // Exactly one Purchase Order exists in purchase_orders for that RFQ
    const rfqPos = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.rfqId, openRfq.id));
    assert.equal(rfqPos.length, 1);

    // Exactly one quotation is marked selected
    const updatedQuotes = await db
      .select()
      .from(quotations)
      .where(eq(quotations.rfqId, openRfq.id));
    assert.equal(updatedQuotes.filter((q) => q.selected).length, 1);

    // Database-level partial unique index rejects any direct duplicate PO for the same RFQ
    const [anySupplier] = await db.select().from(suppliers).limit(1);
    assert.ok(anySupplier);
    await assert.rejects(
      async () => {
        const duplicatePoNumber = await allocateOrderCode(db, "PO");
        await db.insert(purchaseOrders).values({
          poNumber: duplicatePoNumber,
          supplierId: anySupplier.id,
          rfqId: openRfq.id,
          itemName: "Duplicate PO Guard Test",
          quantity: 100,
          unitCostCents: 1000,
          totalCents: 100_000,
          incoterms: "FOB",
          status: "ordered",
        });
      },
      (err: unknown) => isUniqueViolation(err, "purchase_orders_rfq_id_uidx"),
    );

    // Direct POs with rfqId = null remain allowed (partial index only constrains NOT NULL)
    const [directA, directB] = await Promise.all([
      allocateOrderCode(db, "PO"),
      allocateOrderCode(db, "PO"),
    ]);
    await db.insert(purchaseOrders).values([
      {
        poNumber: directA,
        supplierId: anySupplier.id,
        rfqId: null,
        itemName: "Direct PO Alpha",
        quantity: 50,
        unitCostCents: 2000,
        totalCents: 100_000,
        incoterms: "FOB",
        status: "ordered",
      },
      {
        poNumber: directB,
        supplierId: anySupplier.id,
        rfqId: null,
        itemName: "Direct PO Beta",
        quantity: 60,
        unitCostCents: 2000,
        totalCents: 120_000,
        incoterms: "CIF",
        status: "ordered",
      },
    ]);
  });

  it("allocates collision-safe unique RFQ, PO, and shipment codes under concurrent load", async () => {
    const db = await getDb();
    const countPerType = 60;

    const [rfqCodes, poCodes, shipCodes] = await Promise.all([
      Promise.all(Array.from({ length: countPerType }, () => allocateOrderCode(db, "RFQ"))),
      Promise.all(Array.from({ length: countPerType }, () => allocateOrderCode(db, "PO"))),
      Promise.all(Array.from({ length: countPerType }, () => allocateOrderCode(db, "SHP"))),
    ]);

    assert.equal(new Set(rfqCodes).size, countPerType, "All 60 concurrent RFQ codes must be unique");
    assert.equal(new Set(poCodes).size, countPerType, "All 60 concurrent PO codes must be unique");
    assert.equal(
      new Set(shipCodes).size,
      countPerType,
      "All 60 concurrent shipment codes must be unique",
    );

    const yr = new Date().getFullYear();
    for (const code of rfqCodes) {
      assert.match(code, new RegExp(`^RFQ-${yr}-\\d{4,}$`));
    }
    for (const code of poCodes) {
      assert.match(code, new RegExp(`^PO-${yr}-\\d{4,}$`));
    }
    for (const code of shipCodes) {
      assert.match(code, new RegExp(`^SHP-${yr}-\\d{4,}$`));
    }

    // Verify retry helper recovers cleanly from a simulated unique-code collision
    let attempts = 0;
    const allocatedOnRetry = await withUniqueCodeRetry(
      db,
      "PO",
      "purchase_orders_po_number_key",
      async (code) => {
        attempts += 1;
        if (attempts === 1) {
          throw Object.assign(new Error("duplicate key value violates unique constraint"), {
            code: "23505",
            constraint: "purchase_orders_po_number_key",
          });
        }
        return code;
      },
    );
    assert.equal(attempts, 2);
    assert.match(allocatedOnRetry, new RegExp(`^PO-${yr}-\\d{4,}$`));
  });
});
