/**
 * Three transparently fictional demo customer profiles created specifically to
 * illustrate how Ali Arshad Personal Studio services and demos could apply to
 * different US business models and locations.
 *
 * STRICT HONESTY RULES:
 *  - Every profile is explicitly marked FICTIONAL DEMO CUSTOMER / ILLUSTRATIVE
 *    SCENARIO — NEVER a real client, past engagement, or verified outcome.
 *  - Zero fake reviews, zero quotes, zero real-brand-like logos, zero real
 *    street addresses.
 *  - Map pin coordinates are explicitly labeled synthetic/approximate regional
 *    markers, never real business locations.
 */

export type FictionalCustomerProfile = {
  id: "alder-loom" | "beaconfield-supply" | "northstar-cloud";
  fictionalName: string;
  disclosureBadge: "Fictional Demo Customer · Illustrative Scenario (Not a Real Client)";
  operatingModel: "Simulated Multi-Store Retail + Warehouse" | "Simulated Regional B2B Distribution Yards" | "Simulated 100% Remote Software Company";
  hasPhysicalStorefrontInScenario: boolean;
  industry: string;
  sampleProblem: string;
  illustrativeApproach: string;
  /** Real studio demos/services illustrating the technical capabilities. */
  pairedExamples: {
    title: string;
    href: string;
    buildLabel: "Live Demo" | "Locally Tested Demo" | "Consultation Service";
  }[];
  /** Service hub slugs where this fictional profile naturally fits. */
  fitServiceSlugs: string[];
  /** Schematic SVG map pin placement (percentage coordinates on stylized US grid). */
  mapPin: {
    xPct: number;
    yPct: number;
    syntheticLabel: string;
    approximateCoordsLabel: string;
    caption: string;
  };
};

export const FICTIONAL_DEMO_PROFILES: FictionalCustomerProfile[] = [
  {
    id: "alder-loom",
    fictionalName: "Alder & Loom Home Goods",
    disclosureBadge: "Fictional Demo Customer · Illustrative Scenario (Not a Real Client)",
    operatingModel: "Simulated Multi-Store Retail + Warehouse",
    hasPhysicalStorefrontInScenario: true,
    industry: "DTC & Multi-Store Home Goods Retail",
    sampleProblem:
      "In this fictional retail scenario, a three-store ceramic and textile merchant struggles with online orders overselling showroom stock, manual spreadsheet transfers between locations, and unclear landed cost on imported seasonal goods.",
    illustrativeApproach:
      "Connect a custom Next.js storefront to an atomic multi-warehouse inventory ledger and standardized landed-cost comparison sheets — delivered remotely without requiring an on-site agency.",
    pairedExamples: [
      { title: "StockFlow Inventory SaaS", href: "/case-studies/stockflow-inventory", buildLabel: "Live Demo" },
      { title: "Tessera Clayworks Storefront", href: "/case-studies/tessera-clayworks-storefront", buildLabel: "Locally Tested Demo" },
      { title: "Lantern Sourcing Platform", href: "/case-studies/lantern-sourcing-platform", buildLabel: "Locally Tested Demo" },
    ],
    fitServiceSlugs: ["ecommerce-development", "global-sourcing", "branding", "creative-production"],
    mapPin: {
      xPct: 24,
      yPct: 54,
      syntheticLabel: "Synthetic Retail Hub Pin",
      approximateCoordsLabel: "Synthetic marker (~34.0°N, 118.2°W · illustrative only)",
      caption: "Illustrative synthetic marker for a fictional 3-store + warehouse retail scenario — not a real business address or physical studio office.",
    },
  },
  {
    id: "beaconfield-supply",
    fictionalName: "Beaconfield Mechanical Supply",
    disclosureBadge: "Fictional Demo Customer · Illustrative Scenario (Not a Real Client)",
    operatingModel: "Simulated Regional B2B Distribution Yards",
    hasPhysicalStorefrontInScenario: true,
    industry: "Regional B2B Industrial Supply & Distribution",
    sampleProblem:
      "In this fictional B2B distribution scenario, inbound RFQ emails wait unanswered in shared inboxes across two regional supply yards while managers assemble weekly margin and reorder sheets manually every Friday.",
    illustrativeApproach:
      "Combine a custom PostgreSQL B2B CRM, a self-hosted n8n lead-qualification pipeline with tested validation rules, and a single-source executive revenue dashboard.",
    pairedExamples: [
      { title: "PipelineOS CRM", href: "/case-studies/pipelineos-crm", buildLabel: "Live Demo" },
      { title: "Inbound Lead Qualification n8n Workflow", href: "/case-studies/inbound-lead-qualification-workflow", buildLabel: "Locally Tested Demo" },
      { title: "Northwind Analytics Dashboard", href: "/case-studies/northwind-analytics-dashboard", buildLabel: "Locally Tested Demo" },
    ],
    fitServiceSlugs: ["business-dashboards", "n8n-automation", "web-development"],
    mapPin: {
      xPct: 56,
      yPct: 48,
      syntheticLabel: "Synthetic Distribution Pin",
      approximateCoordsLabel: "Synthetic marker (~39.7°N, 89.6°W · illustrative only)",
      caption: "Illustrative synthetic marker representing a fictional regional B2B supply business with physical distribution yards — not a real client or address.",
    },
  },
  {
    id: "northstar-cloud",
    fictionalName: "Northstar Cloud Ops",
    disclosureBadge: "Fictional Demo Customer · Illustrative Scenario (Not a Real Client)",
    operatingModel: "Simulated 100% Remote Software Company",
    hasPhysicalStorefrontInScenario: false,
    industry: "Remote-Only B2B Software & Operations Tooling",
    sampleProblem:
      "In this fictional remote-only SaaS scenario (no physical stores or offices), a distributed 18-person product team faces repetitive policy/docs support tickets and wants grounded self-serve Q&A plus occasional batch AI model evaluation without full-time ML hires.",
    illustrativeApproach:
      "Deploy a policy-grounded BM25 retrieval support agent with human escalation, a deterministic voice/chat qualification flow, and consultation-scoped RTX GPU evaluation windows.",
    pairedExamples: [
      { title: "Tideline Knowledge-Base Support Agent", href: "/case-studies/tideline-support-agent", buildLabel: "Locally Tested Demo" },
      { title: "Kestrel Voice Qualification Agent", href: "/case-studies/kestrel-voice-sales-agent", buildLabel: "Locally Tested Demo" },
      { title: "RTX GPU Compute Consultation", href: "/services/gpu-compute", buildLabel: "Consultation Service" },
    ],
    fitServiceSlugs: ["ai-agents", "web-development", "gpu-compute"],
    mapPin: {
      xPct: 76,
      yPct: 38,
      syntheticLabel: "100% Remote Distributed Team",
      approximateCoordsLabel: "Synthetic remote pin (no physical office or storefront)",
      caption: "Illustrative marker for a fictional 100% remote software business with zero physical storefronts — not a real company or office location.",
    },
  },
];

/**
 * Select ONLY the 1–2 fictional profiles that genuinely align with a given
 * location's matched service hubs, avoiding repetitive forced placement.
 */
export function selectFictionalProfilesForServices(serviceHrefs: string[], max = 2): FictionalCustomerProfile[] {
  const slugs = serviceHrefs.map((h) => h.replace(/^\/services\//, "").split("/")[0]);
  const scored = FICTIONAL_DEMO_PROFILES.map((p) => ({
    profile: p,
    score: p.fitServiceSlugs.filter((s) => slugs.includes(s)).length,
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return (scored.length > 0 ? scored.map((s) => s.profile) : [FICTIONAL_DEMO_PROFILES[1]]).slice(0, max);
}
