import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  KEYWORD_REGISTRY,
  duplicateKeywords,
  duplicatePrimaryUrls,
  evidenceGaps,
} from "@/lib/seo/keyword-registry";
import { PUBLICATION_STATES, isIndexable } from "@/lib/seo/publication";
import { brokenLinks, isKnownRoute } from "@/lib/seo/routes";
import { US_STATES } from "@/lib/geo/states";
import { PILOT_CITIES, orphanCities } from "@/lib/geo/cities";

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
