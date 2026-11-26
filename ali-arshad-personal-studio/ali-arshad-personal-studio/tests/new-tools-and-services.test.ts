import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GPU_TOPIC_PAGES } from "@/lib/gpu-compute";
import { SERVICE_OPTIONS } from "@/lib/inquiry";
import { isKnownRoute } from "@/lib/seo/routes";
import { INCOTERMS_TABLE, SOURCING_CATEGORIES, SOURCING_SUBPAGES, SOURCING_WORKFLOW } from "@/lib/sourcing";
import { evaluateGpuQuoteScope } from "@/lib/tools/gpu-estimator";
import { landedCost } from "@/lib/tools/landed-cost";
import { calculateMoqPlan } from "@/lib/tools/moq";
import { calculateShippingCost } from "@/lib/tools/shipping";

describe("MOQ & Order Quantity Helper", () => {
  it("rounds planned units to full master cartons and computes CBM, weight, and MOQ status", () => {
    const res = calculateMoqPlan({
      unitPriceUsd: 10,
      supplierMoqUnits: 100,
      plannedUnits: 95,
      unitsPerCarton: 10,
      cartonLengthCm: 50,
      cartonWidthCm: 40,
      cartonHeightCm: 50,
      cartonWeightKg: 12,
      setupFeeUsd: 200,
      budgetCapUsd: 1500,
    });

    assert.equal(res.cartonsNeeded, 10);
    assert.equal(res.roundedOrderUnits, 100);
    assert.equal(res.meetsMoq, true);
    assert.equal(res.shortfallUnits, 0);
    assert.equal(res.cbmPerCarton, 0.1);
    assert.equal(res.totalCbm, 1);
    assert.equal(res.totalGrossWeightKg, 120);
    assert.equal(res.totalGoodsUsd, 1000);
    assert.equal(res.totalOrderOutlayUsd, 1200);
    assert.equal(res.effectiveUnitCostUsd, 12);
    assert.equal(res.withinBudget, true);
    assert.equal(res.budgetRemainingUsd, 300);
    assert.equal(res.scenarios.length, 3);
  });

  it("flags shortfall when rounded order is below supplier MOQ", () => {
    const res = calculateMoqPlan({
      unitPriceUsd: 5,
      supplierMoqUnits: 200,
      plannedUnits: 50,
      unitsPerCarton: 25,
      cartonLengthCm: 40,
      cartonWidthCm: 40,
      cartonHeightCm: 40,
      cartonWeightKg: 8,
    });
    assert.equal(res.meetsMoq, false);
    assert.equal(res.shortfallUnits, 150);
  });
});

describe("GPU & Compute Quote Scope Estimator", () => {
  it("evaluates practical single-host workloads without inventing dollar rates", () => {
    const res = evaluateGpuQuoteScope({
      workloadCategory: "blender-rendering",
      estimatedHoursPerRun: 5,
      runsPerMonth: 2,
      vramRequirementGb: 12,
      systemRamRequirementGb: 32,
      storageGb: 100,
      accessPreference: "ssh-key",
      storageNeed: "ephemeral-scratch",
      needsSetupAssistance: false,
      requires247Uptime: false,
      requiresComplianceCert: false,
    });
    assert.equal(res.totalEstimatedHours, 10);
    assert.equal(res.fitAssessment, "strong-fit-pending-check");
    assert.equal(res.flags.length, 0);
    assert.equal(/\$\d/.test(res.contactSummary), false, "must never invent dollar pricing");
  });

  it("flags 24/7 uptime SLAs and compliance requirements as outside single-host scope", () => {
    const res = evaluateGpuQuoteScope({
      workloadCategory: "ai-inference-eval",
      estimatedHoursPerRun: 24,
      runsPerMonth: 10,
      vramRequirementGb: 48,
      systemRamRequirementGb: 128,
      storageGb: 1000,
      accessPreference: "docker-container",
      storageNeed: "large-dataset-transfer",
      needsSetupAssistance: true,
      requires247Uptime: true,
      requiresComplianceCert: true,
    });
    assert.equal(res.fitAssessment, "likely-outside-scope");
    assert.ok(res.flags.length >= 4);
  });
});

describe("Upgraded Landed Cost & Multi-Carton Shipping", () => {
  it("includes packagingTooling in Landed Cost calculations", () => {
    const r = landedCost({
      unitCost: 10,
      quantity: 100,
      packagingTooling: 250,
      freight: 300,
      dutyRatePct: 5,
      insurance: 50,
      otherFees: 100,
    });
    assert.equal(r.packagingTooling, 250);
    assert.equal(r.totalLandedCost, 1750);
    assert.equal(r.perUnitLandedCost, 17.5);
  });

  it("scales actual weight, volumetric weight, and CBM across multiple cartons", () => {
    const single = calculateShippingCost({
      originCountry: "China",
      destinationCountry: "United States",
      method: "air-express",
      unitSystem: "metric",
      actualWeight: 10,
      length: 50,
      width: 40,
      height: 30,
      volumetricDivisor: 5000,
      ratePerChargeableUnit: 8,
      handlingCharges: 40,
      cartonCount: 1,
    });
    const five = calculateShippingCost({
      originCountry: "China",
      destinationCountry: "United States",
      method: "air-express",
      unitSystem: "metric",
      actualWeight: 10,
      length: 50,
      width: 40,
      height: 30,
      volumetricDivisor: 5000,
      ratePerChargeableUnit: 8,
      handlingCharges: 40,
      cartonCount: 5,
    });
    assert.equal(five.actualWeight, single.actualWeight * 5);
    assert.equal(five.volumetricWeight, single.volumetricWeight * 5);
    assert.equal(five.volumeCbm, Number((single.volumeCbm * 5).toFixed(4)));
  });
});

describe("New Service Hubs, Routes & Privacy Truthfulness", () => {
  it("registers all GPU, Sourcing, Social, LinkedIn, and Calculator routes in knownRoutes()", () => {
    const expected = [
      "/services/gpu-compute",
      ...GPU_TOPIC_PAGES.map((t) => `/services/gpu-compute/${t.slug}`),
      "/services/product-sourcing",
      ...SOURCING_SUBPAGES.map((s) => `/services/product-sourcing/${s.slug}`),
      "/services/social-media-management",
      "/services/linkedin-outreach",
      "/tools/moq-quantity-helper",
      "/tools/gpu-quote-estimator",
    ];
    for (const route of expected) {
      assert.equal(isKnownRoute(route), true, `Expected known route: ${route}`);
    }
    assert.ok(SERVICE_OPTIONS.includes("Social Media Setup & Management"));
    assert.ok(SERVICE_OPTIONS.includes("LinkedIn Outreach & Sales Development"));
  });

  it("keeps private supplier contacts, phone numbers, and unverified claims out of public sourcing data", () => {
    const serialized = JSON.stringify({
      categories: SOURCING_CATEGORIES,
      workflow: SOURCING_WORKFLOW,
      incoterms: INCOTERMS_TABLE,
      subpages: SOURCING_SUBPAGES,
    });
    assert.equal(/whatsapp/i.test(serialized), false, "must never leak supplier WhatsApp info");
    assert.equal(/yangantoys|wangyang|yangwang/i.test(serialized), false, "must never leak private supplier names");
    assert.equal(/more than 10 years|10\+ years/i.test(serialized), false, "must not publish unconfirmed 10+ years claim");
    assert.equal(/guaranteed lowest price|guaranteed ddp/i.test(serialized), false, "must not make guaranteed price/DDP claims");
  });
});
