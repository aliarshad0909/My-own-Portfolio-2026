/**
 * MIDWEST state local content. Real, cited, remote-framed. Filled by research.
 * Keys are state slugs (see lib/geo/states.ts). Omit a state until it has a
 * genuine local signal and at least one real source; never fabricate.
 */
import type { StateLocalContent } from "@/lib/geo/local-content-types";

export const MIDWEST_LOCAL: Record<string, StateLocalContent> = {};
