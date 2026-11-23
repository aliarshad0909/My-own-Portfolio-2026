/**
 * Local content for the 8 rendered state × service scaffolds.
 *
 * DATA ONLY: does not change publication state or indexability. Keyed by
 * "<serviceSlug>:<stateSlug>". Real, cited, remote-framed content only.
 */
import type { ServiceAreaLocalContent } from "@/lib/geo/local-content-types";

export const SERVICE_AREA_LOCAL: Record<string, ServiceAreaLocalContent> = {};

export const getServiceAreaLocal = (serviceSlug: string, stateSlug: string): ServiceAreaLocalContent | undefined =>
  SERVICE_AREA_LOCAL[`${serviceSlug}:${stateSlug}`];
