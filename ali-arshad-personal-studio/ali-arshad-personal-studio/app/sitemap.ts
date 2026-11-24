import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/content/blog";
import { STUDIO_GAMES } from "@/lib/games/catalog";
import { PROJECTS, caseStudies, isIndexable } from "@/lib/projects";
import { CORE_SITEMAP_PAGES, siteBaseUrl } from "@/lib/site";
import { indexableSeoRoutes } from "@/lib/seo/sitemap-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl().origin;
  const now = new Date();
  const abs = (path: string) => `${base}${path === "/" ? "" : path}`;

  const pages = CORE_SITEMAP_PAGES.map((href) => ({ url: abs(href), lastModified: now, priority: href === "/" ? 1 : 0.8 }));
  const games = STUDIO_GAMES.map((g) => ({ url: abs(`/games/${g.slug}`), lastModified: now, priority: 0.5 }));
  const blogPosts = BLOG_POSTS.map((post) => ({
    url: abs(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    priority: 0.7,
  }));
  // Only fully published or verified Demo Ready work is listed; prototypes, concepts, and drafts stay out.
  const projects = PROJECTS.filter(isIndexable).map((p) => ({ url: abs(`/work/${p.slug}`), lastModified: now, priority: 0.6 }));
  const studies = caseStudies().filter(isIndexable).map((p) => ({ url: abs(`/case-studies/${p.slug}`), lastModified: now, priority: 0.6 }));

  // SEO architecture routes: service hubs, published locations and the section
  // index pages. All gated by publication state, so nothing noindex is listed.
  // De-duplicated against the core pages above.
  const coreHrefs = new Set(CORE_SITEMAP_PAGES);
  const seo = indexableSeoRoutes()
    .filter((path) => !coreHrefs.has(path))
    .map((path) => ({ url: abs(path), lastModified: now, priority: 0.7 }));

  return [...pages, ...games, ...blogPosts, ...projects, ...studies, ...seo];
}
