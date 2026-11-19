/**
 * The set of routes the site knows about.
 *
 * Used by the SEO audit and tests to prove that every internal link in the
 * keyword registry (and elsewhere) points at a real destination — no broken
 * internal links, no links to pages that were renamed or never built.
 *
 * A route is "known" if it is one of:
 *   - a fixed top-level page (/, /work, /services, …),
 *   - a project or case-study detail route (from lib/projects),
 *   - a page named as a `primaryUrl` in the keyword registry (service hubs and
 *     spokes, tools, resources, industries, studio network, locations),
 *   - a state or pilot-city location route (from lib/geo).
 *
 * Keeping this derived from data means the link checks stay honest as pages
 * are added or removed, without a hand-maintained list drifting out of sync.
 */

import { PROJECTS, caseStudies } from "@/lib/projects";
import { KEYWORD_REGISTRY } from "@/lib/seo/keyword-registry";
import { US_STATES } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";

/** Fixed pages that always exist, independent of any data file. */
export const STATIC_ROUTES = [
  "/",
  "/work",
  "/services",
  "/about",
  "/case-studies",
  "/experience",
  "/contact",
  "/locations",
  "/resources",
  "/industries",
  "/tools",
  "/studio-network",
] as const;

/** Every concrete route the site is prepared to serve or link to. */
export function knownRoutes(): Set<string> {
  const routes = new Set<string>(STATIC_ROUTES);

  for (const p of PROJECTS) routes.add(`/work/${p.slug}`);
  for (const p of caseStudies()) routes.add(`/case-studies/${p.slug}`);

  // Registry primaryUrls define the hub/spoke/tool/resource/industry pages.
  for (const k of KEYWORD_REGISTRY) routes.add(k.primaryUrl);

  for (const s of US_STATES) routes.add(`/locations/${s.slug}`);
  for (const c of PILOT_CITIES) routes.add(`/locations/${c.stateSlug}/${c.slug}`);

  return routes;
}

/** Does this site-absolute path correspond to a known route? */
export function isKnownRoute(path: string): boolean {
  // Ignore query/hash when matching; anchors link within a known page.
  const clean = path.split(/[?#]/)[0];
  return knownRoutes().has(clean);
}

/** Internal links referenced anywhere that do not resolve to a known route. */
export function brokenLinks(links: string[]): string[] {
  return links.filter((l) => l.startsWith("/") && !isKnownRoute(l));
}
