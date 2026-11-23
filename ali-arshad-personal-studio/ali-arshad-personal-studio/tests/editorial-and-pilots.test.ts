import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INSIGHTS, publishedInsights } from "@/lib/content/insights";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { CITY_PILOTS, getCityPilot } from "@/lib/geo/city-pilots";
import { getProject } from "@/lib/projects";
import { isIndexable } from "@/lib/seo/publication";
import { isKnownRoute } from "@/lib/seo/routes";
import { normaliseUpdates, validateUpdates } from "@/lib/updates";
import { isUpdatesConfigured } from "@/lib/updates-server";

describe("editorial insights system", () => {
  it("gives every published post unique slugs, valid dates, sources, and known internal links", () => {
    const posts = publishedInsights();
    assert.ok(posts.length >= 4, "expected at least 4 published insight posts");

    const slugs = new Set<string>();
    for (const post of posts) {
      assert.ok(!slugs.has(post.slug), `duplicate insight slug ${post.slug}`);
      slugs.add(post.slug);
      assert.ok(post.author.length > 0);
      assert.match(post.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(post.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(post.sources.length > 0, `${post.slug} should cite at least one primary source`);
      for (const src of post.sources) {
        assert.ok(src.url.startsWith("https://"), `${post.slug} source URL must be https`);
        assert.match(src.checkedDate, /^\d{4}-\d{2}-\d{2}$/);
      }
      assert.ok(isKnownRoute(post.relatedServiceHref), `${post.slug} cites unknown service route`);
      for (const ps of post.relatedProjectSlugs) {
        assert.ok(getProject(ps), `${post.slug} cites missing project ${ps}`);
      }
    }
    assert.equal(INSIGHTS.length, posts.length);
  });
});

describe("city pilot pages governance", () => {
  it("keeps all 3 Tier-1 pilots non-indexed (PublicNoIndex) with primary sources and review dates", () => {
    assert.equal(CITY_PILOTS.length, 3, "only the 3 Tier-1 pilot cities should be built before review");
    for (const pilot of CITY_PILOTS) {
      const record = PILOT_CITIES.find((c) => c.stateSlug === pilot.stateSlug && c.slug === pilot.citySlug);
      assert.ok(record, `pilot ${pilot.citySlug} must exist in PILOT_CITIES`);
      assert.equal(record.publicationState, "PublicNoIndex");
      assert.equal(isIndexable(record.publicationState), false, "pilot city must remain noindex until approved");
      assert.ok(pilot.sources.length >= 2, `${pilot.citySlug} requires >= 2 primary sources`);
      for (const src of pilot.sources) {
        assert.ok(src.url.startsWith("https://"));
        assert.match(src.checkedDate, /^\d{4}-\d{2}-\d{2}$/);
        assert.match(src.reviewBy, /^\d{4}-\d{2}-\d{2}$/);
      }
      assert.ok(pilot.remoteDisclosure.toLowerCase().includes("remote"));
      for (const svc of pilot.recommendedServices) {
        assert.ok(isKnownRoute(svc.href), `${pilot.citySlug} cites unknown service ${svc.href}`);
      }
      assert.ok(getCityPilot(pilot.stateSlug, pilot.citySlug));
    }
  });
});

describe("optional studio updates signup", () => {
  it("validates email and requires explicit opt-in consent", () => {
    const bad = normaliseUpdates({ email: "bad", consent: false });
    const errs = validateUpdates(bad);
    assert.ok(errs.email);
    assert.ok(errs.consent);

    const ok = normaliseUpdates({ email: "  Reader@Example.com ", consent: true });
    assert.equal(ok.email, "reader@example.com");
    assert.deepEqual(validateUpdates(ok), {});
  });

  it("reports unconfigured when no mailing webhook or Resend env vars exist", () => {
    const keys = ["UPDATES_WEBHOOK_URL", "RESEND_API_KEY", "UPDATES_TO_EMAIL", "INQUIRY_TO_EMAIL", "INQUIRY_FROM_EMAIL"];
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    try {
      for (const k of keys) delete process.env[k];
      assert.equal(isUpdatesConfigured(), false);
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});
