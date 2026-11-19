/**
 * Typed records for all 50 US states and Washington, D.C.
 *
 * This is ARCHITECTURE for nationwide service coverage, not 51 published
 * pages. Every record defaults to `NeedsEvidence`: the service travels (remote
 * work), but a *page* targeting "web developer in <state>" is a doorway page
 * until there is a genuine local signal behind it — a client in that state, or
 * a deliberately stated service area. Until then the record exists in data (so
 * the model scales and the directory can show intended coverage), the route
 * does not render in production, and nothing is indexed.
 *
 * To publish one state page honestly: set `publicationState` to "Published"
 * and add the matching evidence string to `evidenceHave`. The SEO tests refuse
 * a Published state whose evidence is not satisfied.
 */

import type { PublicationState } from "@/lib/seo/publication";

export type UsRegion = "Northeast" | "Midwest" | "South" | "West";

export type EditorialReviewGate = {
  /** Must be set true by a human reviewer confirming locally differentiated content. */
  reviewed: boolean;
  /** True only once templated scaffold copy is replaced with bespoke geographic copy. */
  hasCustomContent: boolean;
  reviewerNote?: string;
};

export type UsState = {
  /** USPS two-letter code. */
  code: string;
  name: string;
  /** URL slug under /locations. */
  slug: string;
  region: UsRegion;
  /** Largest metro, for directory context only. */
  largestMetro: string;
  publicationState: PublicationState;
  /** What must be true before this state page may be published. */
  evidenceRequired: string[];
  /** What is true today. Published requires this to cover evidenceRequired. */
  evidenceHave: string[];
  /** Mandatory editorial review gate before any location page may publish. */
  editorialReview: EditorialReviewGate;
};

const LOCAL_SIGNAL =
  "A genuine local signal exists (client in region, or stated service area)";
const UNIQUE_COPY = "Page has unique, substantial copy (not templated boilerplate)";
export const EDITORIAL_REVIEW =
  "Editorial review completed confirming meaningful, locally differentiated content (non-templated)";

/** [code, name, region, largestMetro] — defaults applied by `state()`. */
type Row = [code: string, name: string, region: UsRegion, metro: string];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function state([code, name, region, largestMetro]: Row): UsState {
  return {
    code,
    name,
    slug: slugify(name),
    region,
    largestMetro,
    // Nationwide architecture starts un-published. Earn each page.
    publicationState: "NeedsEvidence",
    evidenceRequired: [LOCAL_SIGNAL, UNIQUE_COPY, EDITORIAL_REVIEW],
    evidenceHave: [],
    editorialReview: { reviewed: false, hasCustomContent: false },
  };
}

const ROWS: Row[] = [
  ["AL", "Alabama", "South", "Birmingham"],
  ["AK", "Alaska", "West", "Anchorage"],
  ["AZ", "Arizona", "West", "Phoenix"],
  ["AR", "Arkansas", "South", "Little Rock"],
  ["CA", "California", "West", "Los Angeles"],
  ["CO", "Colorado", "West", "Denver"],
  ["CT", "Connecticut", "Northeast", "Bridgeport"],
  ["DE", "Delaware", "South", "Wilmington"],
  ["FL", "Florida", "South", "Miami"],
  ["GA", "Georgia", "South", "Atlanta"],
  ["HI", "Hawaii", "West", "Honolulu"],
  ["ID", "Idaho", "West", "Boise"],
  ["IL", "Illinois", "Midwest", "Chicago"],
  ["IN", "Indiana", "Midwest", "Indianapolis"],
  ["IA", "Iowa", "Midwest", "Des Moines"],
  ["KS", "Kansas", "Midwest", "Wichita"],
  ["KY", "Kentucky", "South", "Louisville"],
  ["LA", "Louisiana", "South", "New Orleans"],
  ["ME", "Maine", "Northeast", "Portland"],
  ["MD", "Maryland", "South", "Baltimore"],
  ["MA", "Massachusetts", "Northeast", "Boston"],
  ["MI", "Michigan", "Midwest", "Detroit"],
  ["MN", "Minnesota", "Midwest", "Minneapolis"],
  ["MS", "Mississippi", "South", "Jackson"],
  ["MO", "Missouri", "Midwest", "Kansas City"],
  ["MT", "Montana", "West", "Billings"],
  ["NE", "Nebraska", "Midwest", "Omaha"],
  ["NV", "Nevada", "West", "Las Vegas"],
  ["NH", "New Hampshire", "Northeast", "Manchester"],
  ["NJ", "New Jersey", "Northeast", "Newark"],
  ["NM", "New Mexico", "West", "Albuquerque"],
  ["NY", "New York", "Northeast", "New York City"],
  ["NC", "North Carolina", "South", "Charlotte"],
  ["ND", "North Dakota", "Midwest", "Fargo"],
  ["OH", "Ohio", "Midwest", "Columbus"],
  ["OK", "Oklahoma", "South", "Oklahoma City"],
  ["OR", "Oregon", "West", "Portland"],
  ["PA", "Pennsylvania", "Northeast", "Philadelphia"],
  ["RI", "Rhode Island", "Northeast", "Providence"],
  ["SC", "South Carolina", "South", "Charleston"],
  ["SD", "South Dakota", "Midwest", "Sioux Falls"],
  ["TN", "Tennessee", "South", "Nashville"],
  ["TX", "Texas", "South", "Houston"],
  ["UT", "Utah", "West", "Salt Lake City"],
  ["VT", "Vermont", "Northeast", "Burlington"],
  ["VA", "Virginia", "South", "Virginia Beach"],
  ["WA", "Washington", "West", "Seattle"],
  ["WV", "West Virginia", "South", "Charleston"],
  ["WI", "Wisconsin", "Midwest", "Milwaukee"],
  ["WY", "Wyoming", "West", "Cheyenne"],
  ["DC", "Washington, D.C.", "South", "Washington"],
];

export const US_STATES: UsState[] = ROWS.map(state);

export const getState = (slug: string) => US_STATES.find((s) => s.slug === slug);

export const statesInRegion = (region: UsRegion) =>
  US_STATES.filter((s) => s.region === region);

export const US_REGIONS: UsRegion[] = ["Northeast", "Midwest", "South", "West"];
