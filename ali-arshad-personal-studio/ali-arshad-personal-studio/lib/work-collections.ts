/**
 * Curated problem-based collections for the /work portfolio gallery.
 *
 * Replaces a flat 120-card wall with 7 intuitive collections aligned directly
 * with studio services, navigation, and client problem domains — while keeping
 * every single existing /work/[slug] route intact.
 */
import type { IconName } from "@/components/ui/Icon";
import type { Project } from "@/lib/projects";

export type WorkCollectionId =
  | "ai-products-agents"
  | "automation-integrations"
  | "saas-web-apps"
  | "analytics-dashboards"
  | "ecommerce-operations"
  | "creative-motion-production"
  | "games-experiments";

export type WorkCollectionDef = {
  id: WorkCollectionId;
  title: string;
  shortTitle: string;
  icon: IconName;
  summary: string;
  serviceHref: string;
  serviceLabel: string;
  deliveryNote: string;
  /** Default number of representative cards shown in Curated Collections view before expanding. */
  previewLimit: number;
  /** Slugs highlighted first inside this collection (ordered by strongest visual proof). */
  spotlightSlugs: string[];
};

export const WORK_COLLECTIONS: readonly WorkCollectionDef[] = [
  {
    id: "saas-web-apps",
    title: "SaaS & Web Applications",
    shortTitle: "SaaS & Web Apps",
    icon: "code",
    summary:
      "Custom Next.js, TypeScript, and PostgreSQL web applications, B2B CRMs, booking desks, and multi-tenant portals built around real workflows.",
    serviceHref: "/services/web-development",
    serviceLabel: "Web & App Development",
    deliveryNote: "Built directly by Ali Arshad",
    previewLimit: 4,
    spotlightSlugs: [
      "pipelineos-crm",
      "projectos-delivery-workspace",
      "bookos-appointment-scheduler",
      "orexa-interactive-learning-os",
      "peopleos-team-directory",
      "feature-flag-evaluator",
    ],
  },
  {
    id: "ai-products-agents",
    title: "AI Products & Agents",
    shortTitle: "AI Products & Agents",
    icon: "bot",
    summary:
      "Grounded retrieval assistants, voice lead qualification, helpdesk triage with human review, MCP policy gateways, and deterministic LLM evaluation harnesses.",
    serviceHref: "/services/ai-agents",
    serviceLabel: "AI Agents & Retrieval",
    deliveryNote: "Built directly by Ali Arshad",
    previewLimit: 4,
    spotlightSlugs: [
      "tideline-support-agent",
      "kestrel-voice-sales-agent",
      "supportos-helpdesk-console",
      "agent-eval-harness",
      "mcp-policy-gateway",
      "rag-citation-verifier",
    ],
  },
  {
    id: "automation-integrations",
    title: "Automation & Integrations",
    shortTitle: "Automation & APIs",
    icon: "layers",
    summary:
      "Self-hostable n8n workflow pipelines, webhook dead-letter replay queues, CRM deduplication bridges, and automated ops hand-offs.",
    serviceHref: "/services/n8n-automation",
    serviceLabel: "n8n & Workflow Automation",
    deliveryNote: "Built directly by Ali Arshad (security/Web3 bridges with vetted partners)",
    previewLimit: 4,
    spotlightSlugs: [
      "inbound-lead-qualification-workflow",
      "flowos-automation-studio",
      "webhook-deadletter-replay",
      "sentryline-security-posture",
      "ledgerlight-block-explorer",
    ],
  },
  {
    id: "analytics-dashboards",
    title: "Analytics & Dashboards",
    shortTitle: "Analytics & BI",
    icon: "trending",
    summary:
      "Single-source React & PostgreSQL KPI consoles, double-entry finance ledgers, FinOps anomaly monitors, and cohort reporting without spreadsheet drift.",
    serviceHref: "/services/business-dashboards",
    serviceLabel: "Business Dashboards & BI",
    deliveryNote: "Built directly by Ali Arshad",
    previewLimit: 4,
    spotlightSlugs: [
      "northwind-analytics-dashboard",
      "insightos-bi-workspace",
      "financeos-accounting-suite",
      "llm-finops-meter",
    ],
  },
  {
    id: "ecommerce-operations",
    title: "E-Commerce & Operations",
    shortTitle: "E-Commerce & Ops",
    icon: "globe",
    summary:
      "Custom Next.js storefronts, live multi-warehouse inventory SaaS + mobile barcode scanner, supplier RFQ scoring, and landed-cost modeling.",
    serviceHref: "/services/ecommerce-development",
    serviceLabel: "E-Commerce & Global Sourcing",
    deliveryNote: "Built & coordinated directly by Ali Arshad",
    previewLimit: 4,
    spotlightSlugs: [
      "stockflow-inventory",
      "tessera-clayworks-storefront",
      "stockflow-mobile-companion",
      "sourceos-procurement-hub",
      "lantern-sourcing-platform",
      "meridian-inventory-operations",
      "safety-stock-simulator",
      "returns-margin-triage",
    ],
  },
  {
    id: "creative-motion-production",
    title: "Video, Motion & Creative Production",
    shortTitle: "Video, Motion & Brand",
    icon: "clapperboard",
    summary:
      "WCAG-tested brand visual systems, probed ffmpeg rendition pipelines, scripted Blender 3D camera rigs, and design-token contrast tooling.",
    serviceHref: "/services/creative-production",
    serviceLabel: "Creative Production & Brand Growth",
    deliveryNote: "Produced directly by Ali Arshad",
    previewLimit: 4,
    spotlightSlugs: [
      "halcyon-brand-system",
      "motion-production-pipeline",
      "design-token-wcag-auditor",
      "video-rendition-planner",
      "blender-product-visualisation",
    ],
  },
  {
    id: "games-experiments",
    title: "Games & Experiments",
    shortTitle: "Games & Experiments",
    icon: "play",
    summary:
      "Twenty original, lightweight browser games crafted in TypeScript & React as personal studio experiments — never client work. Each includes a live playable route and engineering build story.",
    serviceHref: "/games",
    serviceLabel: "Open Dedicated Games Lab",
    deliveryNote: "Personal studio experiments by Ali Arshad (not a client service line)",
    previewLimit: 4,
    spotlightSlugs: [
      "game-signal-link",
      "game-circuit-turn",
      "game-cipher-five",
      "game-contrast-judge",
    ],
  },
] as const;

/**
 * Curated lead builds featured at the top of /work — six distinct flagship
 * demonstrations with verified real product screenshots spanning all core studio pillars.
 */
export const CURATED_FEATURED_SLUGS = [
  "pipelineos-crm",
  "stockflow-inventory",
  "tessera-clayworks-storefront",
  "tideline-support-agent",
  "inbound-lead-qualification-workflow",
  "northwind-analytics-dashboard",
] as const;

/** Deterministically maps every single project/game in PROJECTS to one of the 7 problem-based collections. */
export function collectionForProject(p: Project): WorkCollectionId {
  if (p.gameSlug || p.projectType === "Personal Experiment" || p.categories.includes("Games & Experiments")) {
    return "games-experiments";
  }

  const slug = p.slug;
  const niche = (p.nicheLabel ?? "").toLowerCase();
  const titleAndTags = `${p.title} ${p.tags.join(" ")} ${p.technologies.join(" ")}`.toLowerCase();

  // Explicit flagship overrides for unambiguous domain clarity
  if (
    slug === "halcyon-brand-system" ||
    slug === "motion-production-pipeline" ||
    slug === "blender-product-visualisation" ||
    slug === "design-system-token-auditor" ||
    slug === "video-rendition-planner" ||
    niche.includes("creative") ||
    niche.includes("brand") ||
    p.categories.includes("Creative Production") ||
    p.categories.includes("3D & Motion") ||
    (p.categories.includes("Branding & Marketing") && !titleAndTags.includes("ad-spend") && !titleAndTags.includes("cac"))
  ) {
    return "creative-motion-production";
  }

  if (
    slug === "stockflow-inventory" ||
    slug === "stockflow-mobile-companion" ||
    slug === "tessera-clayworks-storefront" ||
    slug === "meridian-inventory-operations" ||
    slug === "lantern-sourcing-platform" ||
    slug === "sourceos-procurement-hub" ||
    slug === "returns-margin-triage" ||
    slug === "safety-stock-simulator" ||
    slug === "supplier-compliance-ledger" ||
    niche.includes("ecommerce") ||
    niche.includes("storefront") ||
    niche.includes("inventory") ||
    niche.includes("supply chain") ||
    niche.includes("sourcing")
  ) {
    return "ecommerce-operations";
  }

  if (
    slug === "northwind-analytics-dashboard" ||
    slug === "insightos-bi-workspace" ||
    slug === "financeos-accounting-suite" ||
    slug === "finops-cloud-cost-anomaly" ||
    slug === "llm-finops-meter" ||
    slug === "gpu-batch-cost-estimator" ||
    niche.includes("dashboard") ||
    niche.includes("analytics") ||
    niche.includes("finops")
  ) {
    return "analytics-dashboards";
  }

  if (
    slug === "tideline-support-agent" ||
    slug === "kestrel-voice-sales-agent" ||
    slug === "supportos-helpdesk-console" ||
    slug === "agent-eval-harness" ||
    slug === "mcp-tool-policy-gateway" ||
    slug === "rag-citation-verifier" ||
    slug === "pii-redaction-pipeline" ||
    niche.includes("ai agent") ||
    niche.includes("retrieval") ||
    niche.includes("ai eval") ||
    niche.includes("ai safety")
  ) {
    return "ai-products-agents";
  }

  if (
    slug === "inbound-lead-qualification-workflow" ||
    slug === "flowos-automation-studio" ||
    slug === "webhook-deadletter-replay" ||
    slug === "crm-dedupe-sync-engine" ||
    slug === "sla-incident-escalation" ||
    slug === "invoice-three-way-match" ||
    slug === "sentryline-security-posture" ||
    slug === "ledgerlight-block-explorer" ||
    slug === "secret-sprawl-guard" ||
    slug === "contract-signature-audit-relay" ||
    niche.includes("n8n") ||
    niche.includes("workflow") ||
    niche.includes("integration") ||
    niche.includes("security") ||
    niche.includes("web3") ||
    p.categories.includes("AI Automation")
  ) {
    return "automation-integrations";
  }

  return "saas-web-apps";
}

/** Priority score so authentic multi-screen screenshots & live demos always surface first in every collection. */
function visualRichnessRank(p: Project, spotlightSlugs: string[]): number {
  const spotIdx = spotlightSlugs.indexOf(p.slug);
  if (spotIdx !== -1) return spotIdx;
  if (p.liveUrl) return 10;
  if (p.status === "Demo Ready") return 20;
  if (!p.conceptVisual && !p.usesSampleMedia && p.gallery.length > 0) return 30;
  if (p.generatedVisual) return 40;
  if (p.status === "Prototype") return 50;
  if (p.status === "Playable Experiment") return 55;
  if (p.status === "In Development") return 60;
  return 70;
}

export function groupProjectsByCollection(projects: Project[]) {
  return WORK_COLLECTIONS.map((col) => {
    const items = projects
      .filter((p) => collectionForProject(p) === col.id)
      .sort((a, b) => visualRichnessRank(a, col.spotlightSlugs) - visualRichnessRank(b, col.spotlightSlugs));
    return { collection: col, items };
  }).filter((g) => g.items.length > 0);
}

/** Clear plain-language audience description for the Project Detail "At a Glance" brief. */
export function audienceForProject(p: Project): string {
  const col = collectionForProject(p);
  if (col === "games-experiments") return "Designers, engineers & curious visitors testing interactive UI feel";
  if (col === "ecommerce-operations") return "E-commerce brands, wholesalers & physical-product operations teams";
  if (col === "ai-products-agents") return "Support, sales & ops teams adopting grounded, human-supervised AI";
  if (col === "automation-integrations") return "Operations & engineering teams eliminating manual data sync & webhook drift";
  if (col === "analytics-dashboards") return "Founders, finance leads & operators replacing static spreadsheet reports";
  if (col === "creative-motion-production") return "Product & marketing teams shipping cohesive brand, motion, and 3D assets";
  return "Founders & growing teams replacing fragile spreadsheets with custom software";
}

/** Explicit honest delivery attribution for every project page. */
export function deliveryAttribution(p: Project): { label: string; detail: string } {
  if (p.projectType === "Personal Experiment" || p.gameSlug) {
    return {
      label: "Personal Studio Experiment",
      detail: "Self-initiated interactive browser game built directly by Ali Arshad — not client work.",
    };
  }
  if (p.slug === "ledgerlight-block-explorer" || p.slug === "sentryline-security-posture") {
    return {
      label: "Specialist Collaboration Scope",
      detail: "Demonstrates specialist technical areas where Ali coordinates vetted independent partners transparently upfront.",
    };
  }
  return {
    label: "Direct by Ali Arshad",
    detail: "Scoped, architected, and built directly inside Ali Arshad Personal Studio.",
  };
}
