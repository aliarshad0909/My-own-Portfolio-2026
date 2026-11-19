import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimate, ESTIMATOR_LIMITS } from "@/lib/tools/estimator";
import { roi, ROI_LIMITS } from "@/lib/tools/roi";
import { landedCost } from "@/lib/tools/landed-cost";

describe("web project estimator", () => {
  it("returns a sensible band, low below high", () => {
    const r = estimate({ projectType: "web-app", pages: 8, integrations: 3, design: "custom", urgency: "standard" });
    assert.ok(r.low > 0 && r.high > r.low, "expected a positive band with high > low");
    assert.ok(r.weeksHigh > r.weeksLow, "weeks band should widen");
  });

  it("costs more for custom design and rush timelines", () => {
    const basic = estimate({ projectType: "marketing-site", pages: 5, integrations: 0, design: "template", urgency: "standard" });
    const premium = estimate({ projectType: "marketing-site", pages: 5, integrations: 0, design: "custom", urgency: "rush" });
    assert.ok(premium.high > basic.high, "custom + rush should cost more");
  });

  it("clamps absurd inputs instead of exploding", () => {
    const r = estimate({ projectType: "dashboard", pages: 9999, integrations: 9999, design: "custom", urgency: "rush" });
    assert.ok(Number.isFinite(r.high) && r.weeksHigh <= 40, "clamped to finite, bounded result");
  });

  it("treats negative/NaN inputs as the minimum", () => {
    const r = estimate({ projectType: "web-app", pages: -4, integrations: Number.NaN, design: "template", urgency: "standard" });
    assert.ok(r.low > 0, "still a positive base estimate");
    assert.equal(ESTIMATOR_LIMITS.pages.min, 1);
  });
});

describe("automation ROI", () => {
  it("computes weekly and annual saving and payback", () => {
    const r = roi({ hoursPerWeek: 10, hourlyCost: 30, people: 2, automationFactor: 0.5, buildCost: 3000 });
    // 10 * 30 * 2 * 0.5 = 300/week; 15600/year; payback 10 weeks.
    assert.equal(r.weeklySaving, 300);
    assert.equal(r.annualSaving, 15600);
    assert.equal(r.paybackWeeks, 10);
    assert.equal(r.firstYearRoiPct, round(((15600 - 3000) / 3000) * 100));
  });

  it("caps the automation factor so results stay credible", () => {
    const r = roi({ hoursPerWeek: 10, hourlyCost: 30, people: 1, automationFactor: 1, buildCost: 1000 });
    const capped = roi({ hoursPerWeek: 10, hourlyCost: 30, people: 1, automationFactor: ROI_LIMITS.automationFactor.max, buildCost: 1000 });
    assert.equal(r.weeklySaving, capped.weeklySaving, "factor above max is clamped to max");
  });

  it("reports Infinity payback when nothing is saved", () => {
    const r = roi({ hoursPerWeek: 0, hourlyCost: 0, people: 0, automationFactor: 0.5, buildCost: 1000 });
    assert.equal(r.weeklySaving, 0);
    assert.equal(r.paybackWeeks, Infinity);
  });
});

describe("landed cost", () => {
  it("sums goods, freight, duty, insurance and fees", () => {
    const r = landedCost({ unitCost: 10, quantity: 100, freight: 300, dutyRatePct: 5, insurance: 50, otherFees: 100 });
    // goods 1000, duty 50, total 1000+300+50+50+100 = 1500, per-unit 15.
    assert.equal(r.goodsValue, 1000);
    assert.equal(r.duty, 50);
    assert.equal(r.totalLandedCost, 1500);
    assert.equal(r.perUnitLandedCost, 15);
    assert.equal(r.upliftFactor, 1.5);
  });

  it("handles zero quantity without dividing by zero", () => {
    const r = landedCost({ unitCost: 10, quantity: 0, freight: 0, dutyRatePct: 5, insurance: 0, otherFees: 0 });
    assert.equal(r.perUnitLandedCost, 0);
    assert.equal(r.upliftFactor, 0);
  });
});

function round(n: number) {
  return Math.round(n * 100) / 100;
}
