/**
 * The service-area matrix: 6 core services × 51 jurisdictions = 306 potential
 * service-area pages, defined entirely as structured data.
 *
 * This is deliberately NOT 306 published pages. Every combination has a planned
 * URL, a unique keyword intent and a publication state, but each defaults to
 * `Researched` — planned only, no route rendered anywhere. A combination earns
 * a page the same way everything else does: real, geographically useful content
 * and a genuine local signal, declared as evidence, then flipped to Published.
 *
 * Route shape: `/services/<service>/in/<state>` (and, for selected metros,
 * `/services/<service>/in/<state>/<city>`). The `/in/` segment keeps these
 * distinct from the existing `/services/<hub>/<spoke>` and
 * `/locations/<state>/<city>` routes, so there is no collision.
 *
 * Duplicate-intent detection (see `duplicateIntentConflicts`) guarantees two
 * pages never chase the same (service, place) query: a combination whose intent
 * collides with another matrix entry or with a keyword-registry row is reported
 * and must stay blocked, never published.
 */

import type { PublicationState } from "@/lib/seo/publication";
import { US_STATES, type UsState } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { KEYWORD_REGISTRY } from "@/lib/seo/keyword-registry";

/** The six core, commercially geo-relevant services that form the matrix. */
export type CoreService = {
  /** Matches a hub slug under /services. */
  slug: string;
  /** Normalised concept used for duplicate-intent signatures. */
  concept: string;
  /** Noun phrase for the geo keyword: "<phrase> in <State>". */
  keywordPhrase: string;
  /** Short label for navigation and cards. */
  label: string;
};

export const CORE_SERVICES: CoreService[] = [
  { slug: "web-development", concept: "web-development", keywordPhrase: "web development services", label: "Web development" },
  { slug: "n8n-automation", concept: "automation", keywordPhrase: "n8n automation services", label: "n8n automation" },
  { slug: "ai-agents", concept: "ai-agents", keywordPhrase: "ai agent development", label: "AI agents" },
  { slug: "ecommerce-development", concept: "ecommerce", keywordPhrase: "ecommerce development", label: "Ecommerce development" },
  { slug: "business-dashboards", concept: "dashboards", keywordPhrase: "business dashboard development", label: "Business dashboards" },
  { slug: "global-sourcing", concept: "sourcing", keywordPhrase: "sourcing and supply chain support", label: "Global sourcing" },
];

export const CORE_SERVICE_SLUGS = CORE_SERVICES.map((s) => s.slug);

const LOCAL_SIGNAL = "A genuine local signal exists (client in region, or stated service area)";
const UNIQUE_COPY = "Page has unique, substantial copy (not templated boilerplate)";

export type ServiceArea = {
  serviceSlug: string;
  stateSlug: string;
  /** Planned canonical URL for this combination. */
  url: string;
  /** Unique keyword intent, e.g. "web development services in Texas". */
  keyword: string;
  concept: string;
  /** Normalised intent signature: `${concept}:${stateSlug}`. */
  signature: string;
  publicationState: PublicationState;
  evidenceRequired: string[];
  evidenceHave: string[];
};

/**
 * Overrides for specific combinations: elevate a publication state, or record
 * held evidence. Keyed by `${serviceSlug}:${stateSlug}`. Anything absent stays
 * `Researched` (planned only). Nothing here is `Published` without both a local
 * signal and unique copy — the audit refuses it otherwise.
 */
export const SERVICE_AREA_OVERRIDES: Record<
  string,
  { publicationState: PublicationState; evidenceHave?: string[] }
> = {
  // A small, honest pilot set: drafted scaffolds (preview-only, noindex) for the
  // highest-intent metros' states. None are Published — no local signal yet.
  "web-development:texas": { publicationState: "NeedsEvidence" },
  "web-development:california": { publicationState: "NeedsEvidence" },
  "n8n-automation:new-york": { publicationState: "NeedsEvidence" },
  "ai-agents:california": { publicationState: "NeedsEvidence" },
  "ecommerce-development:florida": { publicationState: "NeedsEvidence" },
  "business-dashboards:illinois": { publicationState: "NeedsEvidence" },
};

function buildArea(service: CoreService, state: UsState): ServiceArea {
  const key = `${service.slug}:${state.slug}`;
  const override = SERVICE_AREA_OVERRIDES[key];
  return {
    serviceSlug: service.slug,
    stateSlug: state.slug,
    url: `/services/${service.slug}/in/${state.slug}`,
    keyword: `${service.keywordPhrase} in ${state.name}`,
    concept: service.concept,
    signature: `${service.concept}:${state.slug}`,
    publicationState: override?.publicationState ?? "Researched",
    evidenceRequired: [LOCAL_SIGNAL, UNIQUE_COPY],
    evidenceHave: override?.evidenceHave ?? [],
  };
}

/** The full 306-entry matrix (6 core services × 51 jurisdictions). */
export function serviceAreaMatrix(): ServiceArea[] {
  const out: ServiceArea[] = [];
  for (const service of CORE_SERVICES) {
    for (const state of US_STATES) out.push(buildArea(service, state));
  }
  return out;
}

export const getServiceArea = (serviceSlug: string, stateSlug: string): ServiceArea | undefined =>
  serviceAreaMatrix().find((a) => a.serviceSlug === serviceSlug && a.stateSlug === stateSlug);

export const serviceAreasForService = (serviceSlug: string) =>
  serviceAreaMatrix().filter((a) => a.serviceSlug === serviceSlug);

export const serviceAreasForState = (stateSlug: string) =>
  serviceAreaMatrix().filter((a) => a.stateSlug === stateSlug);

// ─────────────────── Selected city × service pages ──────────────────────────
// Only a few metros justify a city-level service page. Keyed to pilot cities.

export type CityServiceArea = {
  serviceSlug: string;
  stateSlug: string;
  citySlug: string;
  cityName: string;
  url: string;
  keyword: string;
  concept: string;
  signature: string;
  publicationState: PublicationState;
};

/** Which pilot-city × service combinations exist as planned pages. */
export const CITY_SERVICE_SELECTED: {
  serviceSlug: string;
  citySlug: string;
  publicationState?: PublicationState;
}[] = [
  { serviceSlug: "web-development", citySlug: "austin" },
  { serviceSlug: "ai-agents", citySlug: "san-francisco" },
  { serviceSlug: "ecommerce-development", citySlug: "miami" },
  { serviceSlug: "business-dashboards", citySlug: "chicago" },
  { serviceSlug: "n8n-automation", citySlug: "seattle" },
];

export function cityServiceAreas(): CityServiceArea[] {
  const out: CityServiceArea[] = [];
  for (const sel of CITY_SERVICE_SELECTED) {
    const city = PILOT_CITIES.find((c) => c.slug === sel.citySlug);
    const service = CORE_SERVICES.find((s) => s.slug === sel.serviceSlug);
    if (!city || !service) continue;
    out.push({
      serviceSlug: service.slug,
      stateSlug: city.stateSlug,
      citySlug: city.slug,
      cityName: city.name,
      url: `/services/${service.slug}/in/${city.stateSlug}/${city.slug}`,
      keyword: `${service.keywordPhrase} in ${city.name}`,
      concept: service.concept,
      signature: `${service.concept}:${city.stateSlug}:${city.slug}`,
      publicationState: sel.publicationState ?? "Researched",
    });
  }
  return out;
}

export const getCityServiceArea = (serviceSlug: string, stateSlug: string, citySlug: string) =>
  cityServiceAreas().find(
    (a) => a.serviceSlug === serviceSlug && a.stateSlug === stateSlug && a.citySlug === citySlug,
  );

// ─────────────────── Duplicate-intent detection ─────────────────────────────

/**
 * Normalise a free-text keyword to a coarse intent signature so near-duplicates
 * collide: lowercase, drop punctuation and a small st#opword/synonym set, sort
 * the remaining tokens. Two keywords that mean the same thing map to the same
 * signature even if worded differently ("web developer in texas" vs "texas web
 * development services").
 */
// Only truly generic connectors and interchangeable service-type nouns are
// dropped. Intent-distinguishing words (hire, vs, cost, freelance, …) are kept,
// so "ali arshad" and "hire ali arshad" stay distinct.
const STOP = new Set([
  "in", "the", "a", "for", "and", "services", "service", "development", "dev", "of",
]);
const SYNONYM: Record<string, string> = {
  developer: "web",
  website: "web",
  automation: "automation",
  n8n: "automation",
  workflow: "automation",
  agent: "ai",
  agents: "ai",
  ai: "ai",
  ecommerce: "ecommerce",
  shopify: "ecommerce",
  dashboard: "dashboard",
  dashboards: "dashboard",
  analytics: "dashboard",
  sourcing: "sourcing",
  supply: "sourcing",
  chain: "sourcing",
};

export function intentSignature(keyword: string): string {
  const tokens = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t))
    .map((t) => SYNONYM[t] ?? t);
  return [...new Set(tokens)].sort().join(" ");
}

export type IntentConflict = {
  signature: string;
  owners: { source: string; url: string; keyword: string; publishable: boolean }[];
};

/**
 * Find keywords (across the matrix, the city×service pages and the keyword
 * registry) that share an intent signature but point at different URLs. These
 * are the pages that must NOT both be published — one owns the intent, the
 * others are blocked.
 */
export function duplicateIntentConflicts(): IntentConflict[] {
  const bySig = new Map<string, IntentConflict["owners"]>();
  const add = (source: string, url: string, keyword: string, publishable: boolean) => {
    const sig = intentSignature(keyword);
    if (!bySig.has(sig)) bySig.set(sig, []);
    bySig.get(sig)!.push({ source, url, keyword, publishable });
  };

  for (const a of serviceAreaMatrix()) add("matrix", a.url, a.keyword, a.publicationState === "Published");
  for (const c of cityServiceAreas()) add("city-matrix", c.url, c.keyword, c.publicationState === "Published");
  for (const k of KEYWORD_REGISTRY) add("registry", k.primaryUrl, k.keyword, k.state === "Published");

  const conflicts: IntentConflict[] = [];
  for (const [signature, owners] of bySig) {
    const urls = new Set(owners.map((o) => o.url));
    if (owners.length > 1 && urls.size > 1) conflicts.push({ signature, owners });
  }
  return conflicts;
}

/** Conflicts where more than one owner is actually publishable — a real clash. */
export function blockingIntentConflicts(): IntentConflict[] {
  return duplicateIntentConflicts().filter((c) => c.owners.filter((o) => o.publishable).length > 1);
}
