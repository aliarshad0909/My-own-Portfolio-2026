/**
 * SEO audit — one command that checks the whole architecture and prints a
 * readable report. Run with `npm run seo:audit`. Exits non-zero if any check
 * fails, so it can gate CI.
 *
 * Checks (per the publication/anti-doorway rules):
 *   1. Duplicate keywords
 *   2. Conflicting canonicals (one primaryUrl claimed twice)
 *   3. Publication eligibility (Published rows have satisfied evidence)
 *   4. Missing evidence on would-be-published records
 *   5. Broken internal links (registry, hubs, resources, industries)
 *   6. Sitemap consistency (lists only known, indexable routes)
 *   7. No location page indexable without a local signal
 *   8. No fabricated / unconsented testimonials
 */
import {
  KEYWORD_REGISTRY,
  duplicateKeywords,
  duplicatePrimaryUrls,
  evidenceGaps,
} from "@/lib/seo/keyword-registry";
import { isIndexable } from "@/lib/seo/publication";
import { brokenLinks } from "@/lib/seo/routes";
import { indexableSeoRoutes } from "@/lib/seo/sitemap-routes";
import { SERVICE_HUBS } from "@/lib/seo/service-hubs";
import { ALL_HUB_ENRICHMENTS } from "@/lib/seo/service-enrichment";
import { BUSINESS_PILLARS, NATIONWIDE_SERVICES, blockingIntentConflicts, serviceAreaMatrix } from "@/lib/seo/service-areas";
import { evidenceViolations, publishedWithoutLiveEvidence, unreviewedPublishedLocations } from "@/lib/seo/evidence";
import { SERVICES } from "@/lib/services";
import { SERVICE_OPTIONS } from "@/lib/inquiry";
import { RESOURCES } from "@/lib/content/resources";
import { INDUSTRIES } from "@/lib/content/industries";
import { US_STATES } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { unconsentedTestimonials } from "@/lib/content/testimonials";

const LOCAL_SIGNAL = "A genuine local signal exists (client in region, or stated service area)";

let failures = 0;
const check = (name, problems) => {
  const list = problems ?? [];
  if (list.length === 0) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}`);
    for (const p of list) console.log(`          - ${p}`);
  }
};

console.log("\nSEO architecture audit\n──────────────────────");

check("No duplicate keywords", duplicateKeywords());
check("No conflicting canonicals (one owner per URL)", duplicatePrimaryUrls());
check(
  "Publication eligibility (Published ⇒ evidence satisfied)",
  evidenceGaps().map((g) => `${g.id} (${g.primaryUrl})`),
);

// Broken internal links across every source of links.
const linkProblems = [];
for (const k of KEYWORD_REGISTRY) {
  for (const b of brokenLinks([...k.linksTo, ...k.linksFrom, k.primaryUrl])) linkProblems.push(`${k.id} → ${b}`);
}
for (const h of SERVICE_HUBS) {
  for (const b of brokenLinks([...h.relatedTools, ...h.relatedHubs])) linkProblems.push(`${h.slug} → ${b}`);
}
for (const [slug, enrich] of Object.entries(ALL_HUB_ENRICHMENTS)) {
  const hrefs = [
    ...enrich.relatedLinks.map((l) => l.href),
    ...(enrich.heroSecondary ? [enrich.heroSecondary.href] : []),
    ...(enrich.toolCallout ? [enrich.toolCallout.href] : []),
    ...enrich.industries.flatMap((i) => (i.href ? [i.href] : [])),
  ];
  for (const b of brokenLinks(hrefs)) linkProblems.push(`enrichment:${slug} → ${b}`);
}
for (const r of RESOURCES) for (const b of brokenLinks(r.related)) linkProblems.push(`${r.slug} → ${b}`);
for (const i of INDUSTRIES) for (const b of brokenLinks([i.relatedHub])) linkProblems.push(`${i.slug} → ${b}`);
check("No broken internal links", linkProblems);

check("Sitemap lists only known routes", brokenLinks(indexableSeoRoutes()));

// Evidence integrity: a Published page cannot cite an unbuilt project or overclaim its tier.
check(
  "Published pages cite only substantiated builds matching their claimed evidence tier",
  evidenceViolations().map((v) => `${v.page} → ${v.project}: ${v.reason}`),
);
check("Every Published hub/spoke/industry has a substantiated build", publishedWithoutLiveEvidence());

// Pillar reconciliation: all 6 original pillars mapped; Creative Production & Brand & Growth included.
const missingPillars = SERVICES.filter((s) => !BUSINESS_PILLARS.some((p) => p.pillarId === s.id)).map((s) => s.id);
const missingNationwide = ["creative-production", "branding"].filter(
  (slug) => !NATIONWIDE_SERVICES.some((s) => s.slug === slug),
);
check("All 6 business pillars reconciled and Creative Production + Brand & Growth in nationwide matrix", [
  ...missingPillars.map((id) => `unmapped pillar: ${id}`),
  ...missingNationwide.map((slug) => `missing from NATIONWIDE_SERVICES: ${slug}`),
]);

// CTA service pre-selection integrity.
const badCtaServices = Object.entries(ALL_HUB_ENRICHMENTS)
  .filter(([, enrich]) => !SERVICE_OPTIONS.includes(enrich.contactServiceTitle))
  .map(([slug, enrich]) => `${slug} → "${enrich.contactServiceTitle}"`);
check("Every service hub CTA maps to a valid /contact service option", badCtaServices);

// Location anti-doorway + mandatory editorial review gate.
const doorway = [];
for (const s of US_STATES) {
  if (isIndexable(s.publicationState) && !s.evidenceHave.includes(LOCAL_SIGNAL)) doorway.push(`state ${s.slug}`);
}
for (const c of PILOT_CITIES) {
  if (isIndexable(c.publicationState) && !c.evidenceHave.includes(LOCAL_SIGNAL)) doorway.push(`city ${c.slug}`);
}
for (const a of serviceAreaMatrix()) {
  if (isIndexable(a.publicationState) && !a.evidenceHave.includes(LOCAL_SIGNAL)) doorway.push(`area ${a.url}`);
}
check("No location or service-area page indexable without a local signal", doorway);
check(
  "No location or service-area page published without completed editorial review",
  unreviewedPublishedLocations(),
);

check(
  "No blocking duplicate-intent conflicts across matrix & registry",
  blockingIntentConflicts().map((c) => `${c.signature} → ${c.owners.map((o) => o.url).join(" vs ")}`),
);

check(
  "No unconsented / fabricated testimonials",
  unconsentedTestimonials().map((t) => t.author || "(anonymous)"),
);

// Summary counts (informational).
const byState = {};
for (const k of KEYWORD_REGISTRY) byState[k.state] = (byState[k.state] ?? 0) + 1;
console.log("\nRegistry by publication state:");
for (const [state, n] of Object.entries(byState).sort()) console.log(`  ${state}: ${n}`);
console.log(`  Total opportunities: ${KEYWORD_REGISTRY.length}`);
console.log(`Indexable SEO routes in sitemap: ${indexableSeoRoutes().length}`);

console.log(`\n${failures === 0 ? "AUDIT PASSED" : `AUDIT FAILED (${failures} check(s))`}\n`);
process.exit(failures === 0 ? 0 : 1);
