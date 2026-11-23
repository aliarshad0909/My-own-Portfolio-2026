/**
 * Preview-only TEST / SAMPLE CONTENT scenarios for location pages.
 *
 * STRICT GOVERNANCE:
 *  - NEVER rendered in production (`isProductionEnv() === true`).
 *  - NEVER mixed into `lib/projects.ts` or presented as real client work.
 *  - Always visibly labeled "TEST / SAMPLE CONTENT — PREVIEW ONLY" in the UI
 *    so reviewers can inspect location-page layout and scenario framing without
 *    ever confusing sample scenarios for factual engagements.
 */

import type { UsState } from "@/lib/geo/states";
import type { PilotCity } from "@/lib/geo/cities";
import type { StateLocalContent } from "@/lib/geo/local-content-types";
import { isProductionEnv } from "@/lib/seo/publication";

export type PreviewSampleScenario = {
  id: string;
  label: "TEST / SAMPLE CONTENT";
  title: string;
  sector: string;
  problem: string;
  proposedApproach: string;
  serviceHref: string;
  serviceLabel: string;
  disclaimer: string;
};

const SAMPLE_DISCLAIMER =
  "TEST / SAMPLE CONTENT — Fictional preview scenario created solely for layout and service-fit review. Not a real client, not a completed engagement, and excluded from production deployments.";

/**
 * True ONLY in non-production environments (local development & Vercel previews).
 * Guarantees zero sample scenarios leak into production HTML or production sitemaps.
 */
export function shouldShowPreviewSamples(): boolean {
  return !isProductionEnv();
}

/** Generate two location-tailored preview-only sample scenarios for a state page. */
export function previewSamplesForState(
  state: UsState,
  local: StateLocalContent | undefined,
): PreviewSampleScenario[] {
  if (!shouldShowPreviewSamples()) return [];

  const primaryFit = local?.serviceFit[0];
  const secondaryFit = local?.serviceFit[1] ?? primaryFit;

  const scenarios: PreviewSampleScenario[] = [
    {
      id: `sample-${state.slug}-primary`,
      label: "TEST / SAMPLE CONTENT",
      title: `Sample ${state.name} ${primaryFit?.service ?? "Web & Software"} workflow scenario`,
      sector: `${state.name} regional operations (${state.largestMetro} & statewide remote)`,
      problem: local
        ? `Illustrative scenario aligned with ${state.name}'s economic context: ${local.angle}`
        : `Illustrative scenario showing how a ${state.name} operator might scope a focused remote studio build.`,
      proposedApproach: primaryFit
        ? `${primaryFit.text} Delivered remotely via written milestones and preview builds.`
        : "Scoped discovery, clean TypeScript implementation, automated verification, and documented hand-off.",
      serviceHref: primaryFit?.href ?? "/services/web-development",
      serviceLabel: primaryFit?.service ?? "Web & software development",
      disclaimer: SAMPLE_DISCLAIMER,
    },
  ];

  if (secondaryFit && secondaryFit.href !== primaryFit?.href) {
    scenarios.push({
      id: `sample-${state.slug}-secondary`,
      label: "TEST / SAMPLE CONTENT",
      title: `Sample ${state.name} ${secondaryFit.service} integration scenario`,
      sector: `${state.region} multi-team remote delivery`,
      problem: `Illustrative scenario for a ${state.name} team pairing ${primaryFit?.service.toLowerCase() ?? "core software"} with ${secondaryFit.service.toLowerCase()} under one accountable studio.`,
      proposedApproach: `${secondaryFit.text} Clear boundaries between deterministic automation, tested software, and human review.`,
      serviceHref: secondaryFit.href,
      serviceLabel: secondaryFit.service,
      disclaimer: SAMPLE_DISCLAIMER,
    });
  }

  return scenarios;
}

/** Generate a preview-only sample scenario tailored to a registered pilot city. */
export function previewSampleForCity(
  city: PilotCity,
  state: UsState,
  angle: string,
  primaryHref: string,
  primaryServiceLabel: string,
): PreviewSampleScenario[] {
  if (!shouldShowPreviewSamples()) return [];

  return [
    {
      id: `sample-city-${state.slug}-${city.slug}`,
      label: "TEST / SAMPLE CONTENT",
      title: `Sample ${city.name}, ${state.code} ${primaryServiceLabel} scoping scenario`,
      sector: `${city.name} metro (fictional preview scenario)`,
      problem: `Illustrative preview brief grounded in ${city.name}'s local context: ${angle}`,
      proposedApproach: `Demonstrates how a ${city.name} team could evaluate remote ${primaryServiceLabel.toLowerCase()} with clear written milestones, reviewable staging URLs, and zero implied local office.`,
      serviceHref: primaryHref,
      serviceLabel: primaryServiceLabel,
      disclaimer: SAMPLE_DISCLAIMER,
    },
  ];
}
