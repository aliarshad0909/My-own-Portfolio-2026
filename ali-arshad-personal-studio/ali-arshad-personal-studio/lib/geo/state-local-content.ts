/**
 * Composed per-state local content for /locations/[state] pages.
 *
 * DATA ONLY. Adding an entry enriches a page but never changes its publication
 * state or indexability (see lib/seo/publication.ts). Regional partials are
 * kept in lib/geo/local/* so research can be maintained region by region.
 */
import type { StateLocalContent } from "@/lib/geo/local-content-types";
import { SOUTH_LOCAL } from "@/lib/geo/local/south";
import { WEST_LOCAL } from "@/lib/geo/local/west";
import { NORTHEAST_LOCAL } from "@/lib/geo/local/northeast";
import { MIDWEST_LOCAL } from "@/lib/geo/local/midwest";

export const STATE_LOCAL_CONTENT: Record<string, StateLocalContent> = {
  ...SOUTH_LOCAL,
  ...WEST_LOCAL,
  ...NORTHEAST_LOCAL,
  ...MIDWEST_LOCAL,
};

export const getStateLocalContent = (slug: string): StateLocalContent | undefined =>
  STATE_LOCAL_CONTENT[slug];
