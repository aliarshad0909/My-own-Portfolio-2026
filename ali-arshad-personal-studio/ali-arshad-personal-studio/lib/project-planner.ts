/**
 * Visual Project Planner — shared schema, visual presets, matching engine,
 * open-question generator, brief formatter, and privacy-safe share URL codec.
 *
 * PRIVACY GUARANTEE:
 * - Free-text fields (projectLabel, problemNote) are NEVER written into URL query strings.
 * - Shareable links encode ONLY non-personal structured option IDs.
 * - All edits stay in local browser state (no hidden server tracking or telemetry storage).
 */

import { PROJECTS, type Project } from "@/lib/projects";

export type PlannerProjectType =
  | "marketing-site"
  | "saas-web-app"
  | "ecommerce-storefront"
  | "ai-agent-automation"
  | "internal-dashboard"
  | "creative-brand-launch";

export type PlannerAudience =
  | "b2b-buyers"
  | "consumers-d2c"
  | "internal-ops"
  | "founders-investors"
  | "multi-segment";

export type PlannerPlatform =
  | "nextjs-web"
  | "shopify-or-headless"
  | "web-plus-mobile"
  | "n8n-ai-backend"
  | "not-sure";

export type PlannerBrandMood =
  | "editorial-dark"
  | "crisp-light"
  | "warm-craft"
  | "technical-grid"
  | "bold-studio";

export type PlannerPaletteId =
  | "obsidian-coral"
  | "slate-cyan"
  | "ivory-terracotta"
  | "forest-sand"
  | "midnight-amber"
  | "monochrome-ink";

export type PlannerTypographyId =
  | "grotesk-clean"
  | "editorial-serif"
  | "technical-mono"
  | "humanist-friendly";

export type PlannerTypeScale = "compact" | "balanced" | "expressive";
export type PlannerButtonStyle = "pill" | "soft-radius" | "sharp";
export type PlannerCardStyle = "bordered" | "elevated" | "flat-minimal";
export type PlannerNavLayout = "top-bar" | "centered-brand" | "sidebar-app";
export type PlannerHeroStyle = "split-visual" | "centered-editorial" | "product-frame" | "metrics-strip";

export type PlannerContentReadiness = "ready" | "partial-drafts" | "need-help";
export type PlannerImageryStyle = "product-ui" | "editorial-photo" | "3d-motion" | "clean-diagrams";
export type PlannerMotionLevel = "minimal-static" | "subtle-polish" | "expressive-guided";
export type PlannerA11yTarget = "wcag-aa" | "wcag-aaa-strict";
export type PlannerMobilePriority = "mobile-first" | "balanced-responsive" | "desktop-heavy-app";

export type PlannerState = {
  // Step 1: Project Scope & Context
  projectType: PlannerProjectType;
  audience: PlannerAudience;
  goals: string[];
  /** Local-only optional notes — STRICTLY omitted from shareable URLs. */
  projectLabel: string;
  /** Local-only optional notes — STRICTLY omitted from shareable URLs. */
  problemNote: string;

  // Step 2: Pages, Features & Platform
  pages: string[];
  features: string[];
  integrations: string[];
  platform: PlannerPlatform;

  // Step 3: Brand Mood & Palette
  brandMood: PlannerBrandMood;
  paletteId: PlannerPaletteId;

  // Step 4: Typography & UI Structure
  typographyId: PlannerTypographyId;
  typeScale: PlannerTypeScale;
  buttonStyle: PlannerButtonStyle;
  cardStyle: PlannerCardStyle;
  navLayout: PlannerNavLayout;
  heroStyle: PlannerHeroStyle;

  // Step 5: Content, Motion, Accessibility & Timing
  contentReadiness: PlannerContentReadiness;
  imageryStyle: PlannerImageryStyle;
  motionLevel: PlannerMotionLevel;
  accessibilityTarget: PlannerA11yTarget;
  mobilePriority: PlannerMobilePriority;
  timeline: string;
  budget: string;
};

export type PaletteSpec = {
  id: PlannerPaletteId;
  name: string;
  note: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentInk: string;
  border: string;
  isLight: boolean;
};

export const PLANNER_PALETTES: readonly PaletteSpec[] = [
  {
    id: "obsidian-coral",
    name: "Obsidian & Coral",
    note: "High-contrast dark studio palette with warm coral focal energy",
    bg: "#0b0d10",
    surface: "#151a22",
    text: "#f8f5ef",
    muted: "#9ca7b8",
    accent: "#ff7a5c",
    accentInk: "#160805",
    border: "rgba(255,255,255,0.12)",
    isLight: false,
  },
  {
    id: "slate-cyan",
    name: "Deep Slate & Signal Cyan",
    note: "Crisp engineering & SaaS palette built for telemetry and dense UI",
    bg: "#0c121e",
    surface: "#141f30",
    text: "#f1f5f9",
    muted: "#94a3b8",
    accent: "#38bdf8",
    accentInk: "#051923",
    border: "rgba(148,163,184,0.2)",
    isLight: false,
  },
  {
    id: "ivory-terracotta",
    name: "Warm Ivory & Terracotta",
    note: "Editorial daylight canvas with tactile craft warmth",
    bg: "#faf7f2",
    surface: "#ffffff",
    text: "#181512",
    muted: "#5f5850",
    accent: "#c95638",
    accentInk: "#ffffff",
    border: "rgba(24,21,18,0.12)",
    isLight: true,
  },
  {
    id: "forest-sand",
    name: "Pine Forest & Warm Sand",
    note: "Grounded natural contrast suited to commerce, logistics, and heritage brands",
    bg: "#0f1915",
    surface: "#172620",
    text: "#f4f1ea",
    muted: "#a5b5ac",
    accent: "#34d399",
    accentInk: "#042318",
    border: "rgba(244,241,234,0.14)",
    isLight: false,
  },
  {
    id: "midnight-amber",
    name: "Midnight Ink & Amber",
    note: "Executive dark theme with refined warm gold highlights",
    bg: "#101015",
    surface: "#1a1a22",
    text: "#f7f5f0",
    muted: "#a6a4b0",
    accent: "#f5c451",
    accentInk: "#1d1503",
    border: "rgba(245,196,81,0.22)",
    isLight: false,
  },
  {
    id: "monochrome-ink",
    name: "Gallery White & Carbon",
    note: "Minimal typographic restraint where product photography takes focus",
    bg: "#f6f7f9",
    surface: "#ffffff",
    text: "#111317",
    muted: "#58606d",
    accent: "#111317",
    accentInk: "#ffffff",
    border: "rgba(17,19,23,0.14)",
    isLight: true,
  },
] as const;

export const PLANNER_PROJECT_TYPES: readonly {
  id: PlannerProjectType;
  label: string;
  short: string;
  contactService: string;
  servicePath: string;
  serviceName: string;
}[] = [
  {
    id: "marketing-site",
    label: "Company Website / Lead-Gen Site",
    short: "Fast Next.js positioning site, service hubs, SEO/AEO structure & lead capture",
    contactService: "Web & Software Development",
    servicePath: "/services/web-development",
    serviceName: "Web & Application Development",
  },
  {
    id: "saas-web-app",
    label: "SaaS Product / Web App MVP",
    short: "Authenticated app, PostgreSQL workflows, role-based portals & billing-ready architecture",
    contactService: "Web & Software Development",
    servicePath: "/services/web-development/mvp",
    serviceName: "MVP Development for Startups",
  },
  {
    id: "ecommerce-storefront",
    label: "E-Commerce Storefront",
    short: "Custom Next.js storefront or Shopify advisory with catalog, cart & inventory sync",
    contactService: "Web & Software Development",
    servicePath: "/services/ecommerce-development",
    serviceName: "E-Commerce Development",
  },
  {
    id: "ai-agent-automation",
    label: "AI Agent & n8n Automation",
    short: "Grounded support/sales assistant, CRM lead qualification & self-hostable n8n workflows",
    contactService: "AI Agents & Workflow Automation",
    servicePath: "/services/n8n-automation",
    serviceName: "AI Agents & n8n Automation",
  },
  {
    id: "internal-dashboard",
    label: "Internal Ops Dashboard / Tool",
    short: "KPI analytics, inventory ledgers, approval queues & custom CRM views",
    contactService: "Web & Software Development",
    servicePath: "/services/business-dashboards",
    serviceName: "Business Dashboards & Data Visualization",
  },
  {
    id: "creative-brand-launch",
    label: "Brand System & Launch Visuals",
    short: "WCAG brand identity system, launch site, video cuts & motion graphics",
    contactService: "Brand Management & Growth",
    servicePath: "/services/branding",
    serviceName: "Brand Identity & Growth",
  },
] as const;

export const PLANNER_AUDIENCES: readonly { id: PlannerAudience; label: string }[] = [
  { id: "b2b-buyers", label: "B2B Buyers & Operations Teams" },
  { id: "consumers-d2c", label: "Direct-to-Consumer Shoppers" },
  { id: "internal-ops", label: "Internal Staff / Field Operators" },
  { id: "founders-investors", label: "Founders, Technical Leads & Partners" },
  { id: "multi-segment", label: "Multiple Audiences / Mixed Funnel" },
] as const;

export const PLANNER_GOALS: readonly { id: string; label: string }[] = [
  { id: "qualified-leads", label: "Capture better-qualified inquiries" },
  { id: "launch-mvp", label: "Ship a testable v1 / MVP quickly" },
  { id: "automate-ops", label: "Cut manual spreadsheet & copy-paste work" },
  { id: "modernize-brand", label: "Upgrade visual credibility & UX clarity" },
  { id: "increase-conversion", label: "Improve product browsing & checkout clarity" },
  { id: "unify-data", label: "Consolidate fragmented reporting into one view" },
] as const;

export const PLANNER_PAGES: readonly { id: string; label: string }[] = [
  { id: "home", label: "Landing / Home" },
  { id: "services", label: "Services / Solutions" },
  { id: "work-cases", label: "Case Studies / Catalog" },
  { id: "pricing", label: "Pricing / Scope Guide" },
  { id: "dashboard", label: "App Dashboard / Workspace" },
  { id: "blog-docs", label: "Blog / Docs / Knowledge Base" },
  { id: "contact-book", label: "Contact / Intake Flow" },
] as const;

export const PLANNER_FEATURES: readonly { id: string; label: string }[] = [
  { id: "auth-roles", label: "User Login & Roles" },
  { id: "search-filter", label: "Interactive Search & Filters" },
  { id: "crm-forms", label: "Validated Forms & CRM Routing" },
  { id: "ai-assistant", label: "Grounded AI Support / Intake Helper" },
  { id: "n8n-workflows", label: "Automated Background Workflows (n8n)" },
  { id: "analytics-charts", label: "Live KPI Charts & CSV Exports" },
  { id: "payments-cart", label: "Cart / Checkout / Subscriptions" },
  { id: "cms-content", label: "Editable Content / Blog Pipeline" },
] as const;

export const PLANNER_INTEGRATIONS: readonly { id: string; label: string }[] = [
  { id: "hubspot-crm", label: "HubSpot / Pipedrive / CRM" },
  { id: "google-workspace", label: "Google Workspace / Slack" },
  { id: "stripe-billing", label: "Stripe / Payments" },
  { id: "shopify-erp", label: "Shopify / Inventory ERP" },
  { id: "postgres-api", label: "PostgreSQL / Custom REST API" },
  { id: "email-resend", label: "Resend / Transactional Email" },
] as const;

export const PLANNER_PLATFORMS: readonly { id: PlannerPlatform; label: string }[] = [
  { id: "nextjs-web", label: "Next.js + TypeScript Web App" },
  { id: "shopify-or-headless", label: "Shopify or Custom Headless Storefront" },
  { id: "web-plus-mobile", label: "Web App + Mobile Companion (Expo)" },
  { id: "n8n-ai-backend", label: "n8n + AI Agent Workflow System" },
  { id: "not-sure", label: "Open to technical recommendation" },
] as const;

export const PLANNER_MOODS: readonly { id: PlannerBrandMood; label: string; desc: string }[] = [
  { id: "editorial-dark", label: "Editorial Dark Studio", desc: "Confident dark surfaces, crisp type hierarchy, restrained warmth" },
  { id: "crisp-light", label: "Clean Daylight Utility", desc: "Airy light canvas, sharp structure, rapid scannability" },
  { id: "warm-craft", label: "Warm Tactile Craft", desc: "Approachable human tone, organic color warmth, generous spacing" },
  { id: "technical-grid", label: "Precision Technical", desc: "Structured data grids, monospace readouts, clear visual telemetry" },
  { id: "bold-studio", label: "Bold Expressive Brand", desc: "Stronger typographic scale and high-contrast hero statement" },
] as const;

export const PLANNER_TYPOGRAPHY: readonly {
  id: PlannerTypographyId;
  label: string;
  headingFont: string;
  bodyFont: string;
  desc: string;
}[] = [
  {
    id: "grotesk-clean",
    label: "Modern Geometric Sans",
    headingFont: "var(--font-heading), system-ui, sans-serif",
    bodyFont: "var(--font-sans), system-ui, sans-serif",
    desc: "Clean, sharp modern product typography",
  },
  {
    id: "editorial-serif",
    label: "Editorial Serif + Sans",
    headingFont: "Georgia, 'Times New Roman', serif",
    bodyFont: "var(--font-sans), system-ui, sans-serif",
    desc: "Authoritative publication and craft aesthetic",
  },
  {
    id: "technical-mono",
    label: "Sans + Technical Mono",
    headingFont: "var(--font-heading), system-ui, sans-serif",
    bodyFont: "var(--font-mono), ui-monospace, monospace",
    desc: "Developer-focused precision & data clarity",
  },
  {
    id: "humanist-friendly",
    label: "Warm Humanist Sans",
    headingFont: "'Trebuchet MS', var(--font-sans), sans-serif",
    bodyFont: "var(--font-sans), system-ui, sans-serif",
    desc: "Approachable, readable service & consumer feel",
  },
] as const;

export const PLANNER_TIMELINES = [
  "Exploring / Flexible",
  "2–4 weeks (Focused MVP / Sprint)",
  "1–2 months (Full Build)",
  "Quarter-long staged roadmap",
] as const;

export const PLANNER_BUDGETS = [
  "Prefer to discuss after discovery",
  "Under $3,000 (Focused sprint / prototype)",
  "$3,000 – $8,000 (Core site / workflow)",
  "$8,000 – $20,000 (Custom app / multi-system)",
  "$20,000+ (Multi-phase platform)",
] as const;

export const DEFAULT_PLANNER_STATE: PlannerState = {
  projectType: "saas-web-app",
  audience: "b2b-buyers",
  goals: ["launch-mvp", "qualified-leads"],
  projectLabel: "",
  problemNote: "",
  pages: ["home", "services", "dashboard", "contact-book"],
  features: ["search-filter", "crm-forms", "analytics-charts"],
  integrations: ["postgres-api", "email-resend"],
  platform: "nextjs-web",
  brandMood: "editorial-dark",
  paletteId: "obsidian-coral",
  typographyId: "grotesk-clean",
  typeScale: "balanced",
  buttonStyle: "pill",
  cardStyle: "bordered",
  navLayout: "top-bar",
  heroStyle: "split-visual",
  contentReadiness: "partial-drafts",
  imageryStyle: "product-ui",
  motionLevel: "subtle-polish",
  accessibilityTarget: "wcag-aa",
  mobilePriority: "mobile-first",
  timeline: "1–2 months (Full Build)",
  budget: "Prefer to discuss after discovery",
};

export const COMPARE_ALTERNATE_PRESET: Partial<PlannerState> = {
  brandMood: "crisp-light",
  paletteId: "ivory-terracotta",
  typographyId: "editorial-serif",
  buttonStyle: "soft-radius",
  cardStyle: "elevated",
  heroStyle: "centered-editorial",
};

export function getPalette(id: PlannerPaletteId): PaletteSpec {
  return PLANNER_PALETTES.find((p) => p.id === id) ?? PLANNER_PALETTES[0];
}

export function getTypography(id: PlannerTypographyId) {
  return PLANNER_TYPOGRAPHY.find((t) => t.id === id) ?? PLANNER_TYPOGRAPHY[0];
}

export function getProjectTypeMeta(id: PlannerProjectType) {
  return PLANNER_PROJECT_TYPES.find((t) => t.id === id) ?? PLANNER_PROJECT_TYPES[0];
}

/**
 * Privacy-safe URL serializer: encodes ONLY non-personal option IDs.
 * Free-text notes (`projectLabel`, `problemNote`) are explicitly stripped so
 * shared links never leak client names, internal project titles, or PII.
 */
export function encodePlannerShareQuery(state: PlannerState): string {
  const params = new URLSearchParams();
  params.set("pt", state.projectType);
  params.set("au", state.audience);
  if (state.goals.length) params.set("gl", state.goals.join(","));
  if (state.pages.length) params.set("pg", state.pages.join(","));
  if (state.features.length) params.set("ft", state.features.join(","));
  if (state.integrations.length) params.set("ig", state.integrations.join(","));
  params.set("pl", state.platform);
  params.set("md", state.brandMood);
  params.set("pal", state.paletteId);
  params.set("typ", state.typographyId);
  params.set("sc", state.typeScale);
  params.set("btn", state.buttonStyle);
  params.set("crd", state.cardStyle);
  params.set("nav", state.navLayout);
  params.set("hr", state.heroStyle);
  params.set("cnt", state.contentReadiness);
  params.set("img", state.imageryStyle);
  params.set("mot", state.motionLevel);
  params.set("a11y", state.accessibilityTarget);
  params.set("mob", state.mobilePriority);
  return params.toString();
}

function pickOne<T extends string>(val: string | null, allowed: readonly T[], fallback: T): T {
  return val && (allowed as readonly string[]).includes(val) ? (val as T) : fallback;
}

function pickMany(val: string | null, allowed: readonly string[], fallback: string[]): string[] {
  if (val === null) return fallback;
  const parsed = val
    .split(",")
    .map((s) => s.trim())
    .filter((s) => allowed.includes(s));
  return Array.from(new Set(parsed));
}

export function decodePlannerShareQuery(search: string): PlannerState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if ([...params.keys()].length === 0) return DEFAULT_PLANNER_STATE;

  return {
    ...DEFAULT_PLANNER_STATE,
    projectType: pickOne(params.get("pt"), PLANNER_PROJECT_TYPES.map((x) => x.id), DEFAULT_PLANNER_STATE.projectType),
    audience: pickOne(params.get("au"), PLANNER_AUDIENCES.map((x) => x.id), DEFAULT_PLANNER_STATE.audience),
    goals: pickMany(params.get("gl"), PLANNER_GOALS.map((x) => x.id), DEFAULT_PLANNER_STATE.goals),
    pages: pickMany(params.get("pg"), PLANNER_PAGES.map((x) => x.id), DEFAULT_PLANNER_STATE.pages),
    features: pickMany(params.get("ft"), PLANNER_FEATURES.map((x) => x.id), DEFAULT_PLANNER_STATE.features),
    integrations: pickMany(params.get("ig"), PLANNER_INTEGRATIONS.map((x) => x.id), DEFAULT_PLANNER_STATE.integrations),
    platform: pickOne(params.get("pl"), PLANNER_PLATFORMS.map((x) => x.id), DEFAULT_PLANNER_STATE.platform),
    brandMood: pickOne(params.get("md"), PLANNER_MOODS.map((x) => x.id), DEFAULT_PLANNER_STATE.brandMood),
    paletteId: pickOne(params.get("pal"), PLANNER_PALETTES.map((x) => x.id), DEFAULT_PLANNER_STATE.paletteId),
    typographyId: pickOne(params.get("typ"), PLANNER_TYPOGRAPHY.map((x) => x.id), DEFAULT_PLANNER_STATE.typographyId),
    typeScale: pickOne(params.get("sc"), ["compact", "balanced", "expressive"] as const, DEFAULT_PLANNER_STATE.typeScale),
    buttonStyle: pickOne(params.get("btn"), ["pill", "soft-radius", "sharp"] as const, DEFAULT_PLANNER_STATE.buttonStyle),
    cardStyle: pickOne(params.get("crd"), ["bordered", "elevated", "flat-minimal"] as const, DEFAULT_PLANNER_STATE.cardStyle),
    navLayout: pickOne(params.get("nav"), ["top-bar", "centered-brand", "sidebar-app"] as const, DEFAULT_PLANNER_STATE.navLayout),
    heroStyle: pickOne(
      params.get("hr"),
      ["split-visual", "centered-editorial", "product-frame", "metrics-strip"] as const,
      DEFAULT_PLANNER_STATE.heroStyle,
    ),
    contentReadiness: pickOne(
      params.get("cnt"),
      ["ready", "partial-drafts", "need-help"] as const,
      DEFAULT_PLANNER_STATE.contentReadiness,
    ),
    imageryStyle: pickOne(
      params.get("img"),
      ["product-ui", "editorial-photo", "3d-motion", "clean-diagrams"] as const,
      DEFAULT_PLANNER_STATE.imageryStyle,
    ),
    motionLevel: pickOne(
      params.get("mot"),
      ["minimal-static", "subtle-polish", "expressive-guided"] as const,
      DEFAULT_PLANNER_STATE.motionLevel,
    ),
    accessibilityTarget: pickOne(
      params.get("a11y"),
      ["wcag-aa", "wcag-aaa-strict"] as const,
      DEFAULT_PLANNER_STATE.accessibilityTarget,
    ),
    mobilePriority: pickOne(
      params.get("mob"),
      ["mobile-first", "balanced-responsive", "desktop-heavy-app"] as const,
      DEFAULT_PLANNER_STATE.mobilePriority,
    ),
    // Never hydrate free-text personal fields from URL params
    projectLabel: "",
    problemNote: "",
  };
}

/** Generate practical discovery questions tailored to the user's selected choices. */
export function buildOpenQuestions(state: PlannerState): string[] {
  const qs: string[] = [];

  if (state.contentReadiness !== "ready") {
    qs.push("Who will own final copy approval and product proof assets so page structure is built around real text rather than placeholder copy?");
  }
  if (state.features.includes("auth-roles")) {
    qs.push("Which user roles need distinct permissions, and do you need SSO/OAuth or standard email/password authentication for v1?");
  }
  if (state.features.includes("ai-assistant") || state.projectType === "ai-agent-automation") {
    qs.push("Which source documents or APIs should ground the AI agent, and which actions require human approval before executing?");
  }
  if (state.features.includes("payments-cart") || state.projectType === "ecommerce-storefront") {
    qs.push("How many SKUs, pricing tiers, or shipping/tax rules apply at launch — and would standard Shopify checkout save complexity over custom?");
  }
  if (state.integrations.length > 0) {
    qs.push("Do you already have API keys, sandbox environments, and clear ownership for the external tools selected for integration?");
  }
  if (state.platform === "web-plus-mobile") {
    qs.push("Which workflows genuinely need a native mobile app versus a fast installable mobile-first web view in phase 1?");
  }
  if (state.accessibilityTarget === "wcag-aaa-strict") {
    qs.push("Do you have an existing brand color palette that needs contrast-ratio adjustments to hit strict WCAG AAA targets?");
  }
  qs.push("What single measurable outcome would make the first milestone worth shipping before expanding into phase 2?");

  return qs.slice(0, 5);
}

/** Recommend real portfolio entries and services aligned with the selected configuration. */
export function matchPortfolioRecommendations(state: PlannerState): {
  services: { label: string; href: string; reason: string }[];
  projects: Project[];
} {
  const typeMeta = getProjectTypeMeta(state.projectType);
  const services: { label: string; href: string; reason: string }[] = [
    { label: typeMeta.serviceName, href: typeMeta.servicePath, reason: `Primary discipline for ${typeMeta.label}` },
  ];

  if (state.features.includes("ai-assistant") || state.features.includes("n8n-workflows")) {
    services.push({
      label: "AI Agents & n8n Automation",
      href: "/services/n8n-automation",
      reason: "Selected AI helper or automated workflow routing",
    });
  }
  if (state.features.includes("analytics-charts") || state.projectType === "internal-dashboard") {
    services.push({
      label: "Business Dashboards & React Analytics",
      href: "/services/business-dashboards",
      reason: "Selected KPI charts or operational workspace",
    });
  }
  if (state.imageryStyle === "3d-motion" || state.projectType === "creative-brand-launch") {
    services.push({
      label: "Creative Production & Brand Systems",
      href: "/services/creative-production",
      reason: "Selected brand launch visuals or motion/3D imagery",
    });
  }

  const dedupedServices = services.filter((s, i, arr) => arr.findIndex((x) => x.href === s.href) === i).slice(0, 3);

  const slugMap: Record<PlannerProjectType, string[]> = {
    "marketing-site": ["halcyon-brand-system", "tessera-clayworks-storefront", "pipelineos-crm"],
    "saas-web-app": ["pipelineos-crm", "stockflow-inventory", "tenant-usage-metering-billing"],
    "ecommerce-storefront": ["tessera-clayworks-storefront", "stockflow-inventory", "b2b-wholesale-tier-portal"],
    "ai-agent-automation": ["inbound-lead-qualification-workflow", "tideline-support-agent", "agent-eval-harness"],
    "internal-dashboard": ["northwind-analytics-dashboard", "meridian-inventory-operations", "finops-cloud-cost-anomaly"],
    "creative-brand-launch": ["halcyon-brand-system", "motion-production-pipeline", "design-system-token-auditor"],
  };

  const targetSlugs = slugMap[state.projectType] ?? slugMap["saas-web-app"];
  const projects = targetSlugs
    .map((slug) => PROJECTS.find((p) => p.slug === slug))
    .filter((p): p is Project => Boolean(p));

  return { services: dedupedServices, projects };
}

/** Plain-language structured Markdown/text brief suitable for copying, printing, or pasting into an inquiry. */
export function formatDiscoveryBrief(state: PlannerState): string {
  const typeMeta = getProjectTypeMeta(state.projectType);
  const audience = PLANNER_AUDIENCES.find((a) => a.id === state.audience)?.label ?? state.audience;
  const platform = PLANNER_PLATFORMS.find((p) => p.id === state.platform)?.label ?? state.platform;
  const mood = PLANNER_MOODS.find((m) => m.id === state.brandMood)?.label ?? state.brandMood;
  const palette = getPalette(state.paletteId);
  const typography = getTypography(state.typographyId);
  const questions = buildOpenQuestions(state);
  const { services, projects } = matchPortfolioRecommendations(state);

  const labelList = (ids: string[], source: readonly { id: string; label: string }[]) =>
    ids.length
      ? ids.map((id) => source.find((x) => x.id === id)?.label ?? id).join(", ")
      : "To be decided in discovery";

  const lines = [
    "# Exploratory Project & Design Brief",
    "Generated locally via Ali Arshad Personal Studio Visual Project Planner (https://www.aliarshad.co/project-planner)",
    "NOTE: Exploratory discovery brief only — not a binding quote, contract, or guaranteed delivery schedule.",
    "",
    "## 1. Project Context",
    ...(state.projectLabel.trim() ? [`- Working Title: ${state.projectLabel.trim()}`] : []),
    `- Project Type: ${typeMeta.label}`,
    `- Primary Audience: ${audience}`,
    `- Key Goals: ${labelList(state.goals, PLANNER_GOALS)}`,
    ...(state.problemNote.trim() ? [`- Problem / Context Notes: ${state.problemNote.trim()}`] : []),
    "",
    "## 2. Scope, Pages & Integrations",
    `- Target Platform: ${platform}`,
    `- Planned Sections / Pages: ${labelList(state.pages, PLANNER_PAGES)}`,
    `- Core Capabilities: ${labelList(state.features, PLANNER_FEATURES)}`,
    `- Integrations: ${labelList(state.integrations, PLANNER_INTEGRATIONS)}`,
    "",
    "## 3. Visual & UX Direction",
    `- Brand Mood: ${mood}`,
    `- Color Palette: ${palette.name} (BG ${palette.bg}, Accent ${palette.accent})`,
    `- Typography Direction: ${typography.label} (Scale: ${state.typeScale})`,
    `- UI Styling: Buttons = ${state.buttonStyle}, Cards = ${state.cardStyle}, Navigation = ${state.navLayout}, Hero = ${state.heroStyle}`,
    "",
    "## 4. Content, Accessibility & Delivery Preferences",
    `- Content Readiness: ${state.contentReadiness}`,
    `- Visual / Imagery Direction: ${state.imageryStyle}`,
    `- Motion Preference: ${state.motionLevel}`,
    `- Accessibility Target: ${state.accessibilityTarget.toUpperCase()}`,
    `- Responsive Priority: ${state.mobilePriority}`,
    `- Desired Timing: ${state.timeline}`,
    `- Budget Comfort: ${state.budget}`,
    "",
    "## 5. Recommended Studio Reference Paths",
    ...services.map((s) => `- Service: ${s.label} (${s.href})`),
    ...projects.map((p) => `- Reference Build: ${p.title} [${p.status}] (/work/${p.slug})`),
    "",
    "## 6. Open Discovery Questions to Align On",
    ...questions.map((q, i) => `${i + 1}. ${q}`),
  ];

  return lines.join("\n");
}
