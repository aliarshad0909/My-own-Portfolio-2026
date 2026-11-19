/**
 * Nationwide service-area SEO report.
 *
 * Aggregates every page-bearing record across the SEO architecture and sorts it
 * into the five categories the brief asks for:
 *
 *   1. Planned URLs          — Researched: a planned URL + intent, no page.
 *   2. Draft pages           — Drafted / NeedsEvidence: preview-only, noindex.
 *   3. Published & indexable — Published: live and in the sitemap.
 *   4. Missing evidence      — Published (or would-be) without satisfied evidence.
 *   5. Blocked by duplicate  — intent collisions (blocking, and advisory).
 *
 * Run with `npm run seo:report`. Read-only; prints to stdout.
 */
import { KEYWORD_REGISTRY, evidenceGaps } from "@/lib/seo/keyword-registry";
import { SERVICE_HUBS } from "@/lib/seo/service-hubs";
import { RESOURCES } from "@/lib/content/resources";
import { INDUSTRIES } from "@/lib/content/industries";
import { TOOLS, toolState } from "@/lib/tools/catalog";
import { US_STATES } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";
import {
  serviceAreaMatrix,
  cityServiceAreas,
  duplicateIntentConflicts,
  blockingIntentConflicts,
} from "@/lib/seo/service-areas";
import { evidenceViolations } from "@/lib/seo/evidence";

const DRAFT_STATES = new Set(["Drafted", "NeedsEvidence"]);

/** Normalise every source into {url, label, state, evidenceSatisfied}. */
function allRecords() {
  const rows = [];
  const push = (url, label, state, evidenceSatisfied = true) =>
    rows.push({ url, label, state, evidenceSatisfied });

  for (const h of SERVICE_HUBS) {
    push(`/services/${h.slug}`, `Service hub: ${h.h1}`, h.publicationState);
    for (const s of h.spokes) push(`/services/${h.slug}/${s.slug}`, `Specialization: ${s.h1}`, s.publicationState);
  }
  for (const t of TOOLS) push(`/tools/${t.slug}`, `Tool: ${t.h1}`, toolState(t));
  for (const r of RESOURCES) push(`/resources/${r.slug}`, `Guide: ${r.title}`, r.publicationState);
  for (const i of INDUSTRIES) push(`/industries/${i.slug}`, `Industry: ${i.name}`, i.publicationState);
  for (const s of US_STATES) push(`/locations/${s.slug}`, `Location: ${s.name}`, s.publicationState);
  for (const c of PILOT_CITIES) push(`/locations/${c.stateSlug}/${c.slug}`, `Location: ${c.name}`, c.publicationState);
  for (const a of serviceAreaMatrix())
    push(a.url, `Service-area: ${a.keyword}`, a.publicationState, a.evidenceRequired.every((e) => a.evidenceHave.includes(e)));
  for (const a of cityServiceAreas())
    push(a.url, `City service-area: ${a.keyword}`, a.publicationState);

  return rows;
}

const rows = allRecords();
const planned = rows.filter((r) => r.state === "Researched");
const drafts = rows.filter((r) => DRAFT_STATES.has(r.state));
const published = rows.filter((r) => r.state === "Published");
const retired = rows.filter((r) => r.state === "Retired");

// Missing evidence: registry rows flagged + published content citing unbuilt work.
const registryGaps = evidenceGaps();
const citationGaps = evidenceViolations();

const blocking = blockingIntentConflicts();
const advisory = duplicateIntentConflicts().filter(
  (c) => c.owners.filter((o) => o.publishable).length <= 1,
);

const h = (t) => console.log(`\n${t}\n${"─".repeat(t.length)}`);
console.log("NATIONWIDE SERVICE-AREA SEO REPORT");
console.log("==================================");
console.log(`Total page-bearing records: ${rows.length}`);
console.log(`  Planned: ${planned.length} · Drafts: ${drafts.length} · Published: ${published.length} · Retired: ${retired.length}`);

h("1. PLANNED URLs (Researched — URL + intent, no page rendered)");
console.log(`Count: ${planned.length}`);
const plannedByKind = {};
for (const r of planned) {
  const k = r.label.split(":")[0];
  plannedByKind[k] = (plannedByKind[k] || 0) + 1;
}
for (const [k, n] of Object.entries(plannedByKind).sort()) console.log(`  ${k}: ${n}`);
console.log("  (examples)");
for (const r of planned.slice(0, 6)) console.log(`   - ${r.url}  [${r.label}]`);

h("2. DRAFT PAGES (Drafted / NeedsEvidence — preview-only, noindex)");
console.log(`Count: ${drafts.length}`);
for (const r of drafts) console.log(`   - ${r.state.padEnd(13)} ${r.url}  [${r.label}]`);

h("3. PUBLISHED & INDEXABLE PAGES");
console.log(`Count: ${published.length}`);
for (const r of published) console.log(`   - ${r.url}  [${r.label}]`);

h("4. PAGES MISSING EVIDENCE");
console.log(`Registry rows Published without satisfied evidence: ${registryGaps.length}`);
for (const g of registryGaps) console.log(`   - ${g.primaryUrl}  [${g.id}]`);
console.log(`Published pages citing a non-live / mismatched build: ${citationGaps.length}`);
for (const v of citationGaps) console.log(`   - ${v.page} -> ${v.project}: ${v.reason}`);
if (registryGaps.length === 0 && citationGaps.length === 0) console.log("   (none — every published page's evidence is satisfied)");

h("5. PAGES BLOCKED BY DUPLICATE INTENT");
console.log(`Blocking conflicts (2+ publishable owners of one intent): ${blocking.length}`);
for (const c of blocking) {
  console.log(`   ! "${c.signature}"`);
  for (const o of c.owners) console.log(`       ${o.publishable ? "[PUBLISHED]" : "[gated]"} ${o.url}`);
}
console.log(`Advisory overlaps (flagged; at most one publishable, so not blocking): ${advisory.length}`);
for (const c of advisory.slice(0, 12)) {
  console.log(`   ~ "${c.signature}": ${c.owners.map((o) => o.url).join("  |  ")}`);
}

console.log("\nDone.\n");
