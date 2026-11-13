import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QUOTES, RFQS, SHIPMENTS, SUPPLIERS, TODAY } from "../src/data/seed.ts";
import { DUTY_BY_HS, FREIGHT_RATES, calculateLandedCost, dutyRateFor, estimateArrival } from "../src/lib/landed-cost.ts";
import { WEIGHTS, milestoneVariance, scoreQuotes, shipmentProgress, supplierRisk } from "../src/lib/sourcing.ts";
import type { Incoterm } from "../src/lib/types.ts";

const SHIP = { weightKgPerUnit: 0.42, cbmPerUnit: 0.0021 };
const rfq = RFQS[0];

const baseInput = {
  quantity: 5000, unitPrice: 268, incoterm: "FOB" as Incoterm, mode: "sea_lcl" as const,
  weightKg: 2100, cbm: 10.5, hsCode: "6912", toolingCost: 85000,
};

describe("duty rates", () => {
  it("reads the rate from the HS chapter", () => {
    assert.equal(dutyRateFor("6912"), DUTY_BY_HS["69"]);
    assert.equal(dutyRateFor("9405"), DUTY_BY_HS["94"]);
    assert.equal(dutyRateFor("4420"), 0);
  });
  it("falls back to a default for an unknown chapter", () => {
    assert.equal(dutyRateFor("9999"), 0.05);
  });
});

describe("landed cost", () => {
  it("adds up to the sum of its parts", () => {
    const c = calculateLandedCost(baseInput);
    assert.equal(c.total, c.goods + c.tooling + c.freight + c.insurance + c.duty + c.brokerage + c.inland);
    assert.equal(c.goods, 5000 * 268);
    assert.equal(c.perUnit, Math.round(c.total / 5000));
  });

  it("charges duty at the HS rate on the goods value", () => {
    const c = calculateLandedCost(baseInput);
    assert.equal(c.dutyRate, 0.085);
    assert.equal(c.duty, Math.round(5000 * 268 * 0.085));
  });

  it("applies the freight minimum when the volume is small", () => {
    const tiny = calculateLandedCost({ ...baseInput, quantity: 10, cbm: 0.02, weightKg: 4 });
    assert.equal(tiny.freight, FREIGHT_RATES.sea_lcl.minimum);
  });

  it("charges air freight by weight and sea freight by volume", () => {
    const air = calculateLandedCost({ ...baseInput, mode: "air" });
    assert.equal(air.freight, Math.max(FREIGHT_RATES.air.minimum, 2100 * FREIGHT_RATES.air.perKg));
    const sea = calculateLandedCost({ ...baseInput, mode: "sea_lcl" });
    assert.equal(sea.freight, Math.max(FREIGHT_RATES.sea_lcl.minimum, Math.round(10.5 * FREIGHT_RATES.sea_lcl.perCbm)));
    assert.ok(air.freight > sea.freight, "air should cost more than sea here");
  });

  it("does not charge for anything the incoterm already covers", () => {
    const cif = calculateLandedCost({ ...baseInput, incoterm: "CIF" });
    assert.equal(cif.freight, 0);
    assert.equal(cif.insurance, 0);
    assert.ok(cif.duty > 0, "CIF still owes duty");
    assert.deepEqual(cif.includedByIncoterm, ["Freight", "Insurance"]);

    const ddp = calculateLandedCost({ ...baseInput, incoterm: "DDP" });
    assert.equal(ddp.freight + ddp.insurance + ddp.duty + ddp.brokerage + ddp.inland, 0);
    assert.equal(ddp.total, ddp.goods + ddp.tooling);

    const exw = calculateLandedCost({ ...baseInput, incoterm: "EXW" });
    assert.ok(exw.freight > 0 && exw.duty > 0 && exw.brokerage > 0);
    assert.deepEqual(exw.includedByIncoterm, []);
  });

  it("spreads one-off tooling across the order", () => {
    const withTooling = calculateLandedCost(baseInput);
    const without = calculateLandedCost({ ...baseInput, toolingCost: 0 });
    assert.equal(withTooling.total - without.total, 85000);
    assert.equal(withTooling.perUnit - without.perUnit, Math.round(85000 / 5000));
  });

  it("handles a zero quantity without dividing by zero", () => {
    assert.equal(calculateLandedCost({ ...baseInput, quantity: 0 }).perUnit, 0);
  });

  it("never returns a negative component", () => {
    const c = calculateLandedCost({ ...baseInput, quantity: -5, unitPrice: -100, toolingCost: -50 });
    for (const [k, v] of Object.entries(c)) if (typeof v === "number") assert.ok(v >= 0, `${k} is ${v}`);
  });
});

describe("arrival estimate", () => {
  it("counts lead time in working days then adds transit", () => {
    // 2026-06-30 is a Tuesday; five working days lands on 2026-07-07.
    const arrival = estimateArrival("2026-06-30", 5, "express");
    assert.equal(arrival, "2026-07-11", arrival);
  });
  it("is later for a slower mode", () => {
    const air = estimateArrival(TODAY, 20, "air");
    const sea = estimateArrival(TODAY, 20, "sea_fcl");
    assert.ok(sea > air, `${sea} should be after ${air}`);
  });
  it("treats a zero lead time as transit only", () => {
    assert.equal(estimateArrival("2026-06-30", 0, "express"), "2026-07-04");
  });
});

describe("quote comparison", () => {
  const scored = scoreQuotes(rfq, QUOTES, SUPPLIERS, "sea_lcl", SHIP, TODAY);

  it("scores every quote for the RFQ and nothing else", () => {
    assert.equal(scored.length, 4);
    assert.ok(scored.every((s) => s.quote.rfqId === rfq.id));
  });

  it("ranks by score, highest first", () => {
    for (let i = 1; i < scored.length; i++) assert.ok(scored[i - 1].score >= scored[i].score);
  });

  it("reports landed cost above unit price wherever the buyer still owes costs", () => {
    for (const s of scored) {
      if (s.quote.incoterm === "DDP") {
        // DDP covers freight, duty and delivery, so only tooling is left to spread.
        assert.equal(s.perUnit - s.quote.unitPrice, Math.round(s.quote.toolingCost / rfq.quantity), s.quote.id);
      } else {
        assert.ok(s.perUnit > s.quote.unitPrice, `${s.quote.id}: landed ${s.perUnit} should exceed unit ${s.quote.unitPrice}`);
      }
    }
  });

  it("does not simply award the lowest price: the cheapest quote loses on MOQ and supplier record", () => {
    const cheapest = [...scored].sort((a, b) => a.perUnit - b.perUnit)[0];
    assert.equal(cheapest.quote.id, "Q-102", "Q-102 is cheapest landed");
    assert.notEqual(scored[0].quote.id, "Q-102", "but it should not be ranked first");
    assert.equal(scored[0].quote.id, "Q-101");
    assert.ok(cheapest.belowMoq && cheapest.supplier.qualityRate < scored[0].supplier.qualityRate);
  });

  it("penalises a quote below the required MOQ", () => {
    const below = scored.find((s) => s.quote.id === "Q-102");
    assert.equal(below?.belowMoq, true, "5,000 units is below the 10,000 MOQ");
    assert.ok(below?.breakdown.some((b) => b.label === "Below MOQ" && b.points === -15));
  });

  it("penalises an expired quote", () => {
    const expired = scoreQuotes(RFQS[1], QUOTES, SUPPLIERS, "sea_lcl", SHIP, TODAY).find((s) => s.quote.id === "Q-202");
    assert.equal(expired?.expired, true);
    assert.ok(expired?.breakdown.some((b) => b.label === "Quote expired"));
  });

  it("awards the full cost weighting to the cheapest landed quote and none to the dearest", () => {
    const sortedByCost = [...scored].sort((a, b) => a.perUnit - b.perUnit);
    const best = sortedByCost[0].breakdown.find((b) => b.label === "Landed cost");
    const worst = sortedByCost[sortedByCost.length - 1].breakdown.find((b) => b.label === "Landed cost");
    assert.equal(best?.points, WEIGHTS.cost);
    assert.equal(worst?.points, 0);
  });

  it("explains every point it awards", () => {
    for (const s of scored) {
      const positive = s.breakdown.filter((b) => b.outOf > 0).reduce((t, b) => t + b.points, 0);
      const penalties = s.breakdown.filter((b) => b.outOf === 0).reduce((t, b) => t + b.points, 0);
      assert.equal(s.score, Math.max(0, positive + penalties), s.quote.id);
    }
  });

  it("returns nothing for an RFQ with no quotes", () => {
    assert.deepEqual(scoreQuotes({ ...rfq, id: "RFQ-NONE" }, QUOTES, SUPPLIERS, "air", SHIP, TODAY), []);
  });

  it("changes the ranking when the shipping mode changes", () => {
    const bySea = scoreQuotes(rfq, QUOTES, SUPPLIERS, "sea_lcl", SHIP, TODAY).map((s) => s.perUnit);
    const byAir = scoreQuotes(rfq, QUOTES, SUPPLIERS, "air", SHIP, TODAY).map((s) => s.perUnit);
    assert.notDeepEqual(bySea, byAir, "air freight should change the landed costs");
  });
});

describe("shipment tracking", () => {
  const shipment = SHIPMENTS[0];

  it("counts completed milestones and finds the next one", () => {
    const p = shipmentProgress(shipment, TODAY);
    assert.equal(p.total, 7);
    assert.equal(p.completed, 4);
    assert.equal(p.next?.label, "Arrive Long Beach");
    assert.equal(p.status, "in_transit");
  });

  it("reports delivered when every milestone is done", () => {
    const done = { ...shipment, milestones: shipment.milestones.map((m) => ({ ...m, actualAt: m.actualAt ?? "2026-07-25" })) };
    const p = shipmentProgress(done, TODAY);
    assert.equal(p.status, "delivered");
    assert.equal(p.next, null);
    assert.equal(p.slipDays, 0);
  });

  it("reports not started when nothing has happened", () => {
    const fresh = { ...shipment, milestones: shipment.milestones.map((m) => ({ ...m, actualAt: null })) };
    assert.equal(shipmentProgress(fresh, TODAY).status, "not_started");
  });

  it("measures slip against the planned date of the next milestone", () => {
    const p = shipmentProgress(shipment, "2026-07-20");
    assert.equal(p.slipDays, 2, "two days past the 18 July plan");
    assert.ok(shipmentProgress(shipment, "2026-07-01").slipDays < 0, "ahead of plan reads negative");
  });

  it("reports the variance on each completed milestone", () => {
    const v = milestoneVariance(shipment);
    assert.equal(v.length, 4);
    assert.deepEqual(v[0], { label: "Order confirmed", days: 0 });
    assert.deepEqual(v[1], { label: "Production complete", days: 3 });
    assert.equal(v.reduce((s, x) => s + x.days, 0), 0 + 3 + 3 + 2);
  });
});

describe("supplier risk", () => {
  it("rates a long-standing audited supplier as low risk", () => {
    const r = supplierRisk(SUPPLIERS.find((s) => s.id === "S-04")!);
    assert.equal(r.level, "low");
    assert.deepEqual(r.reasons, []);
  });

  it("rates an unverified, unaudited, newer supplier as high risk and says why", () => {
    const r = supplierRisk(SUPPLIERS.find((s) => s.id === "S-03")!);
    assert.equal(r.level, "high");
    assert.ok(r.reasons.length >= 3);
    assert.ok(r.reasons.some((x) => x.includes("Not yet verified")));
    assert.ok(r.reasons.some((x) => x.includes("audit")));
  });

  it("rates a middling supplier as medium", () => {
    const r = supplierRisk(SUPPLIERS.find((s) => s.id === "S-05")!);
    assert.equal(r.level, "medium");
    assert.equal(r.reasons.length, 1);
  });
});
