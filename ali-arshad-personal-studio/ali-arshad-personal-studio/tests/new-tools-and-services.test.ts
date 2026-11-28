import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { CREATIVE_AUDIO_SAMPLES } from "@/lib/creative-audio";
import { APPROVED_PUBLIC_VIDEOS, CREATIVE_SHOWCASE_VIDEOS } from "@/lib/creative-videos";
import { GPU_TOPIC_PAGES } from "@/lib/gpu-compute";
import { SERVICE_OPTIONS } from "@/lib/inquiry";
import { PROJECTS, caseStudies, hasDedicatedCaseStudy, isIndexable as isProjectIndexable, projectHref } from "@/lib/projects";
import { isKnownRoute } from "@/lib/seo/routes";
import {
  INCOTERMS_TABLE,
  SOURCING_CATALOG_EXAMPLES,
  SOURCING_CATEGORIES,
  SOURCING_LOOKBOOK_PDF_PATH,
  SOURCING_OVERVIEW_FAQS,
  SOURCING_SUBPAGES,
  SOURCING_WORKFLOW,
} from "@/lib/sourcing";
import {
  ALL_SOURCING_PRODUCTS,
  INDEXABLE_SOURCING_PRODUCTS,
  MASTER_CATALOG_PDF_PATH,
  SOURCING_CATALOG_INDEX,
  SOURCING_CATALOG_PATH,
} from "@/lib/sourcing-catalog";
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

  it("keeps private supplier contacts, wholesale prices, and absolute claims out of public sourcing data", () => {
    const serialized = JSON.stringify({
      categories: SOURCING_CATEGORIES,
      catalog: SOURCING_CATALOG_EXAMPLES,
      workflow: SOURCING_WORKFLOW,
      incoterms: INCOTERMS_TABLE,
      subpages: SOURCING_SUBPAGES,
      faqs: SOURCING_OVERVIEW_FAQS,
    });
    assert.equal(SOURCING_SUBPAGES.length, 9, "expected 9 Product Sourcing subpages including quote-comparison");
    assert.equal(SOURCING_CATALOG_EXAMPLES.length, 14, "expected 14 curated catalog-backed product examples across 7 categories");
    assert.equal(/whatsapp/i.test(serialized), false, "must never leak supplier WhatsApp info");
    assert.equal(/yangantoys|wangyang|yangwang|hongbin|senchiva|qingfeng|esonghome|powerwear|linkyi|sialkot|daska|03120489417/i.test(serialized), false, "must never leak confidential supplier names");
    assert.equal(/\+86|@qq\.com|@163\.com/i.test(serialized), false, "must never leak supplier contact details");
    assert.equal(/\b(lowest price|best quality|guaranteed ddp)\b/i.test(serialized), false, "must avoid absolute guarantees");

    // Verify all 12 catalog images and branded PDF lookbook exist on disk and are optimized
    for (const item of SOURCING_CATALOG_EXAMPLES) {
      const full = path.join(process.cwd(), "public", item.image);
      assert.ok(existsSync(full), `missing catalog image on disk: ${item.image}`);
      assert.ok(isKnownRoute(item.calculatorHref), `broken sourcing calculator link: ${item.calculatorHref}`);
    }
    const pdfFull = path.join(process.cwd(), "public", SOURCING_LOOKBOOK_PDF_PATH);
    assert.ok(existsSync(pdfFull), `missing lookbook PDF: ${SOURCING_LOOKBOOK_PDF_PATH}`);
    assert.ok(statSync(pdfFull).size < 1_000_000, "lookbook PDF should stay lightweight (<1 MB)");
  });

  it("publishes all 13 authorized portfolio and studio narrative/motion videos and 3 ElevenLabs audio cues on disk", () => {
    assert.equal(APPROVED_PUBLIC_VIDEOS.length, 13, "expected 13 published videos (8 authorized portfolio edits + 5 studio narrative/motion demos)");
    assert.equal(
      APPROVED_PUBLIC_VIDEOS.filter((v) => v.workType === "Authorized Portfolio Edit").length,
      8,
      "expected all 8 authorized client/portfolio video edits published",
    );
    assert.equal(
      APPROVED_PUBLIC_VIDEOS.filter((v) => v.workType === "Studio Motion Demo").length,
      5,
      "expected 5 studio-authored narrative and motion demos",
    );
    for (const v of APPROVED_PUBLIC_VIDEOS) {
      assert.ok(existsSync(path.join(process.cwd(), "public", v.src)), `missing video asset: ${v.src}`);
      assert.ok(existsSync(path.join(process.cwd(), "public", v.poster)), `missing video poster: ${v.poster}`);
      if (v.webmSrc) {
        assert.ok(existsSync(path.join(process.cwd(), "public", v.webmSrc)), `missing webm asset: ${v.webmSrc}`);
      }
      if (v.captionsSrc) {
        assert.ok(existsSync(path.join(process.cwd(), "public", v.captionsSrc)), `missing captions VTT: ${v.captionsSrc}`);
      }
    }

    assert.equal(CREATIVE_AUDIO_SAMPLES.length, 3, "expected 3 unique cleared ElevenLabs audio cues");
    for (const a of CREATIVE_AUDIO_SAMPLES) {
      assert.ok(existsSync(path.join(process.cwd(), "public", a.src)), `missing audio asset: ${a.src}`);
      assert.ok(existsSync(path.join(process.cwd(), "public", a.captionsSrc)), `missing audio VTT: ${a.captionsSrc}`);
      assert.ok(a.transcript.length > 5, `missing verbatim transcript for ${a.id}`);
      assert.ok(a.sourceFileRecordedInManifest.endsWith(".wav"), `missing source filename record for ${a.id}`);
    }
  });

  it("ships complete 1,436-model Product Sourcing Catalogue across 7 categories with Master PDF, individual PDFs, and zero privacy leaks", () => {
    assert.equal(ALL_SOURCING_PRODUCTS.length, 1436, "expected 1,436 deduplicated sourcing products/series");
    assert.equal(SOURCING_CATALOG_INDEX.length, 1436, "client search index must match full catalog count");
    assert.ok(INDEXABLE_SOURCING_PRODUCTS.length >= 900, "expected spec-documented catalog pages (incl. apparel) to be indexable");
    assert.equal(isKnownRoute(SOURCING_CATALOG_PATH), true);

    const masterFull = path.join(process.cwd(), "public", MASTER_CATALOG_PDF_PATH);
    assert.ok(existsSync(masterFull), `missing master catalogue PDF: ${MASTER_CATALOG_PDF_PATH}`);
    assert.ok(statSync(masterFull).size > 100_000, "master catalogue PDF appears unexpectedly small");

    const rawCatalog = JSON.stringify(ALL_SOURCING_PRODUCTS);
    assert.equal(
      /yangantoys|yangwang|wangyang|leowang|hongbin|esong|qingfeng|senchiva|luxmogan|upwardlighting|powerwear|linkyi|sialkot|daska\s*road|dongguan|03120489417|grace\s*guo|kelly\s*ho|michael\s*liao|whatsapp|wechat|13902721737|13825511247|\$\s*\d+/i.test(
        rawCatalog,
      ),
      false,
      "catalog data must never expose supplier names, contacts, or wholesale prices",
    );

    const slugs = new Set<string>();
    for (const item of ALL_SOURCING_PRODUCTS) {
      assert.ok(!slugs.has(item.slug), `duplicate catalog slug: ${item.slug}`);
      slugs.add(item.slug);
      assert.equal(isKnownRoute(item.pagePath), true, `unregistered product route: ${item.pagePath}`);
      assert.equal(isKnownRoute(item.calculatorHref), true, `broken calculator href: ${item.calculatorHref}`);
      assert.equal(isKnownRoute(item.guideHref), true, `broken guide href: ${item.guideHref}`);
      assert.ok(existsSync(path.join(process.cwd(), "public", item.pdfPath)), `missing product PDF: ${item.pdfPath}`);
      assert.ok(existsSync(path.join(process.cwd(), "public", item.image)), `missing product image: ${item.image}`);
      assert.match(item.availabilityStatus, /confirmed on request/i);
    }
  });

  it("routes flagship case studies to /case-studies/[slug] and expansion prototypes to /work/[slug] with zero duplicate sitemap slugs", () => {
    const csSlugs = new Set(caseStudies().map((p) => p.slug));
    for (const p of PROJECTS) {
      const href = projectHref(p);
      assert.ok(isKnownRoute(href), `projectHref(${p.slug}) resolved to unknown route ${href}`);
      if (csSlugs.has(p.slug)) {
        assert.equal(hasDedicatedCaseStudy(p), true);
        assert.equal(href, `/case-studies/${p.slug}`);
      } else {
        assert.equal(hasDedicatedCaseStudy(p), false);
        assert.equal(href, `/work/${p.slug}`);
      }
    }
    // Verify zero overlap between indexable non-case-study /work slugs and /case-studies slugs
    const workOnlyIndexable = PROJECTS.filter((p) => isProjectIndexable(p) && !hasDedicatedCaseStudy(p));
    for (const p of workOnlyIndexable) {
      assert.equal(csSlugs.has(p.slug), false);
    }
  });
});
