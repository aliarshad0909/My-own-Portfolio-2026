/**
 * The indexable routes contributed by the SEO architecture, for the sitemap.
 *
 * A route appears here only when its record is `Published` — the same gate as
 * everything else. Draft, evidence-pending and researched pages never enter
 * the sitemap, so the sitemap can never advertise a page that is noindex or
 * that does not render in production. The directory/index pages that always
 * exist and are genuinely useful (not doorway pages) are listed explicitly.
 */

import { isIndexable } from "@/lib/seo/publication";
import { SERVICE_HUBS } from "@/lib/seo/service-hubs";
import { cityServiceAreas, serviceAreaMatrix } from "@/lib/seo/service-areas";
import { US_STATES } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { RESOURCES } from "@/lib/content/resources";
import { INDUSTRIES } from "@/lib/content/industries";
import { TOOLS, toolState } from "@/lib/tools/catalog";
import { getKeyword } from "@/lib/seo/keyword-registry";

export function indexableSeoRoutes(): string[] {
  const out: string[] = [];

  // Section index pages — real, useful landing pages (not doorway pages).
  out.push("/locations", "/services", "/tools", "/resources", "/industries");
  if (isIndexable(getKeyword("net-studio-network")?.state ?? "Researched")) {
    out.push("/studio-network");
  }

  // Dedicated service hubs and their specialisms.
  for (const h of SERVICE_HUBS) {
    if (isIndexable(h.publicationState)) out.push(`/services/${h.slug}`);
    for (const s of h.spokes) {
      if (isIndexable(s.publicationState)) out.push(`/services/${h.slug}/${s.slug}`);
    }
  }

  // Tools (functional calculators) — all Published today.
  for (const t of TOOLS) {
    if (isIndexable(toolState(t))) out.push(`/tools/${t.slug}`);
  }

  // Resource guides that are fully written and Published.
  for (const r of RESOURCES) {
    if (isIndexable(r.publicationState)) out.push(`/resources/${r.slug}`);
  }

  // Industry pages that are Published (real demo evidence + unique copy).
  for (const i of INDUSTRIES) {
    if (isIndexable(i.publicationState)) out.push(`/industries/${i.slug}`);
  }

  // Location pages — only ones that have been earned (currently none).
  for (const s of US_STATES) {
    if (isIndexable(s.publicationState)) out.push(`/locations/${s.slug}`);
  }
  for (const c of PILOT_CITIES) {
    if (isIndexable(c.publicationState)) out.push(`/locations/${c.stateSlug}/${c.slug}`);
  }

  // Service-area matrix (306 state × service + selected city × service) — only
  // earned, Published combinations enter the sitemap (currently 0).
  for (const a of serviceAreaMatrix()) {
    if (isIndexable(a.publicationState)) out.push(a.url);
  }
  for (const ca of cityServiceAreas()) {
    if (isIndexable(ca.publicationState)) out.push(ca.url);
  }

  return [...new Set(out)];
}
