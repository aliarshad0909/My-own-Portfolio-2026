/**
 * Web project cost estimator — pure logic, unit tested.
 *
 * Produces an honest *range*, never a false-precision single number, from a
 * few inputs. The ranges are illustrative planning figures, not a quote; the
 * UI says so and every real project is quoted after a conversation.
 */

export type ProjectType = "marketing-site" | "web-app" | "ecommerce" | "dashboard";
export type DesignLevel = "template" | "custom";
export type Urgency = "standard" | "rush";

export type EstimatorInput = {
  projectType: ProjectType;
  /** Distinct pages or primary screens. */
  pages: number;
  /** Third-party integrations (payments, CRM, auth, APIs…). */
  integrations: number;
  design: DesignLevel;
  urgency: Urgency;
};

export type EstimatorResult = {
  /** Lower and upper cost bound, in USD, rounded to sensible figures. */
  low: number;
  high: number;
  /** Rough delivery window in weeks. */
  weeksLow: number;
  weeksHigh: number;
};

const BASE: Record<ProjectType, number> = {
  "marketing-site": 2500,
  "web-app": 7000,
  ecommerce: 6000,
  dashboard: 5500,
};

const PER_PAGE: Record<ProjectType, number> = {
  "marketing-site": 450,
  "web-app": 900,
  ecommerce: 700,
  dashboard: 800,
};

export const ESTIMATOR_LIMITS = {
  pages: { min: 1, max: 60 },
  integrations: { min: 0, max: 20 },
} as const;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
/** Round to 2 significant-ish figures for a clean range. */
const roundUsd = (n: number) => Math.round(n / 100) * 100;

export function estimate(input: EstimatorInput): EstimatorResult {
  const pages = clamp(Math.floor(input.pages || 0), ESTIMATOR_LIMITS.pages.min, ESTIMATOR_LIMITS.pages.max);
  const integrations = clamp(
    Math.floor(input.integrations || 0),
    ESTIMATOR_LIMITS.integrations.min,
    ESTIMATOR_LIMITS.integrations.max,
  );

  let base = BASE[input.projectType] + pages * PER_PAGE[input.projectType];
  base += integrations * 800;
  if (input.design === "custom") base *= 1.35;
  if (input.urgency === "rush") base *= 1.25;

  // A real quote has spread; express it as a band around the central estimate.
  const low = roundUsd(base * 0.85);
  const high = roundUsd(base * 1.25);

  // Weeks scale with scope but not linearly with cost.
  const scope = pages + integrations * 2;
  const weeksLow = clamp(Math.round(2 + scope * 0.2), 2, 26);
  const weeksHigh = clamp(Math.round(weeksLow * 1.6), weeksLow + 1, 40);

  return { low, high, weeksLow, weeksHigh };
}
