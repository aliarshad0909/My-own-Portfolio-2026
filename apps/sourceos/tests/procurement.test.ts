import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";

// Force isolated in-memory PostgreSQL (PGlite) for deterministic DB tests
process.env.DATABASE_URL = "";
process.env.SOURCEOS_DATABASE_URL = "";
process.env.PGLITE_DATA_DIR = "memory://";

import { getDb, resetDemoWorkspace } from "@/db";
import {
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
  awardQuotationAndCreatePo,
  getDashboardSummary,
  updateShipmentStatus,
  updateSupplierQualification,
} from "@/lib/procurement";

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

  it("resets the demo workspace cleanly back to baseline seed state", async () => {
    await resetDemoWorkspace();
    const db = await getDb();

    const [resetRfq] = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.rfqNumber, "RFQ-2026-104"))
      .limit(1);
    assert.ok(resetRfq);
    assert.equal(resetRfq.status, "evaluating");

    const allScenarios = await db.select().from(landedCostScenarios);
    assert.equal(allScenarios.length, 3);

    const allPos = await db.select().from(purchaseOrders);
    assert.equal(allPos.length, 4);
  });
});
