import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/content/blog";
import { STUDIO_GAMES } from "@/lib/games/catalog";
import { PROJECTS, caseStudies, hasDedicatedCaseStudy, isIndexable } from "@/lib/projects";
import { CORE_SITEMAP_PAGES, siteBaseUrl } from "@/lib/site";
import { indexableSeoRoutes } from "@/lib/seo/sitemap-routes";

/** Stable release timestamps so sitemap lastmod reflects real content revisions rather than build-time clock drift. */
const LASTMOD = {
  core: new Date("2026-11-27T00:00:00.000Z"),
  services: new Date("2026-11-27T00:00:00.000Z"),
  studies: new Date("2026-11-20T00:00:00.000Z"),
  games: new Date("2026-11-18T00:00:00.000Z"),
} as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl().origin;
  const abs = (path: string) => `${base}${path === "/" ? "" : path}`;

  const pages = CORE_SITEMAP_PAGES.map((href) => ({
    url: abs(href),
    lastModified: LASTMOD.core,
    priority: href === "/" ? 1 : 0.8,
  }));
  const games = STUDIO_GAMES.map((g) => ({
    url: abs(`/games/${g.slug}`),
    lastModified: LASTMOD.games,
    priority: 0.5,
  }));
  const blogPosts = BLOG_POSTS.map((post) => ({
    url: abs(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    priority: 0.7,
  }));

  // Single canonical URL per indexable project:
  // Flagship case studies live canonically under /case-studies/[slug] (with 308 redirect from /work/[slug]).
  // Any non-case-study indexable build lives under /work/[slug]. Zero duplicate slugs in sitemap.xml.
  const studies = caseStudies()
    .filter(isIndexable)
    .map((p) => ({ url: abs(`/case-studies/${p.slug}`), lastModified: LASTMOD.studies, priority: 0.7 }));

  const projects = PROJECTS.filter((p) => isIndexable(p) && !hasDedicatedCaseStudy(p)).map((p) => ({
    url: abs(`/work/${p.slug}`),
    lastModified: LASTMOD.studies,
    priority: 0.6,
  }));

  // SEO architecture routes: service hubs, subpages, calculators, resources, industries.
  const coreHrefs = new Set(CORE_SITEMAP_PAGES);
  const seo = indexableSeoRoutes()
    .filter((path) => !coreHrefs.has(path))
    .map((path) => ({ url: abs(path), lastModified: LASTMOD.services, priority: 0.7 }));

  return [...pages, ...games, ...blogPosts, ...studies, ...projects, ...seo];
}
