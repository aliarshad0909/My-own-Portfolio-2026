/**
 * Resource / guide infrastructure.
 *
 * Every published article is a substantive, original guide with structured
 * blocks (headings, lists, tables, callouts, formulas). `publicationState` here
 * stays aligned with `lib/seo/keyword-registry.ts` (asserted by tests/seo.test.ts).
 */

import { RESOURCES_A } from "@/lib/content/resources-a";
import { RESOURCES_B } from "@/lib/content/resources-b";
import type { DatedResource, Resource, ResourceCategory } from "@/lib/content/resource-types";

export type { ArticleBlock, DatedResource, Resource, ResourceCategory } from "@/lib/content/resource-types";

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "AI & Automation",
  "Web Engineering",
  "Ecommerce & Brand",
  "Creative & Sourcing",
];

/**
 * The current guide set (resources-a.ts, resources-b.ts) was authored on
 * 2026-11-19 and last revised on 2026-11-20. These are the real git authored
 * dates of those files, used as honest publication/update dates. A future
 * article can override by setting its own `publishedAt` / `updatedAt`.
 */
const BATCH_PUBLISHED_AT = "2026-11-19";
const BATCH_UPDATED_AT = "2026-11-20";

export const RESOURCES: DatedResource[] = [...RESOURCES_A, ...RESOURCES_B].map((r) => ({
  publishedAt: BATCH_PUBLISHED_AT,
  updatedAt: BATCH_UPDATED_AT,
  ...r,
}));

export const getResource = (slug: string) => RESOURCES.find((r) => r.slug === slug);
