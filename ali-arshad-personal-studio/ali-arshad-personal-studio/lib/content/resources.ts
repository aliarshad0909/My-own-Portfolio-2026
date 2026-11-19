/**
 * Resource / guide infrastructure.
 *
 * Every published article is a substantive, original guide with structured
 * blocks (headings, lists, tables, callouts, formulas). `publicationState` here
 * stays aligned with `lib/seo/keyword-registry.ts` (asserted by tests/seo.test.ts).
 */

import { RESOURCES_A } from "@/lib/content/resources-a";
import { RESOURCES_B } from "@/lib/content/resources-b";
import type { Resource, ResourceCategory } from "@/lib/content/resource-types";

export type { ArticleBlock, Resource, ResourceCategory } from "@/lib/content/resource-types";

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "AI & Automation",
  "Web Engineering",
  "Ecommerce & Brand",
  "Creative & Sourcing",
];

export const RESOURCES: Resource[] = [...RESOURCES_A, ...RESOURCES_B];

export const getResource = (slug: string) => RESOURCES.find((r) => r.slug === slug);
