/**
 * The interactive tools, as data. Each is a genuinely functional calculator
 * (pure logic in lib/tools/*, unit tested) and therefore legitimately
 * indexable — the opposite of a thin page. Publication state is read from the
 * keyword registry so there is one source of truth.
 */

import { getKeyword } from "@/lib/seo/keyword-registry";
import type { PublicationState } from "@/lib/seo/publication";

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
  },
];

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);

export function toolState(tool: ToolDef): PublicationState {
  return getKeyword(tool.keywordId)?.state ?? "Researched";
}
