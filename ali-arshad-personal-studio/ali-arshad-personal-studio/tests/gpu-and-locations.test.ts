import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { allCityLocalContent, getCityLocalContent } from "@/lib/geo/city-local-content";
import {
  locationsForServiceHub,
  projectsForState,
  stateHasGpuComputeFit,
} from "@/lib/geo/location-connections";
import { previewSamplesForState, shouldShowPreviewSamples } from "@/lib/geo/preview-samples";
import { STATE_LOCAL_CONTENT } from "@/lib/geo/state-local-content";
import { US_STATES } from "@/lib/geo/states";
import { SERVICE_OPTIONS } from "@/lib/inquiry";
import { getProject } from "@/lib/projects";
import { isIndexable } from "@/lib/seo/publication";
import { brokenLinks, isKnownRoute } from "@/lib/seo/routes";
import { SERVICE_HUBS } from "@/lib/seo/service-hubs";
import { indexableSeoRoutes } from "@/lib/seo/sitemap-routes";
import { SERVICES } from "@/lib/services";
import {
  GPU_COMPUTE_CONTACT_SERVICE,
  GPU_COMPUTE_PATH,
  GPU_COMPUTE_PUBLICATION_STATE,
  GPU_COMPUTE_SPECS,
  GPU_RELATED_PROJECT_SLUGS,
  GPU_RELATED_TOOLS,
} from "@/lib/gpu-compute";

describe("GPU compute consultation service", () => {
  it("stays PublicNoIndex (reviewable, excluded from sitemap) with consultation-scoped specs, zero [TBD] text, and valid links", () => {
    assert.equal(GPU_COMPUTE_PUBLICATION_STATE, "PublicNoIndex");
    assert.equal(isIndexable(GPU_COMPUTE_PUBLICATION_STATE), false);
    assert.ok(isKnownRoute(GPU_COMPUTE_PATH));
    assert.ok(!indexableSeoRoutes().includes(GPU_COMPUTE_PATH));
    assert.ok(SERVICE_OPTIONS.includes(GPU_COMPUTE_CONTACT_SERVICE));
    assert.equal(SERVICE_OPTIONS.at(-1), "Not sure yet");

    for (const spec of GPU_COMPUTE_SPECS) {
      assert.equal(spec.status, "Confirmed during consultation");
      assert.ok(!/\[TBD/i.test(spec.value), `GPU spec must not show [TBD] placeholder: ${spec.value}`);
    }
    for (const slug of GPU_RELATED_PROJECT_SLUGS) {
      assert.ok(getProject(slug), `missing GPU related project ${slug}`);
    }
    assert.deepEqual(
      brokenLinks(GPU_RELATED_TOOLS.map((t) => t.href)),
      [],
      "GPU related tool link is broken",
    );
  });
});

describe("registered city local content (exact 12 cities)", () => {
  it("covers every registered city in PILOT_CITIES with valid citations, links, and NeedsEvidence gate", () => {
    assert.equal(allCityLocalContent().length, PILOT_CITIES.length);

    for (const city of PILOT_CITIES) {
      assert.equal(city.publicationState, "NeedsEvidence", `${city.slug} must stay NeedsEvidence`);
      assert.equal(isIndexable(city.publicationState), false);

      const local = getCityLocalContent(city.stateSlug, city.slug);
      assert.ok(local, `missing local content for ${city.stateSlug}/${city.slug}`);
      assert.ok(local!.sources.length >= 2, `${city.slug} should cite at least 2 real sources`);

      for (const s of local!.sources) {
        assert.ok(s.url.startsWith("https://"), `${city.slug} source must be https: ${s.url}`);
        const parsed = new URL(s.url);
        assert.ok(
          parsed.pathname !== "/" && parsed.pathname.length > 1,
          `${city.slug} source must point to an exact page, not a generic domain homepage: ${s.url}`,
        );
        assert.match(s.accessed, /^\d{4}-\d{2}-\d{2}$/);
      }

      const cited = local!.context.flatMap((p) => p.sources ?? []);
      assert.ok(cited.length > 0, `${city.slug} must have inline citations`);
      for (const idx of cited) {
        assert.ok(idx >= 0 && idx < local!.sources.length, `${city.slug} invalid source index ${idx}`);
      }

      assert.deepEqual(
        brokenLinks(local!.serviceFit.map((f) => f.href)),
        [],
        `${city.slug} has broken serviceFit href`,
      );
      for (const slug of local!.recommendedProjectSlugs) {
        assert.ok(getProject(slug), `${city.slug} references missing project ${slug}`);
      }
    }
  });
});

describe("bidirectional service ↔ location ↔ project connections", () => {
  it("connects flagship live SaaS demos (pipelineos-crm, stockflow-inventory) to services and hubs", () => {
    const webService = SERVICES.find((s) => s.id === "web-development");
    assert.ok(webService?.projectSlugs.includes("pipelineos-crm"));
    assert.ok(webService?.projectSlugs.includes("stockflow-inventory"));

    const webHub = SERVICE_HUBS.find((h) => h.slug === "web-development");
    assert.ok(webHub?.projectSlugs.includes("pipelineos-crm"));
    assert.ok(webHub?.projectSlugs.includes("stockflow-inventory"));

    const dashHub = SERVICE_HUBS.find((h) => h.slug === "business-dashboards");
    assert.ok(dashHub?.projectSlugs.includes("stockflow-inventory"));
  });

  it("maps every state to real demonstrations and every published service hub to relevant states", () => {
    for (const st of US_STATES) {
      assert.equal(st.publicationState, "PublicNoIndex");
      const projects = projectsForState(st.slug, 3);
      assert.ok(projects.length > 0, `${st.slug} should resolve at least one related project`);
    }
    assert.equal(stateHasGpuComputeFit("california"), true);
    assert.equal(stateHasGpuComputeFit("texas"), true);

    for (const hub of SERVICE_HUBS.filter((h) => isIndexable(h.publicationState))) {
      const matches = locationsForServiceHub(hub.slug, 8);
      assert.ok(matches.states.length > 0, `${hub.slug} should link to at least one matching state`);
    }
  });
});

describe("preview-only TEST / SAMPLE CONTENT production gate", () => {
  const prevVercelEnv = process.env.VERCEL_ENV;
  afterEach(() => {
    if (prevVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercelEnv;
  });

  it("excludes all sample scenarios when VERCEL_ENV=production and labels them visibly on previews", () => {
    const tx = US_STATES.find((s) => s.slug === "texas")!;
    const txLocal = STATE_LOCAL_CONTENT.texas;

    process.env.VERCEL_ENV = "production";
    assert.equal(shouldShowPreviewSamples(), false);
    assert.deepEqual(previewSamplesForState(tx, txLocal), []);

    process.env.VERCEL_ENV = "preview";
    assert.equal(shouldShowPreviewSamples(), true);
    const samples = previewSamplesForState(tx, txLocal);
    assert.ok(samples.length >= 1);
    for (const sample of samples) {
      assert.equal(sample.label, "TEST / SAMPLE CONTENT");
      assert.match(sample.disclaimer, /TEST \/ SAMPLE CONTENT/);
    }
  });
});
