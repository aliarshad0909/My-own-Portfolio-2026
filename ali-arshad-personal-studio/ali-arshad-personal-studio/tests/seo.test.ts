import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  KEYWORD_REGISTRY,
  duplicateKeywords,
  duplicatePrimaryUrls,
  evidenceGaps,
  getKeyword,
} from "@/lib/seo/keyword-registry";
import { PUBLICATION_STATES, isIndexable } from "@/lib/seo/publication";
import { brokenLinks, isKnownRoute } from "@/lib/seo/routes";
import { US_STATES } from "@/lib/geo/states";
import { PILOT_CITIES, orphanCities } from "@/lib/geo/cities";
import { SERVICE_HUBS, allSpokes } from "@/lib/seo/service-hubs";
import { ALL_HUB_ENRICHMENTS } from "@/lib/seo/service-enrichment";
import {
  BUSINESS_PILLARS,
  NATIONWIDE_SERVICES,
  blockingIntentConflicts,
  coreServiceAreaMatrix,
  serviceAreaMatrix,
} from "@/lib/seo/service-areas";
import { PROJECTS, getProject } from "@/lib/projects";
import { SERVICES } from "@/lib/services";
import { SERVICE_OPTIONS } from "@/lib/inquiry";
import { indexableSeoRoutes } from "@/lib/seo/sitemap-routes";
import { RESOURCES } from "@/lib/content/resources";
import { INDUSTRIES } from "@/lib/content/industries";
import { TOOLS, toolState } from "@/lib/tools/catalog";
import { TESTIMONIALS, unconsentedTestimonials } from "@/lib/content/testimonials";
import {
  evidenceTierOf,
  evidenceViolations,
  publishedWithoutLiveEvidence,
  unreviewedPublishedLocations,
} from "@/lib/seo/evidence";

describe("keyword registry: no self-competition", () => {
  it("has no two rows chasing the exact same keyword", () => {
    assert.deepEqual(duplicateKeywords(), [], "duplicate keyword strings found");
  });

  it("has exactly one canonical owner per primary URL (no conflicting canonicals)", () => {
    assert.deepEqual(duplicatePrimaryUrls(), [], "two rows claim the same primaryUrl");
  });

  it("gives every row a unique id", () => {
    const ids = KEYWORD_REGISTRY.map((k) => k.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate registry ids");
  });
});

describe("keyword registry: publication eligibility", () => {
  it("never marks a row Published unless its evidence is satisfied", () => {
    const gaps = evidenceGaps();
    assert.deepEqual(
      gaps.map((g) => g.id),
      [],
      "Published rows with unmet evidence requirements",
    );
  });

  it("uses only known publication states", () => {
    for (const k of KEYWORD_REGISTRY) {
      assert.ok(
        (PUBLICATION_STATES as readonly string[]).includes(k.state),
        `${k.id} has unknown state ${k.state}`,
      );
    }
  });

  it("keeps every location-intent row out of the index until evidence exists", () => {
    // The anti-doorway guarantee: no `location` row is indexable while it still
    // needs evidence. If one is ever flipped to Published it must carry a real
    // local signal, which the eligibility test above enforces separately.
    for (const k of KEYWORD_REGISTRY.filter((r) => r.cluster === "location")) {
      if (isIndexable(k.state)) {
        assert.ok(
          k.evidenceHave.includes("A genuine local signal exists (client in region, or stated service area)"),
          `${k.id} is indexable without a local signal`,
        );
      }
    }
  });
});

describe("keyword registry: internal link fields are well-formed", () => {
  it("expresses every internal link as an absolute site path", () => {
    for (const k of KEYWORD_REGISTRY) {
      for (const href of [...k.linksTo, ...k.linksFrom]) {
        assert.ok(href.startsWith("/"), `${k.id}: link "${href}" is not a site-absolute path`);
      }
    }
  });

  it("never lists a page linking to itself in the plan", () => {
    for (const k of KEYWORD_REGISTRY) {
      assert.ok(!k.linksTo.includes(k.primaryUrl), `${k.id} links to its own URL`);
    }
  });

  it("points every internal link at a known route (no broken links)", () => {
    for (const k of KEYWORD_REGISTRY) {
      const broken = brokenLinks([...k.linksTo, ...k.linksFrom, k.primaryUrl]);
      assert.deepEqual(broken, [], `${k.id} references unknown route(s): ${broken.join(", ")}`);
    }
  });
});

describe("location architecture", () => {
  it("covers all 50 states plus D.C.", () => {
    assert.equal(US_STATES.length, 51, "expected 50 states + DC");
    const slugs = US_STATES.map((s) => s.slug);
    assert.equal(new Set(slugs).size, slugs.length, "duplicate state slugs");
  });

  it("has twelve pilot cities, each attached to a real state", () => {
    assert.equal(PILOT_CITIES.length, 12);
    assert.deepEqual(orphanCities(), [], "pilot cities pointing at unknown states");
  });

  it("keeps every state and city route in the known-routes set", () => {
    for (const s of US_STATES) assert.ok(isKnownRoute(`/locations/${s.slug}`), s.slug);
    for (const c of PILOT_CITIES) {
      assert.ok(isKnownRoute(`/locations/${c.stateSlug}/${c.slug}`), `${c.stateSlug}/${c.slug}`);
    }
  });

  it("starts with no indexable location pages (anti-doorway default)", () => {
    const indexableStates = US_STATES.filter((s) => isIndexable(s.publicationState));
    const indexableCities = PILOT_CITIES.filter((c) => isIndexable(c.publicationState));
    assert.deepEqual(indexableStates.map((s) => s.slug), [], "a state is indexable by default");
    assert.deepEqual(indexableCities.map((c) => c.slug), [], "a city is indexable by default");
  });
});

describe("service hubs", () => {
  it("gives every hub a unique slug and a registry entry", () => {
    const slugs = SERVICE_HUBS.map((h) => h.slug);
    assert.equal(new Set(slugs).size, slugs.length, "duplicate hub slugs");
    for (const h of SERVICE_HUBS) {
      assert.ok(getKeyword(h.keywordId), `${h.slug}: unknown keywordId ${h.keywordId}`);
    }
  });

  it("only cites project slugs that exist", () => {
    for (const h of SERVICE_HUBS) {
      for (const slug of h.projectSlugs) {
        assert.ok(getProject(slug), `${h.slug} cites missing project ${slug}`);
      }
    }
    for (const { hub, spoke } of allSpokes()) {
      for (const slug of spoke.projectSlugs) {
        assert.ok(getProject(slug), `${hub.slug}/${spoke.slug} cites missing project ${slug}`);
      }
    }
  });

  it("never publishes a hub with no evidencing build", () => {
    for (const h of SERVICE_HUBS) {
      if (isIndexable(h.publicationState)) {
        assert.ok(h.projectSlugs.length > 0, `${h.slug} is Published with no demonstration build`);
      }
    }
  });

  it("points every hub internal link at a known route", () => {
    for (const h of SERVICE_HUBS) {
      const broken = brokenLinks([...h.relatedTools, ...h.relatedHubs]);
      assert.deepEqual(broken, [], `${h.slug} has broken links: ${broken.join(", ")}`);
    }
  });
});

describe("sitemap", () => {
  it("lists only known routes", () => {
    const broken = brokenLinks(indexableSeoRoutes());
    assert.deepEqual(broken, [], `sitemap references unknown routes: ${broken.join(", ")}`);
  });

  it("never lists a noindex service hub or spoke", () => {
    const listed = new Set(indexableSeoRoutes());
    for (const h of SERVICE_HUBS) {
      if (!isIndexable(h.publicationState)) {
        assert.ok(!listed.has(`/services/${h.slug}`), `${h.slug} is noindex but in the sitemap`);
      }
      for (const s of h.spokes) {
        if (!isIndexable(s.publicationState)) {
          assert.ok(!listed.has(`/services/${h.slug}/${s.slug}`), `${h.slug}/${s.slug} noindex but in sitemap`);
        }
      }
    }
  });
});

describe("content ↔ registry alignment", () => {
  it("keeps every resource's publication state equal to its registry row", () => {
    for (const r of RESOURCES) {
      const row = getKeyword(r.keywordId);
      assert.ok(row, `${r.slug}: unknown keywordId ${r.keywordId}`);
      assert.equal(r.publicationState, row!.state, `${r.slug} state drifts from registry`);
    }
  });

  it("keeps every industry's publication state equal to its registry row", () => {
    for (const i of INDUSTRIES) {
      const row = getKeyword(i.keywordId);
      assert.ok(row, `${i.slug}: unknown keywordId ${i.keywordId}`);
      assert.equal(i.publicationState, row!.state, `${i.slug} state drifts from registry`);
    }
  });

  it("keeps every tool's state in sync with its registry row", () => {
    for (const t of TOOLS) {
      const row = getKeyword(t.keywordId);
      assert.ok(row, `${t.slug}: unknown keywordId ${t.keywordId}`);
      assert.equal(toolState(t), row!.state, `${t.slug} state drifts from registry`);
    }
  });

  it("only publishes an industry page that has evidencing builds", () => {
    for (const i of INDUSTRIES) {
      if (isIndexable(i.publicationState)) {
        assert.ok(i.projectSlugs.length > 0, `${i.slug} Published with no demonstration build`);
      }
    }
  });

  it("only cites real project slugs in resources and industries", () => {
    for (const i of INDUSTRIES) {
      for (const s of i.projectSlugs) assert.ok(getProject(s), `${i.slug} cites missing project ${s}`);
    }
  });

  it("points resource and industry internal links at known routes", () => {
    for (const r of RESOURCES) {
      const broken = brokenLinks([...r.related, `/resources/${r.slug}`]);
      assert.deepEqual(broken, [], `${r.slug} broken links: ${broken.join(", ")}`);
    }
    for (const i of INDUSTRIES) {
      const broken = brokenLinks([i.relatedHub, `/industries/${i.slug}`]);
      assert.deepEqual(broken, [], `${i.slug} broken links: ${broken.join(", ")}`);
    }
  });
});

describe("testimonials never fabricated", () => {
  it("contains only consented quotes (or none at all)", () => {
    assert.deepEqual(unconsentedTestimonials(), [], "unconsented testimonial present");
  });

  it("has no placeholder quotes", () => {
    for (const t of TESTIMONIALS) {
      assert.ok(t.quote.trim().length > 0, "empty testimonial quote");
      assert.ok(!/lorem|placeholder|example/i.test(t.quote), "placeholder-looking testimonial");
    }
  });
});

describe("evidence integrity (declarations cannot bypass reality)", () => {
  it("never cites a non-live project as evidence on a Published page", () => {
    const v = evidenceViolations();
    assert.deepEqual(
      v.map((x) => `${x.page} → ${x.project}: ${x.reason}`),
      [],
      "a Published page cites a project that is not a live demo",
    );
  });

  it("requires every Published hub/industry to cite at least one live demo", () => {
    assert.deepEqual(publishedWithoutLiveEvidence(), [], "Published page with no live evidencing build");
  });
});
describe("service-area matrix, pillar reconciliation & evidence tiers", () => {
  it("reconciles all 6 original business pillars and includes Creative Production & Brand & Growth nationwide", () => {
    assert.equal(BUSINESS_PILLARS.length, SERVICES.length, "pillar count matches lib/services.ts");
    for (const s of SERVICES) {
      assert.ok(
        BUSINESS_PILLARS.some((p) => p.pillarId === s.id),
        `original business pillar ${s.id} missing from BUSINESS_PILLARS`,
      );
    }
    const slugs = new Set(NATIONWIDE_SERVICES.map((s) => s.slug));
    assert.ok(slugs.has("creative-production"), "creative-production must be in nationwide architecture");
    assert.ok(slugs.has("branding"), "branding (Brand & Growth) must be in nationwide architecture");
  });

  it("models 408 nationwide combinations (incl. 306 engineering/sourcing subset) with 0 published", () => {
    const matrix = serviceAreaMatrix();
    assert.equal(matrix.length, 408, "expected 8 nationwide commercial tracks × 51 jurisdictions");
    assert.equal(coreServiceAreaMatrix().length, 306, "expected 6 core engineering/sourcing tracks × 51 jurisdictions");
    const published = matrix.filter((a) => isIndexable(a.publicationState));
    assert.deepEqual(published.map((a) => a.url), [], "service-area page published without local evidence");
    assert.deepEqual(unreviewedPublishedLocations(), [], "location page published without editorial review");
  });

  it("never equates locally tested Demo Ready projects with publicly deployed demos", () => {
    for (const p of PROJECTS) {
      if (p.status === "Demo Ready" && !p.liveUrl) {
        assert.equal(
          evidenceTierOf(p),
          "locally-tested-demo",
          `${p.slug} has no liveUrl so must classify as locally-tested-demo`,
        );
      }
    }
  });

  it("has zero blocking duplicate-intent conflicts across matrix and registry", () => {
    assert.deepEqual(
      blockingIntentConflicts().map((c) => c.signature),
      [],
      "two publishable URLs compete for the same intent signature",
    );
  });

  it("keeps every specialization spoke aligned with its keyword-registry state", () => {
    for (const { hub, spoke } of allSpokes()) {
      const row = getKeyword(spoke.keywordId);
      assert.ok(row, `${hub.slug}/${spoke.slug}: unknown keywordId ${spoke.keywordId}`);
      assert.equal(spoke.publicationState, row!.state, `${hub.slug}/${spoke.slug} state drifts from registry`);
    }
  });

  it("points every enriched hub internal link at a known route and valid /contact service option", () => {
    for (const [slug, enrich] of Object.entries(ALL_HUB_ENRICHMENTS)) {
      const hrefs = [
        ...enrich.relatedLinks.map((l) => l.href),
        ...(enrich.heroSecondary ? [enrich.heroSecondary.href] : []),
        ...(enrich.toolCallout ? [enrich.toolCallout.href] : []),
        ...enrich.industries.flatMap((i) => (i.href ? [i.href] : [])),
      ];
      assert.deepEqual(brokenLinks(hrefs), [], `enrichment:${slug} has broken internal links`);
      assert.ok(
        SERVICE_OPTIONS.includes(enrich.contactServiceTitle),
        `enrichment:${slug} CTA service "${enrich.contactServiceTitle}" is not in SERVICE_OPTIONS`,
      );
    }
  });
});
