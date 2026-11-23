import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { RESOURCES } from "@/lib/content/resources";
import { STUDIO_PRODUCTS } from "@/lib/products/catalog";
import { PROJECTS } from "@/lib/projects";
import { getKeyword } from "@/lib/seo/keyword-registry";
import { isIndexable } from "@/lib/seo/publication";
import { brokenLinks } from "@/lib/seo/routes";
import { SERVICE_HUBS, allSpokes, getSpoke, spokesForProject } from "@/lib/seo/service-hubs";
import { indexableSeoRoutes } from "@/lib/seo/sitemap-routes";
import {
  articleSchema,
  breadcrumbSchema,
  creativeWorkSchema,
  faqSchema,
  personSchema,
  professionalServiceSchema,
  profilePageSchema,
  serviceListSchema,
  singleServiceSchema,
  softwareApplicationSchema,
  webApplicationSchema,
  webSiteSchema,
} from "@/lib/structured-data";

const APP_ROOT = path.resolve(process.cwd());

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkTsx(full));
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("service niche pages & reciprocal links", () => {
  it("publishes evidenced niche pages and registers them in the sitemap", () => {
    const required = [
      ["web-development", "custom-crm-development"],
      ["web-development", "api-integration"],
      ["ecommerce-development", "custom-storefronts"],
      ["business-dashboards", "inventory-software"],
    ] as const;

    const sitemap = new Set(indexableSeoRoutes());
    for (const [hubSlug, spokeSlug] of required) {
      const spoke = getSpoke(hubSlug, spokeSlug);
      assert.ok(spoke, `missing spoke ${hubSlug}/${spokeSlug}`);
      assert.equal(spoke!.publicationState, "Published", `${hubSlug}/${spokeSlug} should be Published`);
      assert.ok(sitemap.has(`/services/${hubSlug}/${spokeSlug}`), `${hubSlug}/${spokeSlug} missing from sitemap`);
      assert.ok(spoke!.audience && spoke!.audience.length > 20, `${hubSlug}/${spokeSlug} missing audience`);
      assert.ok(spoke!.quickAnswer && spoke!.quickAnswer.length > 30, `${hubSlug}/${spokeSlug} missing quickAnswer`);
      assert.ok(spoke!.faqs.length >= 3, `${hubSlug}/${spokeSlug} should have at least 3 FAQs`);
    }
  });

  it("gives every published specialization spoke AEO quick-answer fields and valid internal cross-links", () => {
    const published = allSpokes().filter(({ spoke }) => isIndexable(spoke.publicationState));
    assert.ok(published.length >= 25, `expected at least 25 published spokes, got ${published.length}`);

    for (const { hub, spoke } of published) {
      assert.ok(spoke.audience && spoke.audience.trim().length > 10, `${hub.slug}/${spoke.slug} missing audience`);
      assert.ok(spoke.quickAnswer && spoke.quickAnswer.trim().length > 20, `${hub.slug}/${spoke.slug} missing quickAnswer`);

      const links = [
        ...(spoke.relatedTool ? [spoke.relatedTool.href] : []),
        ...(spoke.relatedResource ? [spoke.relatedResource.href] : []),
        ...(spoke.relatedProduct ? [spoke.relatedProduct.href] : []),
      ];
      assert.deepEqual(brokenLinks(links), [], `${hub.slug}/${spoke.slug} has broken cross-links`);
    }
  });

  it("keeps unsupported / recommended niches gated out of the production sitemap", () => {
    const sitemap = new Set(indexableSeoRoutes());
    const gated = [
      "/services/ecommerce-development/shopify",
      "/services/creative-production/3d-visualization",
      "/services/global-sourcing/overseas",
      "/services/web-development/headless-cms",
      "/services/web-development/performance",
      "/services/web-development/maintenance",
    ];
    for (const url of gated) {
      assert.ok(!sitemap.has(url), `gated niche ${url} must not appear in sitemap`);
    }
    assert.equal(getKeyword("spec-shopify")?.state, "Researched");
    assert.equal(getKeyword("spec-blender-viz")?.state, "Drafted");
    assert.equal(getKeyword("spec-china-sourcing")?.state, "NeedsEvidence");
  });

  it("resolves reciprocal niche spoke links for flagship demonstration builds", () => {
    const crmSpokes = spokesForProject("pipelineos-crm").map(({ hub, spoke }) => `/services/${hub.slug}/${spoke.slug}`);
    assert.ok(crmSpokes.includes("/services/web-development/custom-crm-development"));
    assert.ok(crmSpokes.includes("/services/web-development/api-integration"));

    const stockSpokes = spokesForProject("stockflow-inventory").map(({ hub, spoke }) => `/services/${hub.slug}/${spoke.slug}`);
    assert.ok(stockSpokes.includes("/services/business-dashboards/inventory-software"));
    assert.ok(stockSpokes.includes("/services/web-development/api-integration"));
    assert.ok(stockSpokes.includes("/services/ecommerce-development/custom-storefronts"));

    const commerceSpokes = spokesForProject("tessera-clayworks-storefront").map(
      ({ hub, spoke }) => `/services/${hub.slug}/${spoke.slug}`,
    );
    assert.ok(commerceSpokes.includes("/services/ecommerce-development/custom-storefronts"));
  });
});

describe("structured data entity graph & truthfulness guardrails", () => {
  it("links Person, ProfessionalService, WebSite, Service, CreativeWork, SoftwareApplication, and Article via @id", () => {
    const person = personSchema();
    const studio = professionalServiceSchema(
      SERVICE_HUBS.filter((h) => isIndexable(h.publicationState)).map((h) => ({ name: h.h1, path: `/services/${h.slug}` })),
    );
    const website = webSiteSchema();
    const profile = profilePageSchema();
    const list = serviceListSchema();
    const svc = singleServiceSchema({
      name: "Custom CRM & B2B pipeline software",
      description: "Tailored PostgreSQL CRM builds.",
      path: "/services/web-development/custom-crm-development",
    });
    const work = creativeWorkSchema(PROJECTS[0], "case-study");
    const app = softwareApplicationSchema(STUDIO_PRODUCTS[0]);
    const tool = webApplicationSchema({ slug: "landed-cost-calculator", name: "Landed Cost Calculator", description: "Calculate landed cost." });
    const art = articleSchema({
      slug: RESOURCES[0].slug,
      title: RESOURCES[0].title,
      description: RESOURCES[0].description,
      category: RESOURCES[0].category,
      publishedAt: RESOURCES[0].publishedAt,
      updatedAt: RESOURCES[0].updatedAt,
    });
    const faq = faqSchema([{ q: "Do you work remotely?", a: "Yes, remotely for US and international teams." }]);
    const crumbs = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]);

    assert.equal(person["@type"], "Person");
    assert.equal(studio["@type"], "ProfessionalService");
    assert.equal(studio.founder["@id"], person["@id"]);
    assert.equal(website.author["@id"], person["@id"]);
    assert.equal(website.publisher["@id"], studio["@id"]);
    assert.equal(profile.mainEntity["@id"], person["@id"]);
    assert.equal(svc.provider["@id"], person["@id"]);
    assert.equal(svc.brand["@id"], studio["@id"]);
    assert.equal(work.author["@id"], person["@id"]);
    assert.equal(app["@type"], "SoftwareApplication");
    assert.equal(app.author["@id"], person["@id"]);
    assert.equal(tool.author["@id"], person["@id"]);
    assert.equal(art.author["@id"], person["@id"]);
    assert.equal(art.publisher["@id"], studio["@id"]);
    assert.equal(faq["@type"], "FAQPage");
    assert.equal(crumbs["@type"], "BreadcrumbList");
    assert.ok(list.itemListElement.length === 6);

    const serialized = JSON.stringify([person, studio, website, profile, list, svc, work, app, tool, art, faq, crumbs]);
    for (const forbidden of ["aggregateRating", "reviewRating", "streetAddress", "priceRange", "postalCode"]) {
      assert.ok(!serialized.includes(forbidden), `JSON-LD must never fabricate ${forbidden}`);
    }
  });

  it("never duplicates BreadcrumbList JSON-LD alongside the <Breadcrumbs /> component", () => {
    const appFiles = walkTsx(path.join(APP_ROOT, "app"));
    const offenders: string[] = [];
    for (const file of appFiles) {
      const src = readFileSync(file, "utf8");
      if (src.includes("breadcrumbSchema(") && src.includes("<Breadcrumbs")) {
        offenders.push(path.relative(APP_ROOT, file));
      }
    }
    assert.deepEqual(offenders, [], `duplicate BreadcrumbList JSON-LD detected in: ${offenders.join(", ")}`);
  });
});

describe("AI discovery machine-readable llms.txt", () => {
  it("exists in public/llms.txt with truthful canonical URLs and honest demo framing", () => {
    const llmsPath = path.join(APP_ROOT, "public", "llms.txt");
    const content = readFileSync(llmsPath, "utf8");
    assert.ok(content.includes("https://www.aliarshad.co/services"), "missing /services canonical URL");
    assert.ok(content.includes("https://www.aliarshad.co/services/web-development/custom-crm-development"), "missing custom CRM niche URL");
    assert.ok(content.includes("https://www.aliarshad.co/services/web-development/api-integration"), "missing API integration niche URL");
    assert.ok(content.includes("https://www.aliarshad.co/services/ecommerce-development/custom-storefronts"), "missing custom storefronts niche URL");
    assert.ok(content.includes("https://crm.aliarshad.co"), "missing live PipelineOS URL");
    assert.ok(content.includes("https://stock.aliarshad.co"), "missing live StockFlow URL");
    assert.match(content, /studio demonstrations/i);
    assert.match(content, /no physical regional branch offices/i);
  });
});
