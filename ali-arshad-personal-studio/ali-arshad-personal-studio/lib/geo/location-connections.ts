/**
 * Bidirectional connection helpers across Services ↔ Locations ↔ Projects.
 *
 * Keeps internal linking grounded in real local-content `serviceFit` mappings:
 *  - Avoids orphan pages AND avoids linking every page indiscriminately to all others.
 *  - Respects `shouldRender(publicationState)` so production NEVER emits dead
 *    links to preview-only `NeedsEvidence` city pages.
 */

import { PILOT_CITIES, type PilotCity } from "@/lib/geo/cities";
import { CITY_LOCAL_CONTENT } from "@/lib/geo/city-local-content";
import { STATE_LOCAL_CONTENT } from "@/lib/geo/state-local-content";
import { US_STATES, statesInRegion, type UsState } from "@/lib/geo/states";
import { getProject, type Project } from "@/lib/projects";
import { shouldRender } from "@/lib/seo/publication";
import { GPU_COMPUTE_FIT_STATES, GPU_COMPUTE_PATH } from "@/lib/gpu-compute";

/** Canonical studio demonstrations matched to each service hub href. */
const PROJECTS_BY_SERVICE_HREF: Record<string, string[]> = {
  "/services/web-development": ["pipelineos-crm", "tessera-clayworks-storefront", "stockflow-inventory"],
  "/services/n8n-automation": ["inbound-lead-qualification-workflow", "pipelineos-crm"],
  "/services/ai-agents": ["tideline-support-agent", "kestrel-voice-sales-agent"],
  "/services/ecommerce-development": ["tessera-clayworks-storefront", "stockflow-inventory"],
  "/services/business-dashboards": ["northwind-analytics-dashboard", "meridian-inventory-operations", "stockflow-inventory"],
  "/services/branding": ["halcyon-brand-system"],
  "/services/global-sourcing": ["lantern-sourcing-platform", "meridian-inventory-operations", "stockflow-inventory"],
  "/services/creative-production": ["motion-production-pipeline", "blender-product-visualisation"],
  "/services/gpu-compute": ["blender-product-visualisation", "tideline-support-agent", "motion-production-pipeline"],
};

const GPU_FIT_STATE_SET = new Set<string>(GPU_COMPUTE_FIT_STATES);

/**
 * Does a state's economic profile warrant connecting it to the consultation-led
 * RTX GPU Compute service?
 */
export function stateHasGpuComputeFit(stateSlug: string): boolean {
  return GPU_FIT_STATE_SET.has(stateSlug);
}

/**
 * Relevant studio demonstrations for a state, derived cleanly from the state's
 * local `serviceFit` links (plus GPU compute where applicable). Always capped
 * at 3 distinct projects so state pages stay focused and scannable.
 */
export function projectsForState(stateSlug: string, limit = 3): Project[] {
  const local = STATE_LOCAL_CONTENT[stateSlug];
  const hrefs = (local?.serviceFit ?? []).map((f) => f.href);
  if (stateHasGpuComputeFit(stateSlug)) hrefs.push(GPU_COMPUTE_PATH);
  if (hrefs.length === 0) hrefs.push("/services/web-development", "/services/n8n-automation");

  const seen = new Set<string>();
  const out: Project[] = [];
  for (const href of hrefs) {
    for (const slug of PROJECTS_BY_SERVICE_HREF[href] ?? []) {
      if (seen.has(slug)) continue;
      const p = getProject(slug);
      if (p) {
        seen.add(slug);
        out.push(p);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

/**
 * Curated neighboring / same-region states (3–4 links) so visitors can explore
 * adjacent regional overviews without dumping all 51 links on every page.
 */
export function relatedStatesInRegion(state: UsState, limit = 4): UsState[] {
  const peers = statesInRegion(state.region).filter(
    (s) => s.slug !== state.slug && shouldRender(s.publicationState),
  );
  if (peers.length <= limit) return peers;
  const idx = US_STATES.findIndex((s) => s.slug === state.slug);
  const start = idx >= 0 ? idx % peers.length : 0;
  const picked: UsState[] = [];
  for (let i = 0; i < limit; i++) {
    picked.push(peers[(start + i) % peers.length]);
  }
  return picked;
}

/**
 * Reciprocal location links for a main service hub (`/services/<hub>`).
 * Returns curated states where that service is explicitly listed in
 * `STATE_LOCAL_CONTENT[state].serviceFit` (prioritizing states with the strongest
 * multi-source coverage first), plus matching preview cities when renderable.
 */
export function locationsForServiceHub(
  hubSlug: string,
  stateLimit = 8,
): { states: UsState[]; cities: PilotCity[] } {
  const targetHref = `/services/${hubSlug}`;

  const matchedStates = US_STATES.filter((st) => {
    if (!shouldRender(st.publicationState)) return false;
    const local = STATE_LOCAL_CONTENT[st.slug];
    return Boolean(local?.serviceFit.some((f) => f.href === targetHref));
  }).sort((a, b) => {
    // Prefer states with 2+ verified sources, then alphabetical for deterministic output.
    const aSources = STATE_LOCAL_CONTENT[a.slug]?.sources.length ?? 0;
    const bSources = STATE_LOCAL_CONTENT[b.slug]?.sources.length ?? 0;
    if (bSources !== aSources) return bSources - aSources;
    return a.name.localeCompare(b.name);
  });

  const matchedCities = PILOT_CITIES.filter((c) => {
    if (!shouldRender(c.publicationState)) return false;
    const local = CITY_LOCAL_CONTENT[`${c.stateSlug}/${c.slug}`];
    return Boolean(local?.serviceFit.some((f) => f.href === targetHref));
  });

  return {
    states: matchedStates.slice(0, stateLimit),
    cities: matchedCities,
  };
}
