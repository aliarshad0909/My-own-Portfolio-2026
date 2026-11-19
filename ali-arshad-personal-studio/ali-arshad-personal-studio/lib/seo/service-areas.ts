/**
 * Nationwide service-area matrix & business-pillar reconciliation.
 *
 * Clearly distinguishes two layers that must never be conflated:
 *   1. The 6 original studio business pillars (`BUSINESS_PILLARS`, matching
 *      `lib/services.ts` 1-to-1):
 *        - Creative Production
 *        - Web & Software Development
 *        - AI Agents & Automation
 *        - Brand Management & Growth
 *        - Global Sourcing & Supply Chain
 *        - Specialist Technical Collaboration (partner-delivered via /studio-network;
 *          deliberately excluded from local geo pages)
 *   2. The 8 commercial nationwide service-hub tracks (`NATIONWIDE_SERVICES`)
 *      covering ALL 5 direct business pillars (including Creative Production and
 *      Brand & Growth) plus high-intent SEO specializations:
 *        - Pillar hubs (`tier: "pillar"`): web-development, creative-production,
 *          branding, global-sourcing
 *        - SEO specialization hubs (`tier: "seo-specialization"`): n8n-automation,
 *          ai-agents, ecommerce-development, business-dashboards
 *
 * That produces 8 × 51 = 408 planned state × service combinations (preserving
 * the original 6 × 51 = 306 commercial SEO subset in `CORE_SERVICES` while
 * ensuring Creative Production and Brand & Growth are full citizens of the
 * long-term nationwide architecture).
 *
 * ANTI-DOORWAY & EDITORIAL REVIEW GATE:
 * ZERO service-area pages are published today. Every entry defaults to
 * `Researched` (or preview-only `NeedsEvidence` for the pilot scaffolds). A
 * page may flip to `Published` ONLY when all three hold:
 *   1. A genuine local signal exists
 *   2. Template scaffold copy has been replaced with unique, substantial copy
 *   3. `editorialReview` confirms reviewed, locally differentiated content
 */

import type { PublicationState } from "@/lib/seo/publication";
import { EDITORIAL_REVIEW, US_STATES, type EditorialReviewGate, type UsState } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { KEYWORD_REGISTRY } from "@/lib/seo/keyword-registry";

export type ServiceTier = "pillar" | "seo-specialization";

/** Explicit 1-to-1 reconciliation with the 6 business pillars in lib/services.ts. */
export type BusinessPillarMapping = {
  /** Matches `Service.id` in lib/services.ts. */
  pillarId: string;
  label: string;
  /** Published `/services/<slug>` hubs belonging to this business pillar. */
  hubSlugs: string[];
  /** Whether this pillar participates in the nationwide geo matrix. */
  inNationwideMatrix: boolean;
  note?: string;
};

export const BUSINESS_PILLARS: BusinessPillarMapping[] = [
  {
    pillarId: "creative-production",
    label: "Creative Production",
    hubSlugs: ["creative-production"],
    inNationwideMatrix: true,
  },
  {
    pillarId: "web-development",
    label: "Web & Software Development",
    hubSlugs: ["web-development", "ecommerce-development", "business-dashboards"],
    inNationwideMatrix: true,
  },
  {
    pillarId: "ai-automation",
    label: "AI Agents & Automation",
    hubSlugs: ["n8n-automation", "ai-agents"],
    inNationwideMatrix: true,
  },
  {
    pillarId: "brand-growth",
    label: "Brand Management & Growth",
    hubSlugs: ["branding"],
    inNationwideMatrix: true,
  },
  {
    pillarId: "global-sourcing",
    label: "Global Sourcing & Supply Chain",
    hubSlugs: ["global-sourcing"],
    inNationwideMatrix: true,
  },
  {
    pillarId: "specialist-collaboration",
    label: "Specialist Technical Collaboration",
    hubSlugs: [],
    inNationwideMatrix: false,
    note: "Partner-delivered work coordinated via /studio-network; deliberately excluded from local geo pages.",
  },
];

export type NationwideService = {
  /** Matches a hub slug under /services. */
  slug: string;
  /** Parent business pillar id in lib/services.ts. */
  pillarId: string;
  /** Distinguishes primary business-pillar hubs from SEO specialization hubs. */
  tier: ServiceTier;
  /** Normalised concept used for duplicate-intent signatures. */
  concept: string;
  /** Noun phrase for the geo keyword: "<phrase> in <State>". */
  keywordPhrase: string;
  /** Short label for navigation and cards. */
  label: string;
};

/** Backwards-compatible alias for NationwideService. */
export type CoreService = NationwideService;

/**
 * All 8 commercial service tracks in the long-term nationwide architecture:
 * all 5 direct business pillars (including Creative Production and Brand & Growth)
 * plus focused SEO specializations.
 */
export const NATIONWIDE_SERVICES: NationwideService[] = [
  { slug: "web-development", pillarId: "web-development", tier: "pillar", concept: "web-development", keywordPhrase: "web development services", label: "Web & application development" },
  { slug: "creative-production", pillarId: "creative-production", tier: "pillar", concept: "creative-production", keywordPhrase: "creative production and video editing", label: "Creative production" },
  { slug: "branding", pillarId: "brand-growth", tier: "pillar", concept: "brand-growth", keywordPhrase: "brand identity and growth services", label: "Brand & growth" },
  { slug: "global-sourcing", pillarId: "global-sourcing", tier: "pillar", concept: "sourcing", keywordPhrase: "sourcing and supply chain support", label: "Global sourcing" },
  { slug: "n8n-automation", pillarId: "ai-automation", tier: "seo-specialization", concept: "automation", keywordPhrase: "n8n automation services", label: "n8n automation" },
  { slug: "ai-agents", pillarId: "ai-automation", tier: "seo-specialization", concept: "ai-agents", keywordPhrase: "ai agent development", label: "AI agents" },
  { slug: "ecommerce-development", pillarId: "web-development", tier: "seo-specialization", concept: "ecommerce", keywordPhrase: "ecommerce development", label: "Ecommerce development" },
  { slug: "business-dashboards", pillarId: "web-development", tier: "seo-specialization", concept: "dashboards", keywordPhrase: "business dashboard development", label: "Business dashboards" },
];

/** The original 6-entry commercial engineering & sourcing subset (306 combinations). */
export const CORE_SERVICES: NationwideService[] = NATIONWIDE_SERVICES.filter((s) =>
  ["web-development", "n8n-automation", "ai-agents", "ecommerce-development", "business-dashboards", "global-sourcing"].includes(s.slug),
);

export const CORE_SERVICE_SLUGS = CORE_SERVICES.map((s) => s.slug);
export const NATIONWIDE_SERVICE_SLUGS = NATIONWIDE_SERVICES.map((s) => s.slug);

const LOCAL_SIGNAL = "A genuine local signal exists (client in region, or stated service area)";
const UNIQUE_COPY = "Page has unique, substantial copy (not templated boilerplate)";

export type ServiceArea = {
  serviceSlug: string;
  pillarId: string;
  tier: ServiceTier;
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
  /** Mandatory editorial review gate confirming meaningful, locally differentiated content. */
  editorialReview: EditorialReviewGate;
};

/**
 * Overrides for specific combinations: elevate a preview scaffold state, or
 * record held evidence and completed editorial review. Keyed by
 * `${serviceSlug}:${stateSlug}`. Anything absent stays `Researched`.
 * ZERO entries are Published without local signal, unique copy AND editorial review.
 */
export const SERVICE_AREA_OVERRIDES: Record<
  string,
  {
    publicationState: PublicationState;
    evidenceHave?: string[];
    editorialReview?: EditorialReviewGate;
  }
> = {
  // Pilot scaffolds (preview-only, noindex; NEVER rendered in production).
  "web-development:texas": { publicationState: "NeedsEvidence" },
  "web-development:california": { publicationState: "NeedsEvidence" },
  "n8n-automation:new-york": { publicationState: "NeedsEvidence" },
  "ai-agents:california": { publicationState: "NeedsEvidence" },
  "ecommerce-development:florida": { publicationState: "NeedsEvidence" },
  "business-dashboards:illinois": { publicationState: "NeedsEvidence" },
  "branding:new-york": { publicationState: "NeedsEvidence" },
  "creative-production:california": { publicationState: "NeedsEvidence" },
};

function buildArea(service: NationwideService, state: UsState): ServiceArea {
  const key = `${service.slug}:${state.slug}`;
  const override = SERVICE_AREA_OVERRIDES[key];
  return {
    serviceSlug: service.slug,
    pillarId: service.pillarId,
    tier: service.tier,
    stateSlug: state.slug,
    url: `/services/${service.slug}/in/${state.slug}`,
    keyword: `${service.keywordPhrase} in ${state.name}`,
    concept: service.concept,
    signature: `${service.concept}:${state.slug}`,
    publicationState: override?.publicationState ?? "Researched",
    evidenceRequired: [LOCAL_SIGNAL, UNIQUE_COPY, EDITORIAL_REVIEW],
    evidenceHave: override?.evidenceHave ?? [],
    editorialReview: override?.editorialReview ?? { reviewed: false, hasCustomContent: false },
  };
}

/** The full 408-entry nationwide matrix (8 commercial tracks × 51 jurisdictions, all gated). */
export function serviceAreaMatrix(): ServiceArea[] {
  const out: ServiceArea[] = [];
  for (const service of NATIONWIDE_SERVICES) {
    for (const state of US_STATES) out.push(buildArea(service, state));
  }
  return out;
}

/** The original 306-entry subset (6 engineering/sourcing tracks × 51 jurisdictions). */
export function coreServiceAreaMatrix(): ServiceArea[] {
  const coreSet = new Set(CORE_SERVICE_SLUGS);
  return serviceAreaMatrix().filter((a) => coreSet.has(a.serviceSlug));
}

export const getServiceArea = (serviceSlug: string, stateSlug: string): ServiceArea | undefined =>
  serviceAreaMatrix().find((a) => a.serviceSlug === serviceSlug && a.stateSlug === stateSlug);

export const serviceAreasForService = (serviceSlug: string) =>
  serviceAreaMatrix().filter((a) => a.serviceSlug === serviceSlug);

export const serviceAreasForState = (stateSlug: string) =>
  serviceAreaMatrix().filter((a) => a.stateSlug === stateSlug);

// ─────────────────── Selected city × service pages ──────────────────────────

export type CityServiceArea = {
  serviceSlug: string;
  pillarId: string;
  tier: ServiceTier;
  stateSlug: string;
  citySlug: string;
  cityName: string;
  url: string;
  keyword: string;
  concept: string;
  signature: string;
  publicationState: PublicationState;
  editorialReview: EditorialReviewGate;
};

export const CITY_SERVICE_SELECTED: {
  serviceSlug: string;
  citySlug: string;
  publicationState?: PublicationState;
  editorialReview?: EditorialReviewGate;
}[] = [
  { serviceSlug: "web-development", citySlug: "austin" },
  { serviceSlug: "ai-agents", citySlug: "san-francisco" },
  { serviceSlug: "ecommerce-development", citySlug: "miami" },
  { serviceSlug: "business-dashboards", citySlug: "chicago" },
  { serviceSlug: "n8n-automation", citySlug: "seattle" },
  { serviceSlug: "branding", citySlug: "new-york-city" },
  { serviceSlug: "creative-production", citySlug: "los-angeles" },
];

export function cityServiceAreas(): CityServiceArea[] {
  const out: CityServiceArea[] = [];
  for (const sel of CITY_SERVICE_SELECTED) {
    const city = PILOT_CITIES.find((c) => c.slug === sel.citySlug);
    const service = NATIONWIDE_SERVICES.find((s) => s.slug === sel.serviceSlug);
    if (!city || !service) continue;
    out.push({
      serviceSlug: service.slug,
      pillarId: service.pillarId,
      tier: service.tier,
      stateSlug: city.stateSlug,
      citySlug: city.slug,
      cityName: city.name,
      url: `/services/${service.slug}/in/${city.stateSlug}/${city.slug}`,
      keyword: `${service.keywordPhrase} in ${city.name}`,
      concept: service.concept,
      signature: `${service.concept}:${city.stateSlug}:${city.slug}`,
      publicationState: sel.publicationState ?? "Researched",
      editorialReview: sel.editorialReview ?? { reviewed: false, hasCustomContent: false },
    });
  }
  return out;
}

export const getCityServiceArea = (serviceSlug: string, stateSlug: string, citySlug: string) =>
  cityServiceAreas().find(
    (a) => a.serviceSlug === serviceSlug && a.stateSlug === stateSlug && a.citySlug === citySlug,
  );

// ─────────────────── Duplicate-intent detection ─────────────────────────────

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
  branding: "brand",
  brand: "brand",
  video: "creative",
  creative: "creative",
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
