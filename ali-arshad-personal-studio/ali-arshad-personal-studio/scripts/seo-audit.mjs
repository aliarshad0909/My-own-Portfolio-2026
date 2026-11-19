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
import { evidenceViolations, publishedWithoutLiveEvidence } from "@/lib/seo/evidence";
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
for (const r of RESOURCES) for (const b of brokenLinks(r.related)) linkProblems.push(`${r.slug} → ${b}`);
for (const i of INDUSTRIES) for (const b of brokenLinks([i.relatedHub])) linkProblems.push(`${i.slug} → ${b}`);
check("No broken internal links", linkProblems);

check("Sitemap lists only known routes", brokenLinks(indexableSeoRoutes()));

// Evidence integrity: a Published page cannot cite a project that is not built.
check(
  "Published pages cite only live demonstration builds",
  evidenceViolations().map((v) => `${v.page} → ${v.project}: ${v.reason}`),
);
check("Every Published hub/industry has a live evidencing build", publishedWithoutLiveEvidence());

// Location anti-doorway: nothing indexable without a local signal.
const doorway = [];
for (const s of US_STATES) {
  if (isIndexable(s.publicationState) && !s.evidenceHave.includes(LOCAL_SIGNAL)) doorway.push(`state ${s.slug}`);
}
for (const c of PILOT_CITIES) {
  if (isIndexable(c.publicationState) && !c.evidenceHave.includes(LOCAL_SIGNAL)) doorway.push(`city ${c.slug}`);
}
check("No location page indexable without a local signal", doorway);

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
