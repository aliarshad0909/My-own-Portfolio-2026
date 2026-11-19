/**
 * Twelve pilot cities — the first metros where a city-level page could be
 * justified if a local signal appears. Same rule as states (lib/geo/states.ts):
 * these are typed records, not twelve published pages. All default to
 * `NeedsEvidence`; a city page only renders in production and enters the index
 * once it is `Published` with a genuine local signal.
 *
 * The pilot set is deliberately small and high-intent. It is NOT a seed for
 * mass-generating a page per US city — that is the doorway pattern this
 * architecture exists to avoid.
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
];

export const PILOT_CITIES: PilotCity[] = ROWS.map(city);

/** Guard: every pilot city points at a real state record. */
export const orphanCities = (): PilotCity[] =>
  PILOT_CITIES.filter((c) => !US_STATES.some((s) => s.slug === c.stateSlug));

export const getCity = (stateSlug: string, citySlug: string) =>
  PILOT_CITIES.find((c) => c.stateSlug === stateSlug && c.slug === citySlug);

export const citiesInState = (stateSlug: string) =>
  PILOT_CITIES.filter((c) => c.stateSlug === stateSlug);
