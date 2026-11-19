import type { MetadataRoute } from "next";
import { PROJECTS, caseStudies, isIndexable } from "@/lib/projects";
import { NAV_ITEMS, siteBaseUrl } from "@/lib/site";
import { indexableSeoRoutes } from "@/lib/seo/sitemap-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl().origin;
  const now = new Date();
  const abs = (path: string) => `${base}${path === "/" ? "" : path}`;

  const pages = NAV_ITEMS.map((n) => ({ url: abs(n.href), lastModified: now, priority: n.href === "/" ? 1 : 0.8 }));
  // Only fully published work is listed; demos and drafts stay out.
  const projects = PROJECTS.filter(isIndexable).map((p) => ({ url: abs(`/work/${p.slug}`), lastModified: now, priority: 0.6 }));
  const studies = caseStudies().filter(isIndexable).map((p) => ({ url: abs(`/case-studies/${p.slug}`), lastModified: now, priority: 0.6 }));

  // SEO architecture routes: service hubs, published locations and the section
  // index pages. All gated by publication state, so nothing noindex is listed.
  // De-duplicated against the nav pages above.
  const navHrefs = new Set(NAV_ITEMS.map((n) => n.href));
  const seo = indexableSeoRoutes()
    .filter((path) => !navHrefs.has(path))
    .map((path) => ({ url: abs(path), lastModified: now, priority: 0.7 }));

  return [...pages, ...projects, ...studies, ...seo];
}
