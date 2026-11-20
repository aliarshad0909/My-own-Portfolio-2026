/**
 * Calculator Centre — central tool registry.
 * Every calculator is genuinely functional (pure domain math in lib/tools/*,
 * unit tested) and legitimately indexable. Publication state is read from the
 * keyword registry so there is one source of truth.
 */

import type { IconName } from "@/components/ui/Icon";
import { getKeyword } from "@/lib/seo/keyword-registry";
import type { PublicationState } from "@/lib/seo/publication";

export type ToolHeroVisual = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
};

export type ToolDef = {
  slug: string; // /tools/<slug>
  keywordId: string;
  icon: IconName;
  category: string;
  title: string;
  h1: string;
  lead: string;
  /** Short 1-line outcome shown on the /tools hub preview card. */
  previewHighlight: string;
  /** Honest caveat shown under the tool. */
  caveat: string;
  /** Short explanatory bullets displayed below the calculator to clarify formulas & assumptions. */
  howItWorks: string[];
  relatedHub: string;
  relatedResource: string;
  heroVisual?: ToolHeroVisual;
};

export const TOOLS: ToolDef[] = [
  {
    slug: "shipping-cost-calculator",
    keywordId: "tool-shipping-cost",
    icon: "truck",
    category: "Logistics & Freight",
    title: "Shipping Cost & Volumetric Weight Calculator",
    h1: "Shipping Cost Calculator",
    lead: "Calculate volumetric weight, chargeable weight and estimated freight costs with metric (kg/cm) or imperial (lb/in) units.",
    previewHighlight: "Volumetric vs. actual weight, chargeable kg & handling total",
    caveat:
      "Planning estimate only — not a live carrier quote. Actual courier or freight-forwarder invoices depend on lane tariffs, fuel surcharges, residential delivery and carrier-specific dimensional rules.",
    howItWorks: [
      "Volumetric weight divides parcel volume (L × W × H) by the carrier divisor (typically 5,000 for air express in cm, 6,000 for air cargo, or 139 for inches).",
      "Carriers bill on chargeable weight — whichever is greater between actual scale weight and volumetric weight.",
      "Total estimated cost multiplies chargeable weight by your rate per unit and adds fixed handling or documentation charges.",
    ],
    relatedHub: "/services/global-sourcing",
    relatedResource: "/resources/what-is-landed-cost",
    heroVisual: {
      src: "/images/site-visuals/tools/shipping-cost-model.svg",
      alt: "Diagram comparing actual parcel weight against volumetric weight (L × W × H divided by divisor) to select chargeable weight and estimate total freight cost",
      width: 1200,
      height: 720,
      caption: "Volumetric vs. actual weight & chargeable freight formula",
    },
  },
  {
    slug: "landed-cost-calculator",
    keywordId: "tool-landed-cost",
    icon: "globe",
    category: "Import & Margin",
    title: "Landed Cost & Margin Calculator",
    h1: "Landed Cost Calculator",
    lead: "Work out the true per-unit cost of imported goods — including supplier currency FX, shipping, duty, import taxes, clearance, local delivery and target margin.",
    previewHighlight: "Full import cost waterfall, per-unit landed cost & gross margin",
    caveat:
      "A planning estimate, not an official customs determination. Actual customs valuation basis (FOB vs. CIF), HS tariff classification and local tax rules can differ; confirm with a licensed customs broker before committing.",
    howItWorks: [
      "Converts supplier unit cost × quantity into reporting currency using your specified exchange rate.",
      "Applies customs duty to product value and optional import tax (VAT/GST) on product value plus duty.",
      "Allocates freight, insurance, customs clearance, local transportation and extra expenses across all units to reveal true per-unit landed cost and effective margin.",
    ],
    relatedHub: "/services/global-sourcing",
    relatedResource: "/resources/what-is-landed-cost",
    heroVisual: {
      src: "/images/diagrams/landed-cost-waterfall.svg",
      alt: "Landed cost breakdown diagram showing goods value, volumetric freight, estimated import duty, marine insurance and brokerage fees combining into per-unit landed cost and uplift multiplier",
      width: 1200,
      height: 720,
      caption: "Additive landed-cost breakdown & per-unit allocation",
    },
  },
  {
    slug: "currency-exchange-calculator",
    keywordId: "tool-currency-exchange",
    icon: "currency",
    category: "FX & Cross-Border",
    title: "Currency Exchange Calculator (PKR, USD, EUR, GBP, AED, CNY)",
    h1: "Currency Exchange Calculator",
    lead: "Convert between major global and regional business currencies using cached mid-market reference rates — with instant currency swap and manual rate override.",
    previewHighlight: "Live reference rates, popular business pairs & manual rate override",
    caveat:
      "Reference mid-market rates are fetched server-side from ExchangeRate-API (open.er-api.com) and cached hourly. Banks, card networks and wire providers add spreads and transfer fees — use the manual rate override to test an exact supplier or bank quote.",
    howItWorks: [
      "Fetches daily reference exchange rates via an isolated server-side API route — no third-party keys are ever exposed to the browser.",
      "Cross-converts cleanly across PKR, USD, EUR, GBP, AED, CNY, CAD, AUD, SAR, JPY, TRY, INR, CHF and SGD with one-click swap and popular pair presets.",
      "If live rates are temporarily unavailable or you have a locked bank/supplier rate, enter a manual exchange rate directly to keep working with zero interruption.",
    ],
    relatedHub: "/services/global-sourcing",
    relatedResource: "/resources/what-is-landed-cost",
    heroVisual: {
      src: "/images/site-visuals/tools/currency-exchange-model.svg",
      alt: "Architecture schematic showing server-side cached exchange-rate fetch with graceful manual rate override for cross-border supplier and invoice conversions",
      width: 1200,
      height: 720,
      caption: "Server-cached reference feed with instant manual override",
    },
  },
  {
    slug: "automation-roi-calculator",
    keywordId: "tool-automation-roi",
    icon: "bot",
    category: "Operations & AI",
    title: "Automation ROI & Payback Calculator",
    h1: "Automation ROI Calculator",
    lead: "Model hours saved, labour cost savings, net monthly benefit after software costs, payback period and first-year ROI from your own operational numbers.",
    previewHighlight: "Hours reclaimed, net monthly benefit, payback horizon & Year-1 ROI",
    caveat:
      "Models direct labour time saved rather than speculative revenue, and caps automation efficiency at 90% because real workflows always retain human exception handling and oversight.",
    howItWorks: [
      "Calculates weekly, monthly and annual hours reclaimed from team size, repetitive hours per week, working weeks per year and a realistic capped automation percentage.",
      "Subtracts ongoing monthly software, hosting or API maintenance costs from gross labour savings to report true monthly and annual net benefit.",
      "Estimates payback period (weeks and months) and first-year net ROI against your one-time implementation budget.",
    ],
    relatedHub: "/services/n8n-automation",
    relatedResource: "/resources/automation-roi",
    heroVisual: {
      src: "/images/site-visuals/tools/automation-roi-model.svg",
      alt: "Visual formula diagram showing weekly hours, team size, loaded hourly rate and capped automation share plotted against one-time build cost to find break-even payback weeks",
      width: 1200,
      height: 720,
      caption: "Net payback formula & break-even horizon (capped at 90%)",
    },
  },
  {
    slug: "web-project-estimator",
    keywordId: "tool-web-estimator",
    icon: "calculator",
    category: "Project Scoping",
    title: "Project Estimation Calculator (Web, AI, n8n, Video & Branding)",
    h1: "Project Estimation Calculator",
    lead: "Build a structured scope summary, indicative budget range and delivery timeframe across websites, ecommerce, web apps, AI agents, n8n automation, video and branding.",
    previewHighlight: "7 studio categories, indicative budget band & 1-click proposal hand-off",
    caveat:
      "Illustrative planning ranges only — never a binding quote. Real project pricing depends on existing systems, content readiness and exact requirements confirmed in a short discovery call.",
    howItWorks: [
      "Select your project category, scope tier, deliverable or screen count, design complexity, backend depth, integrations, timeline and post-launch support.",
      "Generates an indicative budget band, complexity rating, realistic delivery window and structured requirements checklist.",
      "Click “Request a Project Proposal” to carry your scope summary, category, budget range and timeline straight into the studio inquiry form.",
    ],
    relatedHub: "/services/web-development",
    relatedResource: "/resources/custom-web-app-cost",
    heroVisual: {
      src: "/images/site-visuals/tools/web-estimator-model.svg",
      alt: "Diagram showing how project shape, screen count, design depth, external integrations and timeline urgency move an illustrative project budget range",
      width: 1200,
      height: 720,
      caption: "How scope complexity & integrations shape an indicative range",
    },
  },
];

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);

export function toolState(tool: ToolDef): PublicationState {
  return getKeyword(tool.keywordId)?.state ?? "Researched";
}
