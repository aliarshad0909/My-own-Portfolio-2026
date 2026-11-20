import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BUDGET_OPTIONS, SERVICE_OPTIONS, TIMELINE_OPTIONS } from "@/lib/inquiry";
import {
  ESTIMATOR_LIMITS,
  PROJECT_CATEGORIES,
  buildProposalHref,
  estimate,
  estimateProject,
} from "@/lib/tools/estimator";
import { roi, ROI_LIMITS } from "@/lib/tools/roi";
import { landedCost } from "@/lib/tools/landed-cost";
import { calculateShippingCost, convertShippingUnitSystem } from "@/lib/tools/shipping";
import { convertCurrency } from "@/lib/tools/currency";

describe("web project estimator (legacy helper)", () => {
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

describe("multi-discipline project estimator", () => {
  it("supports all 7 studio categories and maps each to valid /contact inquiry options", () => {
    assert.equal(PROJECT_CATEGORIES.length, 7);
    for (const cat of PROJECT_CATEGORIES) {
      const r = estimateProject({
        category: cat.id,
        scopeTier: "growth",
        units: cat.defaultUnits,
        designComplexity: "custom",
        backendNeeds: cat.hasSoftwareOptions ? "standard" : "none",
        integrations: 2,
        authRequired: false,
        automationRequired: false,
        timeline: "standard",
        maintenance: "handoff",
      });
      assert.ok(r.low > 0 && r.high > r.low, `${cat.id} should return a valid band`);
      assert.ok(r.weeksLow >= 1 && r.weeksHigh > r.weeksLow, `${cat.id} should return valid weeks`);
      assert.ok(SERVICE_OPTIONS.includes(r.contactService), `${cat.id} service "${r.contactService}" not in SERVICE_OPTIONS`);
      assert.ok(BUDGET_OPTIONS.includes(r.contactBudget), `${cat.id} budget "${r.contactBudget}" not in BUDGET_OPTIONS`);
      assert.ok(TIMELINE_OPTIONS.includes(r.contactTimeline), `${cat.id} timeline "${r.contactTimeline}" not in TIMELINE_OPTIONS`);
      assert.ok(r.selectedRequirements.length >= 5, `${cat.id} should populate requirements list`);
    }
  });

  it("increases estimate with bespoke design, advanced backend, auth, automation and rush timeline", () => {
    const simple = estimateProject({
      category: "web-application",
      scopeTier: "starter",
      units: 5,
      designComplexity: "clean",
      backendNeeds: "none",
      integrations: 0,
      authRequired: false,
      automationRequired: false,
      timeline: "flexible",
      maintenance: "none",
    });
    const complex = estimateProject({
      category: "web-application",
      scopeTier: "custom",
      units: 20,
      designComplexity: "bespoke",
      backendNeeds: "advanced",
      integrations: 6,
      authRequired: true,
      automationRequired: true,
      timeline: "rush",
      maintenance: "ongoing",
    });
    assert.ok(complex.high > simple.high * 2, "complex multi-system build should be substantially higher");
    assert.equal(complex.complexity, "Multi-System");
  });

  it("builds a clean /contact proposal handoff URL with encoded parameters", () => {
    const r = estimateProject({
      category: "n8n-workflow-automation",
      scopeTier: "growth",
      units: 5,
      designComplexity: "clean",
      backendNeeds: "standard",
      integrations: 4,
      authRequired: false,
      automationRequired: true,
      timeline: "standard",
      maintenance: "ongoing",
    });
    const href = buildProposalHref(r);
    assert.ok(href.startsWith("/contact?"), "proposal href should target /contact");
    const params = new URLSearchParams(href.slice("/contact?".length));
    assert.equal(params.get("service"), "AI Agents & Automation");
    assert.ok((params.get("summary") ?? "").includes("n8n workflow automation"));
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

  it("accounts for working weeks per year and monthly software maintenance costs", () => {
    const r = roi({
      hoursPerWeek: 10,
      hourlyCost: 40,
      people: 2,
      automationFactor: 0.5,
      buildCost: 4800,
      workingWeeksPerYear: 48,
      monthlySoftwareCost: 100,
    });
    // weeklyHoursSaved = 10; annualHoursSaved = 480; annual gross = 19200; software = 1200; net = 18000 (1500/mo)
    assert.equal(r.weeklyHoursSaved, 10);
    assert.equal(r.annualHoursSaved, 480);
    assert.equal(r.annualSaving, 19200);
    assert.equal(r.annualSoftwareCost, 1200);
    assert.equal(r.annualNetSaving, 18000);
    assert.equal(r.monthlyNetBenefit, 1500);
    assert.equal(r.paybackMonths, 3.2);
  });

  it("caps the automation factor so results stay credible", () => {
    const r = roi({ hoursPerWeek: 10, hourlyCost: 30, people: 1, automationFactor: 1, buildCost: 1000 });
    const capped = roi({ hoursPerWeek: 10, hourlyCost: 30, people: 1, automationFactor: ROI_LIMITS.automationFactor.max, buildCost: 1000 });
    assert.equal(r.weeklySaving, capped.weeklySaving, "factor above max is clamped to max");
  });

  it("reports Infinity payback when net benefit is zero or negative", () => {
    const r = roi({ hoursPerWeek: 0, hourlyCost: 0, people: 0, automationFactor: 0.5, buildCost: 1000 });
    assert.equal(r.weeklySaving, 0);
    assert.equal(r.paybackWeeks, Infinity);
    assert.equal(r.paybackMonths, Infinity);

    const negativeNet = roi({
      hoursPerWeek: 1,
      hourlyCost: 10,
      people: 1,
      automationFactor: 0.5,
      buildCost: 1000,
      monthlySoftwareCost: 500,
    });
    assert.ok(negativeNet.monthlyNetBenefit < 0);
    assert.equal(negativeNet.paybackMonths, Infinity);
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

  it("supports FX conversion, import taxes, clearance, local delivery and target margin", () => {
    const r = landedCost({
      unitCost: 100,
      quantity: 100,
      currency: "CNY",
      exchangeRate: 0.14, // 10,000 CNY = $1,400 USD
      freight: 300,
      insurance: 50,
      dutyRatePct: 10, // $140
      importTaxRatePct: 5, // 5% of (1400 + 140) = $77
      customsClearance: 100,
      localTransport: 83,
      otherFees: 50,
      targetSellingPrice: 44,
    });
    assert.equal(r.supplierGoodsValue, 10000);
    assert.equal(r.goodsValue, 1400);
    assert.equal(r.duty, 140);
    assert.equal(r.importTax, 77);
    assert.equal(r.totalLandedCost, 2200);
    assert.equal(r.perUnitLandedCost, 22);
    assert.equal(r.profitPerUnit, 22);
    assert.equal(r.markupPct, 100);
    assert.equal(r.grossMarginPct, 50);
  });

  it("handles zero quantity without dividing by zero", () => {
    const r = landedCost({ unitCost: 10, quantity: 0, freight: 0, dutyRatePct: 5, insurance: 0, otherFees: 0 });
    assert.equal(r.perUnitLandedCost, 0);
    assert.equal(r.upliftFactor, 0);
    assert.equal(r.grossMarginPct, null);
  });
});

describe("shipping cost calculator", () => {
  it("bills by volumetric weight when parcel is bulky", () => {
    const r = calculateShippingCost({
      originCountry: "China",
      destinationCountry: "United States",
      method: "air-express",
      unitSystem: "metric",
      actualWeight: 10,
      length: 50,
      width: 40,
      height: 40, // 80,000 / 5000 = 16 kg volumetric
      volumetricDivisor: 5000,
      ratePerChargeableUnit: 8,
      handlingCharges: 40,
    });
    assert.equal(r.volumetricWeight, 16);
    assert.equal(r.chargeableWeight, 16);
    assert.equal(r.billedBy, "volumetric");
    assert.equal(r.freightCost, 128);
    assert.equal(r.totalEstimatedCost, 168);
    assert.equal(r.volumeCbm, 0.08);
  });

  it("bills by actual weight when parcel is dense", () => {
    const r = calculateShippingCost({
      originCountry: "China",
      destinationCountry: "United Kingdom",
      method: "air-freight",
      unitSystem: "metric",
      actualWeight: 25,
      length: 30,
      width: 30,
      height: 30, // 27,000 / 6000 = 4.5 kg
      volumetricDivisor: 6000,
      ratePerChargeableUnit: 5,
      handlingCharges: 25,
    });
    assert.equal(r.chargeableWeight, 25);
    assert.equal(r.billedBy, "actual");
    assert.equal(r.totalEstimatedCost, 150);
  });

  it("converts cleanly between metric and imperial unit systems", () => {
    const metric = {
      originCountry: "China",
      destinationCountry: "United States",
      method: "air-express" as const,
      unitSystem: "metric" as const,
      actualWeight: 10,
      length: 50,
      width: 40,
      height: 30,
      volumetricDivisor: 5000,
      ratePerChargeableUnit: 8,
      handlingCharges: 30,
    };
    const imperial = convertShippingUnitSystem(metric, "imperial");
    assert.equal(imperial.unitSystem, "imperial");
    assert.equal(imperial.volumetricDivisor, 139);
    const resMetric = calculateShippingCost(metric);
    const resImperial = calculateShippingCost(imperial);
    // Volumetric & actual kg equivalents should match closely after conversion
    assert.ok(Math.abs(resMetric.actualWeightKg - resImperial.actualWeightKg) < 0.05);
    assert.ok(Math.abs(resMetric.volumeCbm - resImperial.volumeCbm) < 0.002);
  });

  it("sanitizes negative and NaN values safely", () => {
    const r = calculateShippingCost({
      originCountry: "China",
      destinationCountry: "United States",
      method: "air-express",
      unitSystem: "metric",
      actualWeight: -10,
      length: Number.NaN,
      width: 10,
      height: 10,
      volumetricDivisor: 0,
      ratePerChargeableUnit: -5,
      handlingCharges: Number.NaN,
    });
    assert.equal(r.chargeableWeight, 0);
    assert.equal(r.totalEstimatedCost, 0);
  });
});

describe("currency exchange calculator", () => {
  const sampleRates = { USD: 1, PKR: 278.5, EUR: 0.92, GBP: 0.79, AED: 3.6725, CNY: 7.24 };

  it("converts using USD-based cross-rates cleanly", () => {
    const r = convertCurrency({ amount: 100, from: "USD", to: "PKR", rates: sampleRates });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.source, "live");
      assert.equal(r.convertedAmount, 27850);
    }

    const cross = convertCurrency({ amount: 100, from: "EUR", to: "GBP", rates: sampleRates });
    assert.equal(cross.ok, true);
    if (cross.ok) {
      assert.ok(Math.abs(cross.rate - 0.79 / 0.92) < 0.0001);
    }
  });

  it("honors manual exchange-rate override even when live rates are missing", () => {
    const r = convertCurrency({ amount: 500, from: "USD", to: "PKR", rates: null, manualRate: 280 });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.source, "manual");
      assert.equal(r.convertedAmount, 140000);
      assert.equal(r.rate, 280);
    }
  });

  it("never fabricates a rate when live rates are unavailable and no manual rate is given", () => {
    const r = convertCurrency({ amount: 250, from: "USD", to: "PKR", rates: null });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.reason, "rate_unavailable");
    }
  });

  it("handles same-currency conversion without requiring external rates", () => {
    const r = convertCurrency({ amount: 123.45, from: "AED", to: "AED", rates: null });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.source, "identity");
      assert.equal(r.convertedAmount, 123.45);
    }
  });
});

function round(n: number) {
  return Math.round(n * 100) / 100;
}
