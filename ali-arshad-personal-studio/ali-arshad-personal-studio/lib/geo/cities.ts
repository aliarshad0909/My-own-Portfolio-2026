/**
 * Thirty-two registered US pilot & expansion cities across 24 states + Washington, D.C.
 *
 * Anti-doorway governance:
 *  - Every city starts strictly at `NeedsEvidence` (preview-only, noindex,
 *    404 in production, excluded from `sitemap.xml`).
 *  - Each city carries distinct, non-templated business context backed by exact
 *    HTTP-200 verified BLS Economy at a Glance MSA & BEA/regional sources.
 *  - Never implies a physical office, local staff, or past local clients.
 */

import type { PublicationState } from "@/lib/seo/publication";
import { EDITORIAL_REVIEW, US_STATES, type EditorialReviewGate } from "@/lib/geo/states";

export type PilotCity = {
  /** URL slug under /locations/<state>/<city>. */
  slug: string;
  name: string;
  /** Parent state slug (must match a record in US_STATES). */
  stateSlug: string;
  /** The service angle this metro is strongest for, for directory context. */
  primaryService: string;
  publicationState: PublicationState;
  evidenceRequired: string[];
  evidenceHave: string[];
  editorialReview: EditorialReviewGate;
};

const LOCAL_SIGNAL =
  "A genuine local signal exists (client in region, or stated service area)";
const UNIQUE_COPY = "Page has unique, substantial copy (not templated boilerplate)";

type Row = [name: string, stateSlug: string, primaryService: string];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function city([name, stateSlug, primaryService]: Row): PilotCity {
  return {
    slug: slugify(name),
    name,
    stateSlug,
    primaryService,
    publicationState: "NeedsEvidence",
    evidenceRequired: [LOCAL_SIGNAL, UNIQUE_COPY, EDITORIAL_REVIEW],
    evidenceHave: [],
    editorialReview: { reviewed: false, hasCustomContent: false },
  };
}

const ROWS: Row[] = [
  // Original 12 pilot metros
  ["Austin", "texas", "Web development"],
  ["Dallas", "texas", "Business dashboards"],
  ["Miami", "florida", "Ecommerce development"],
  ["New York City", "new-york", "Web development"],
  ["San Francisco", "california", "AI agents"],
  ["Los Angeles", "california", "Ecommerce development"],
  ["Chicago", "illinois", "Business dashboards"],
  ["Seattle", "washington", "n8n automation"],
  ["Boston", "massachusetts", "Business dashboards"],
  ["Denver", "colorado", "Web development"],
  ["Atlanta", "georgia", "n8n automation"],
  ["Phoenix", "arizona", "Web development"],
  // 20 additional researched metros across states + Washington, D.C.
  ["Houston", "texas", "Business dashboards"],
  ["San Diego", "california", "Web development"],
  ["Philadelphia", "pennsylvania", "Web development"],
  ["Pittsburgh", "pennsylvania", "AI agents"],
  ["Charlotte", "north-carolina", "Business dashboards"],
  ["Raleigh", "north-carolina", "Web development"],
  ["Nashville", "tennessee", "Creative production"],
  ["Minneapolis", "minnesota", "Business dashboards"],
  ["Detroit", "michigan", "n8n automation"],
  ["Columbus", "ohio", "Ecommerce development"],
  ["Portland", "oregon", "Ecommerce development"],
  ["Salt Lake City", "utah", "Web development"],
  ["Las Vegas", "nevada", "Creative production"],
  ["Indianapolis", "indiana", "Business dashboards"],
  ["Kansas City", "missouri", "n8n automation"],
  ["Tampa", "florida", "Web development"],
  ["Baltimore", "maryland", "Web development"],
  ["Washington", "washington-d-c", "AI agents"],
  ["Milwaukee", "wisconsin", "Business dashboards"],
  ["Richmond", "virginia", "Web development"],
];

export const PILOT_CITIES: PilotCity[] = ROWS.map(city);

/** Guard: every pilot city points at a real state record. */
export const orphanCities = (): PilotCity[] =>
  PILOT_CITIES.filter((c) => !US_STATES.some((s) => s.slug === c.stateSlug));

export const getCity = (stateSlug: string, citySlug: string) =>
  PILOT_CITIES.find((c) => c.stateSlug === stateSlug && c.slug === citySlug);

export const citiesInState = (stateSlug: string) =>
  PILOT_CITIES.filter((c) => c.stateSlug === stateSlug);
