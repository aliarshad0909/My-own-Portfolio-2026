import type { MetadataRoute } from "next";
import { PROJECTS, caseStudies, isIndexable } from "@/lib/projects";
import { NAV_ITEMS, siteBaseUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl().origin;
  const now = new Date();
  const pages = NAV_ITEMS.map((n) => ({ url: `${base}${n.href === "/" ? "" : n.href}`, lastModified: now, priority: n.href === "/" ? 1 : 0.8 }));
  // Drafts and placeholders are left out until they are published.
  const projects = PROJECTS.filter(isIndexable).map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: now, priority: 0.6 }));
  const studies = caseStudies().filter(isIndexable).map((p) => ({ url: `${base}/case-studies/${p.slug}`, lastModified: now, priority: 0.6 }));
  return [...pages, ...projects, ...studies];
}
