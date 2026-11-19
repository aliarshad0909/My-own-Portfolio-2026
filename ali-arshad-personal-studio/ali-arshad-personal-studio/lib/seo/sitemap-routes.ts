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
import { US_STATES } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";

export function indexableSeoRoutes(): string[] {
  const out: string[] = [];

  // Section index pages that exist and are genuinely useful (not doorway
  // pages). Others (/tools, /resources, /industries) are added as their index
  // pages are built.
  out.push("/locations", "/services");

  // Dedicated service hubs and their specialisms.
  for (const h of SERVICE_HUBS) {
    if (isIndexable(h.publicationState)) out.push(`/services/${h.slug}`);
    for (const s of h.spokes) {
      if (isIndexable(s.publicationState)) out.push(`/services/${h.slug}/${s.slug}`);
    }
  }

  // Location pages — only ones that have been earned (currently none).
  for (const s of US_STATES) {
    if (isIndexable(s.publicationState)) out.push(`/locations/${s.slug}`);
  }
  for (const c of PILOT_CITIES) {
    if (isIndexable(c.publicationState)) out.push(`/locations/${c.stateSlug}/${c.slug}`);
  }

  // De-duplicate while preserving order.
  return [...new Set(out)];
}
