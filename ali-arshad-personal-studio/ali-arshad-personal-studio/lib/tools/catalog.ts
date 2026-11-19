/**
 * The interactive tools, as data. Each is a genuinely functional calculator
 * (pure logic in lib/tools/*, unit tested) and therefore legitimately
 * indexable — the opposite of a thin page. Publication state is read from the
 * keyword registry so there is one source of truth.
 */

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
  title: string;
  h1: string;
  lead: string;
  /** Honest caveat shown under the tool. */
  caveat: string;
  relatedHub: string;
  relatedResource: string;
  /** Optional explanatory diagram displayed alongside the hero. */
  heroVisual?: ToolHeroVisual;
};

export const TOOLS: ToolDef[] = [
  {
    slug: "web-project-estimator",
    keywordId: "tool-web-estimator",
    title: "Web Development Cost Calculator",
    h1: "Web project cost estimator",
    lead: "A quick, honest budget range for a web project from a few inputs — not a quote, a starting point for the conversation.",
    caveat:
      "These are illustrative planning figures, not a quote. Real pricing depends on detail this tool cannot see; every project is quoted individually after a short discovery conversation.",
    relatedHub: "/services/web-development",
    relatedResource: "/resources/custom-web-app-cost",
    heroVisual: {
      src: "/images/site-visuals/tools/web-estimator-model.svg",
      alt: "Diagram showing how project shape, screen count, design depth, external integrations and timeline urgency move an illustrative web budget range",
      width: 1200,
      height: 720,
      caption: "How the five estimator inputs shape an illustrative range",
    },
  },
  {
    slug: "automation-roi-calculator",
    keywordId: "tool-automation-roi",
    title: "Automation ROI Calculator",
    h1: "Automation ROI calculator",
    lead: "Estimate the yearly saving and payback period of automating a repetitive task, from your own numbers.",
    caveat:
      "This models time saved, not revenue, and caps automation efficiency below 100% because no automation removes every minute. Treat it as a directional estimate.",
    relatedHub: "/services/n8n-automation",
    relatedResource: "/resources/automation-roi",
    heroVisual: {
      src: "/images/site-visuals/tools/automation-roi-model.svg",
      alt: "Visual formula diagram showing weekly hours, team size, loaded hourly rate and capped automation share plotted against one-time build cost to find break-even payback weeks",
      width: 1200,
      height: 720,
      caption: "Payback formula & break-even horizon (capped below 100%)",
    },
  },
  {
    slug: "landed-cost-calculator",
    keywordId: "tool-landed-cost",
    title: "Landed Cost Calculator",
    h1: "Landed cost calculator",
    lead: "Work out the true per-unit cost of imported goods, including freight, duty, insurance and fees.",
    caveat:
      "A planning estimate, not a customs declaration. Real customs valuation and duty classification can differ; confirm with a licensed broker before committing.",
    relatedHub: "/services/global-sourcing",
    relatedResource: "/resources/what-is-landed-cost",
    heroVisual: {
      src: "/images/diagrams/landed-cost-waterfall.svg",
      alt: "Landed cost breakdown diagram showing goods value, volumetric freight, estimated import duty, marine insurance and brokerage fees combining into per-unit landed cost and uplift multiplier",
      width: 1200,
      height: 720,
      caption: "Five additive landed-cost lines & incoterm allocation",
    },
  },
];

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);

export function toolState(tool: ToolDef): PublicationState {
  return getKeyword(tool.keywordId)?.state ?? "Researched";
}
