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

import { BLOG_POSTS } from "@/lib/content/blog";
import { FICTIONAL_DEMO_PROFILES } from "@/lib/geo/fictional-profiles";
import { STUDIO_GAMES } from "@/lib/games/catalog";
import { GPU_COMPUTE_PATH, GPU_TOPIC_PAGES } from "@/lib/gpu-compute";
import { PROJECTS, caseStudies } from "@/lib/projects";
import { STUDIO_PRODUCTS } from "@/lib/products/catalog";
import { KEYWORD_REGISTRY } from "@/lib/seo/keyword-registry";
import { SERVICE_HUBS } from "@/lib/seo/service-hubs";
import { cityServiceAreas, serviceAreaMatrix } from "@/lib/seo/service-areas";
import { PRODUCT_SOURCING_PATH, SOURCING_SUBPAGES } from "@/lib/sourcing";
import { ALL_SOURCING_PRODUCTS, SOURCING_CATALOG_PATH } from "@/lib/sourcing-catalog";
import { US_STATES } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";

/** Fixed pages that always exist, independent of any data file. */
export const STATIC_ROUTES = [
  "/",
  "/work",
  "/products",
  "/games",
  "/project-planner",
  "/demo-scenarios",
  "/blog",
  "/blog/rss.xml",
  "/llms.txt",
  "/services",
  "/services/gpu-compute",
  "/services/product-sourcing",
  "/services/social-media-management",
  "/services/linkedin-outreach",
  "/about",
  "/case-studies",
  "/experience",
  "/contact",
  "/privacy",
  "/locations",
  "/resources",
  "/industries",
  "/tools",
  "/tools/moq-quantity-helper",
  "/tools/gpu-quote-estimator",
  "/studio-network",
] as const;

/** Every concrete route the site is prepared to serve or link to. */
export function knownRoutes(): Set<string> {
  const routes = new Set<string>(STATIC_ROUTES);

  for (const t of GPU_TOPIC_PAGES) routes.add(`${GPU_COMPUTE_PATH}/${t.slug}`);
  for (const s of SOURCING_SUBPAGES) routes.add(`${PRODUCT_SOURCING_PATH}/${s.slug}`);
  routes.add(SOURCING_CATALOG_PATH);
  for (const item of ALL_SOURCING_PRODUCTS) routes.add(item.pagePath);

  for (const p of PROJECTS) routes.add(`/work/${p.slug}`);
  for (const p of caseStudies()) routes.add(`/case-studies/${p.slug}`);
  for (const prod of STUDIO_PRODUCTS) routes.add(`/products/${prod.slug}`);
  for (const game of STUDIO_GAMES) routes.add(`/games/${game.slug}`);
  for (const post of BLOG_POSTS) routes.add(`/blog/${post.slug}`);
  for (const scenario of FICTIONAL_DEMO_PROFILES) routes.add(`/demo-scenarios/${scenario.slug}`);

  // Registry primaryUrls define the tool/resource/industry pages and hub spokes.
  for (const k of KEYWORD_REGISTRY) routes.add(k.primaryUrl);

  // Service hubs and their specialism spokes (hub roots are not all registry
  // primaryUrls, so add them from the hub data directly).
  for (const h of SERVICE_HUBS) {
    routes.add(`/services/${h.slug}`);
    for (const s of h.spokes) routes.add(`/services/${h.slug}/${s.slug}`);
  }

  for (const s of US_STATES) routes.add(`/locations/${s.slug}`);
  for (const c of PILOT_CITIES) routes.add(`/locations/${c.stateSlug}/${c.slug}`);
  for (const a of serviceAreaMatrix()) routes.add(a.url);
  for (const ca of cityServiceAreas()) routes.add(ca.url);

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
