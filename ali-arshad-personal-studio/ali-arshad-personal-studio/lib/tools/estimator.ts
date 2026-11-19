/**
 * Project Estimation Calculator — pure logic, unit tested.
 *
 * Produces an honest indicative range (never a binding fixed quote) across all
 * studio disciplines, plus a structured scope summary and `/contact` handoff
 * query string so visitors can request a tailored proposal immediately.
 *
 * Keeps the original `estimate()` helper intact for backwards compatibility.
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

  const low = roundUsd(base * 0.85);
  const high = roundUsd(base * 1.25);

  const scope = pages + integrations * 2;
  const weeksLow = clamp(Math.round(2 + scope * 0.2), 2, 26);
  const weeksHigh = clamp(Math.round(weeksLow * 1.6), weeksLow + 1, 40);

  return { low, high, weeksLow, weeksHigh };
}

/* ── Expanded Multi-Discipline Studio Project Estimator ─────────────────── */

export type ProjectCategoryId =
  | "website-development"
  | "ecommerce-development"
  | "web-application"
  | "ai-agent-development"
  | "n8n-workflow-automation"
  | "video-motion-graphics"
  | "branding-creative-production";

export type ScopeTier = "starter" | "growth" | "custom";
export type DesignComplexity = "clean" | "custom" | "bespoke";
export type BackendRequirement = "none" | "standard" | "advanced";
export type TimelinePreference = "flexible" | "standard" | "rush";
export type MaintenancePlan = "none" | "handoff" | "ongoing";

export type ProjectCategoryMeta = {
  id: ProjectCategoryId;
  label: string;
  unitLabel: string;
  defaultUnits: number;
  baseUsd: number;
  perUnitUsd: number;
  /** Exact option in lib/inquiry.ts SERVICE_OPTIONS. */
  contactService: string;
  hasSoftwareOptions: boolean;
};

export const PROJECT_CATEGORIES: ProjectCategoryMeta[] = [
  {
    id: "website-development",
    label: "Website Development",
    unitLabel: "Pages",
    defaultUnits: 6,
    baseUsd: 2200,
    perUnitUsd: 350,
    contactService: "Web & Software Development",
    hasSoftwareOptions: true,
  },
  {
    id: "ecommerce-development",
    label: "Ecommerce Development",
    unitLabel: "Store views / templates",
    defaultUnits: 8,
    baseUsd: 5200,
    perUnitUsd: 550,
    contactService: "Web & Software Development",
    hasSoftwareOptions: true,
  },
  {
    id: "web-application",
    label: "Web Application",
    unitLabel: "Primary screens / workflows",
    defaultUnits: 10,
    baseUsd: 6500,
    perUnitUsd: 700,
    contactService: "Web & Software Development",
    hasSoftwareOptions: true,
  },
  {
    id: "ai-agent-development",
    label: "AI Agent Development",
    unitLabel: "Agent flows / knowledge domains",
    defaultUnits: 4,
    baseUsd: 3200,
    perUnitUsd: 650,
    contactService: "AI Agents & Automation",
    hasSoftwareOptions: true,
  },
  {
    id: "n8n-workflow-automation",
    label: "n8n Workflow Automation",
    unitLabel: "Automated workflows",
    defaultUnits: 5,
    baseUsd: 1600,
    perUnitUsd: 450,
    contactService: "AI Agents & Automation",
    hasSoftwareOptions: true,
  },
  {
    id: "video-motion-graphics",
    label: "Video Editing & Motion Graphics",
    unitLabel: "Deliverables / edits",
    defaultUnits: 6,
    baseUsd: 900,
    perUnitUsd: 260,
    contactService: "Creative Production",
    hasSoftwareOptions: false,
  },
  {
    id: "branding-creative-production",
    label: "Branding & Creative Production",
    unitLabel: "Brand / campaign assets",
    defaultUnits: 8,
    baseUsd: 1800,
    perUnitUsd: 280,
    contactService: "Brand Management & Growth",
    hasSoftwareOptions: false,
  },
];

export type ProjectEstimateInput = {
  category: ProjectCategoryId;
  scopeTier: ScopeTier;
  units: number;
  designComplexity: DesignComplexity;
  backendNeeds: BackendRequirement;
  integrations: number;
  authRequired: boolean;
  automationRequired: boolean;
  timeline: TimelinePreference;
  maintenance: MaintenancePlan;
};

export type ComplexityLevel = "Focused" | "Standard" | "Advanced" | "Multi-System";

export type ProjectEstimateResult = {
  categoryLabel: string;
  complexity: ComplexityLevel;
  low: number;
  high: number;
  weeksLow: number;
  weeksHigh: number;
  scopeSummary: string;
  selectedRequirements: string[];
  contactService: string;
  contactBudget: string;
  contactTimeline: string;
};

const TIER_MULTIPLIER: Record<ScopeTier, number> = {
  starter: 0.85,
  growth: 1.0,
  custom: 1.28,
};

const DESIGN_MULTIPLIER: Record<DesignComplexity, number> = {
  clean: 1.0,
  custom: 1.25,
  bespoke: 1.48,
};

const BACKEND_ADDON: Record<BackendRequirement, number> = {
  none: 0,
  standard: 1400,
  advanced: 3400,
};

const TIMELINE_MULTIPLIER: Record<TimelinePreference, number> = {
  flexible: 0.95,
  standard: 1.0,
  rush: 1.25,
};

const MAINTENANCE_ADDON: Record<MaintenancePlan, number> = {
  none: 0,
  handoff: 400,
  ongoing: 900,
};

export function getProjectCategory(id: ProjectCategoryId): ProjectCategoryMeta {
  return PROJECT_CATEGORIES.find((c) => c.id === id) ?? PROJECT_CATEGORIES[0];
}

function mapBudgetBand(low: number, high: number): string {
  const mid = (low + high) / 2;
  if (mid < 1000) return "Under $1,000";
  if (mid < 5000) return "$1,000 to $5,000";
  if (mid < 15000) return "$5,000 to $15,000";
  return "$15,000+";
}

function mapTimelineOption(timeline: TimelinePreference, weeksHigh: number): string {
  if (timeline === "rush") return "As soon as possible";
  if (timeline === "flexible") return "Flexible";
  if (weeksHigh <= 4) return "Within 1 month";
  if (weeksHigh <= 12) return "1 to 3 months";
  return "3+ months";
}

export function estimateProject(input: ProjectEstimateInput): ProjectEstimateResult {
  const meta = getProjectCategory(input.category);
  const units = clamp(Math.floor(Number.isFinite(input.units) ? input.units : 1), ESTIMATOR_LIMITS.pages.min, ESTIMATOR_LIMITS.pages.max);
  const integrations = clamp(
    Math.floor(Number.isFinite(input.integrations) ? input.integrations : 0),
    ESTIMATOR_LIMITS.integrations.min,
    ESTIMATOR_LIMITS.integrations.max,
  );

  let base = (meta.baseUsd + units * meta.perUnitUsd) * TIER_MULTIPLIER[input.scopeTier];

  if (meta.hasSoftwareOptions) {
    base += BACKEND_ADDON[input.backendNeeds];
    base += integrations * 650;
    if (input.authRequired) base += 900;
    if (input.automationRequired) base += 1200;
  } else {
    base += integrations * 300;
    if (input.automationRequired) base += 700;
  }

  base *= DESIGN_MULTIPLIER[input.designComplexity];
  base += MAINTENANCE_ADDON[input.maintenance];
  base *= TIMELINE_MULTIPLIER[input.timeline];

  const low = Math.max(500, roundUsd(base * 0.85));
  const high = Math.max(low + 300, roundUsd(base * 1.25));

  // Complexity score (0–10+)
  let score = 0;
  if (input.scopeTier === "growth") score += 1;
  if (input.scopeTier === "custom") score += 3;
  if (units >= 8) score += 1;
  if (units >= 18) score += 2;
  if (input.designComplexity === "custom") score += 1;
  if (input.designComplexity === "bespoke") score += 2;
  if (meta.hasSoftwareOptions && input.backendNeeds === "standard") score += 1;
  if (meta.hasSoftwareOptions && input.backendNeeds === "advanced") score += 3;
  if (integrations >= 2) score += 1;
  if (integrations >= 5) score += 2;
  if (meta.hasSoftwareOptions && input.authRequired) score += 1;
  if (input.automationRequired) score += 1;

  const complexity: ComplexityLevel =
    score <= 2 ? "Focused" : score <= 5 ? "Standard" : score <= 8 ? "Advanced" : "Multi-System";

  // Delivery timeframe
  const rawWeeks =
    (meta.hasSoftwareOptions ? 2 : 1) +
    units * (meta.hasSoftwareOptions ? 0.25 : 0.18) +
    integrations * 0.4 +
    (meta.hasSoftwareOptions && input.backendNeeds === "advanced" ? 2.5 : meta.hasSoftwareOptions && input.backendNeeds === "standard" ? 1 : 0) +
    (meta.hasSoftwareOptions && input.authRequired ? 0.8 : 0) +
    (input.automationRequired ? 1 : 0);

  const speedFactor = input.timeline === "rush" ? 0.78 : input.timeline === "flexible" ? 1.15 : 1;
  const weeksLow = clamp(Math.round(rawWeeks * speedFactor), 1, 24);
  const weeksHigh = clamp(Math.round(weeksLow * 1.55), weeksLow + 1, 36);

  const tierLabels: Record<ScopeTier, string> = {
    starter: "Focused launch / MVP",
    growth: "Production business build",
    custom: "Full custom / multi-workflow system",
  };
  const designLabels: Record<DesignComplexity, string> = {
    clean: "Clean structured layout",
    custom: "Custom brand-aligned design",
    bespoke: "Bespoke art direction & motion",
  };
  const backendLabels: Record<BackendRequirement, string> = {
    none: "Static / frontend-only",
    standard: "Standard API, database & CMS",
    advanced: "Custom business logic, roles & webhooks",
  };
  const timelineLabels: Record<TimelinePreference, string> = {
    flexible: "Flexible pace",
    standard: "Standard delivery",
    rush: "Priority / compressed timeline",
  };
  const maintenanceLabels: Record<MaintenancePlan, string> = {
    none: "One-off delivery",
    handoff: "Documentation & team hand-off",
    ongoing: "Post-launch support & iteration",
  };

  const selectedRequirements: string[] = [
    `Category: ${meta.label}`,
    `Scope tier: ${tierLabels[input.scopeTier]}`,
    `${meta.unitLabel}: ${units}`,
    `Design depth: ${designLabels[input.designComplexity]}`,
    ...(meta.hasSoftwareOptions ? [`Backend: ${backendLabels[input.backendNeeds]}`] : []),
    `Integrations / external tools: ${integrations}`,
    ...(meta.hasSoftwareOptions && input.authRequired ? ["User accounts & authentication"] : []),
    ...(input.automationRequired ? ["Workflow / AI automation included"] : []),
    `Timeline: ${timelineLabels[input.timeline]}`,
    `After launch: ${maintenanceLabels[input.maintenance]}`,
  ];

  const scopeSummary = `${complexity} ${meta.label.toLowerCase()} engagement covering ${units} ${meta.unitLabel.toLowerCase()}, ${designLabels[input.designComplexity].toLowerCase()}${integrations > 0 ? `, and ${integrations} integration${integrations === 1 ? "" : "s"}` : ""}. Estimated delivery: ${weeksLow}–${weeksHigh} weeks.`;

  return {
    categoryLabel: meta.label,
    complexity,
    low,
    high,
    weeksLow,
    weeksHigh,
    scopeSummary,
    selectedRequirements,
    contactService: meta.contactService,
    contactBudget: mapBudgetBand(low, high),
    contactTimeline: mapTimelineOption(input.timeline, weeksHigh),
  };
}

/** Build a `/contact` URL that pre-fills service, budget, timeline and project description. */
export function buildProposalHref(result: ProjectEstimateResult): string {
  const params = new URLSearchParams();
  params.set("service", result.contactService);
  params.set("budget", result.contactBudget);
  params.set("timeline", result.contactTimeline);

  const brief = [
    `Project Estimator Summary (${result.complexity} scope):`,
    result.scopeSummary,
    `Indicative range: $${result.low.toLocaleString("en-US")} – $${result.high.toLocaleString("en-US")} (${result.weeksLow}–${result.weeksHigh} weeks)`,
    "",
    "Selected requirements:",
    ...result.selectedRequirements.map((item) => `- ${item}`),
  ].join("\n");

  params.set("summary", brief);
  return `/contact?${params.toString()}`;
}
