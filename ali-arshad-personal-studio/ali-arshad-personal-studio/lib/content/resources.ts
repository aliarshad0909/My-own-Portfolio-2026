/**
 * Resource / blog infrastructure.
 *
 * Typed articles. Most begin as Drafted or Researched and only publish once
 * genuinely written and reviewed (evidence = "article written"). The three
 * cornerstone guides that pair with the calculators are fully written and
 * Published; the rest are honest stubs that render on previews only.
 *
 * `publicationState` here is the article's own truth; a test asserts it agrees
 * with the matching keyword-registry row so the two never drift.
 */

import type { PublicationState } from "@/lib/seo/publication";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type Resource = {
  slug: string; // /resources/<slug>
  keywordId: string;
  title: string;
  description: string;
  /** Short standfirst under the H1. */
  lead: string;
  publicationState: PublicationState;
  /** Internal links to weave in (service hub, tool). */
  related: string[];
  body: ArticleBlock[];
};

const p = (text: string): ArticleBlock => ({ type: "p", text });
const h2 = (text: string): ArticleBlock => ({ type: "h2", text });
const ul = (items: string[]): ArticleBlock => ({ type: "ul", items });

const STUB = (note: string): ArticleBlock[] => [
  p(note),
  p("This guide is drafted and will be expanded before it is published. In the meantime, the linked service page covers the essentials."),
];

export const RESOURCES: Resource[] = [
  // ───────────────── Cornerstone, fully written, Published ──────────────────
  {
    slug: "custom-web-app-cost",
    keywordId: "res-web-app-cost",
    title: "How Much Does a Custom Web App Cost?",
    description:
      "An honest breakdown of what drives the cost of a custom web application, with realistic ranges and the factors that move them.",
    lead: "The real answer is “it depends” — but it depends on a short list of things you can actually reason about.",
    publicationState: "Published",
    related: ["/tools/web-project-estimator", "/services/web-development"],
    body: [
      p("Nobody can quote a custom web application from a single sentence, and anyone who does is guessing. But the cost is not mysterious either. It is driven by a handful of factors, and once you can see them you can estimate a sensible range yourself."),
      h2("What actually drives the cost"),
      ul([
        "Scope: how many distinct screens and features, and how much logic sits behind them.",
        "Integrations: every payment provider, CRM, auth system or external API adds build and testing time.",
        "Design: a template is cheaper; a custom interface built from a design system costs more and looks like yours.",
        "Data: simple forms are cheap; real data modelling, permissions and reporting are not.",
        "Timeline: a genuine rush compresses the schedule and raises the price.",
      ]),
      h2("Realistic ranges"),
      p("A small marketing site built on a template might start in the low thousands. A custom web application with several integrations and real data behind it is usually a five-figure project. A complex, multi-role platform is larger again. The estimator on this site turns these factors into a band in a few clicks."),
      h2("How to spend less without regret"),
      ul([
        "Cut scope, not quality: ship the one thing that matters first.",
        "Reuse a design system instead of inventing every component.",
        "Integrate only what earns its keep in version one.",
        "Avoid a false rush — calendar pressure is the most expensive feature.",
      ]),
      p("When you are ready for a real number rather than a range, the honest path is a short conversation and a written scope. The estimate is where that conversation starts, not where it ends."),
    ],
  },
  {
    slug: "automation-roi",
    keywordId: "res-automation-roi",
    title: "How to Measure Automation ROI",
    description:
      "A simple, honest way to decide whether automating a task is worth it: time saved against build cost, with the traps to avoid.",
    lead: "Automation is worth it when the time it saves pays back the cost of building it — and keeps paying after that.",
    publicationState: "Published",
    related: ["/tools/automation-roi-calculator", "/services/n8n-automation"],
    body: [
      p("The case for automating a task is usually simple arithmetic, but it is easy to get wrong in both directions — overselling the saving, or ignoring a genuine win. Here is the honest version."),
      h2("The core calculation"),
      p("Take the hours spent on a repetitive task each week, multiply by the fully-loaded hourly cost of the people doing it and by how many of them there are. That is the weekly cost of doing it by hand. Multiply by the share an automation can realistically remove — never 100% — and you have the weekly saving. Divide the build cost by that saving and you have the payback period in weeks."),
      h2("The traps"),
      ul([
        "Assuming 100% automation. Something always needs a human: exceptions, approvals, edge cases.",
        "Ignoring maintenance. Automations need occasional care; factor it in.",
        "Counting saved time that is never reclaimed. The saving is real only if the freed hours go somewhere useful.",
        "Automating a bad process. Fix the process first, then automate it.",
      ]),
      h2("A worked example"),
      p("A two-person team spends eight hours each per week on manual lead handling at a loaded cost of $35/hour. Automating 60% of it saves about $336 a week, or roughly $17,000 a year. Against a $4,000 build, that pays back in under three months. The calculator on this site runs this for your own numbers."),
      p("If the payback is measured in months and the process is stable, it is almost always worth it. If it is measured in years, automate something else first."),
    ],
  },
  {
    slug: "what-is-landed-cost",
    keywordId: "res-landed-cost",
    title: "What Is Landed Cost? (And How to Calculate It)",
    description:
      "Landed cost is the true, all-in cost of getting a product to your door. Here is what it includes and how to work it out.",
    lead: "The price on the supplier's invoice is not what the product costs you. Landed cost is.",
    publicationState: "Published",
    related: ["/tools/landed-cost-calculator", "/services/global-sourcing"],
    body: [
      p("Landed cost is the total cost of a product once it has actually arrived and is ready to sell: the goods themselves plus everything it took to get them there. Pricing off the supplier quote alone is how margins quietly disappear."),
      h2("What it includes"),
      ul([
        "Goods value: unit cost times quantity.",
        "Freight: shipping the whole order, by sea, air or road.",
        "Duty: import tariff, a percentage of the goods value by classification.",
        "Insurance: covering the shipment in transit.",
        "Other fees: brokerage, handling, port and documentation charges.",
      ]),
      h2("How to calculate it"),
      p("Add them all up for the order, then divide by the quantity for a per-unit landed cost. The useful number is often the uplift factor — landed cost as a multiple of the raw goods value. A factor of 1.3 means the product really costs 30% more than the invoice suggests, and that is the number your pricing has to clear."),
      h2("Why it matters"),
      p("Two suppliers can quote the same unit price and land at very different costs once freight and duty are in. Comparing on landed cost, not invoice price, is the whole point. The calculator on this site does the arithmetic; a licensed broker confirms the duty classification before you commit."),
    ],
  },

  // ───────────────── Drafted / Researched stubs (not yet published) ─────────
  {
    slug: "what-is-n8n",
    keywordId: "res-what-is-n8n",
    title: "What Is n8n?",
    description: "A plain-English introduction to n8n, the workflow automation tool.",
    lead: "n8n is an automation tool that connects your apps and runs repetitive work for you.",
    publicationState: "Drafted",
    related: ["/services/n8n-automation"],
    body: STUB("n8n is a workflow automation platform: you connect apps and services into a flow that runs on its own."),
  },
  {
    slug: "ai-agent-vs-chatbot",
    keywordId: "res-ai-agent-vs-chatbot",
    title: "AI Agent vs Chatbot: What's the Difference?",
    description: "Agents reason and act; chatbots follow a script. Here's what that means in practice.",
    lead: "The words get used interchangeably, but they describe quite different things.",
    publicationState: "Drafted",
    related: ["/services/ai-agents"],
    body: STUB("A chatbot follows a script; an agent retrieves information, reasons over context and takes a defined action within guardrails."),
  },
  {
    slug: "shopify-vs-custom-ecommerce",
    keywordId: "res-shopify-vs-custom",
    title: "Shopify vs Custom Ecommerce",
    description: "When a template platform is the right call, and when it is not.",
    lead: "Shopify is right for many brands. Custom earns its cost in specific situations.",
    publicationState: "Drafted",
    related: ["/services/ecommerce-development"],
    body: STUB("Shopify wins on speed and cost for standard stores; custom wins when operations or experience need something a template cannot do."),
  },
  {
    slug: "freelancer-vs-agency",
    keywordId: "res-hire-freelance-vs-agency",
    title: "Freelance Developer vs Agency",
    description: "The real trade-offs between hiring a freelancer and an agency.",
    lead: "Neither is better in general; they are better for different situations.",
    publicationState: "Drafted",
    related: ["/services"],
    body: STUB("A freelancer offers direct contact and lower overhead; an agency offers scale and redundancy. The right choice depends on your project."),
  },
  {
    slug: "n8n-vs-zapier",
    keywordId: "res-n8n-vs-zapier",
    title: "n8n vs Zapier",
    description: "How the two automation tools differ on cost, control and complexity.",
    lead: "Both automate; they make different trade-offs on hosting, pricing and power.",
    publicationState: "Drafted",
    related: ["/services/n8n-automation"],
    body: STUB("n8n is self-hostable, handles complex branching and does not bill per task; Zapier is simpler to start and more limited at scale."),
  },
  {
    slug: "nextjs-seo",
    keywordId: "res-nextjs-seo",
    title: "Next.js SEO Best Practices",
    description: "Getting metadata, canonicals and structured data right in the App Router.",
    lead: "Next.js gives you the tools for strong technical SEO — if you use them deliberately.",
    publicationState: "Researched",
    related: ["/services/web-development"],
    body: STUB("The App Router's Metadata API, sitemap and robots conventions make technical SEO straightforward when configured well."),
  },
  {
    slug: "3d-renders-for-ecommerce",
    keywordId: "res-blender-ecommerce",
    title: "3D Product Renders for Ecommerce",
    description: "Why CGI product imagery often beats a photo shoot for online stores.",
    lead: "A 3D model renders any angle, colourway or scene without another shoot.",
    publicationState: "Researched",
    related: ["/services/creative-production/3d-visualization"],
    body: STUB("3D product visualisation builds imagery from a model, so new angles and variants cost a render rather than a reshoot."),
  },
  {
    slug: "ai-agent-use-cases",
    keywordId: "res-ai-agent-use-cases",
    title: "AI Agent Use Cases for Small Business",
    description: "Practical, grounded ways small businesses use AI agents today.",
    lead: "The useful cases are narrow, defined and honest about their limits.",
    publicationState: "Researched",
    related: ["/services/ai-agents"],
    body: STUB("Support deflection, lead qualification and internal lookups are the grounded, practical agent use cases for small teams."),
  },
  {
    slug: "website-redesign-checklist",
    keywordId: "res-website-redesign-checklist",
    title: "Website Redesign Checklist",
    description: "What to sort out before, during and after a redesign.",
    lead: "A redesign goes wrong in the planning, not the building.",
    publicationState: "Researched",
    related: ["/services/web-development", "/tools/web-project-estimator"],
    body: STUB("Goals, content, redirects, analytics and SEO continuity are the items a redesign most often forgets."),
  },
  {
    slug: "choosing-a-tech-stack",
    keywordId: "res-choose-tech-stack",
    title: "How to Choose a Tech Stack",
    description: "A sane way to pick a stack without chasing hype.",
    lead: "The best stack is the one your team can build and maintain well.",
    publicationState: "Researched",
    related: ["/services/web-development"],
    body: STUB("Match the stack to the problem, the team and the maintenance horizon, not to whatever is trending."),
  },
  {
    slug: "motion-graphics-pricing",
    keywordId: "res-motion-graphics-pricing",
    title: "Motion Graphics Pricing",
    description: "What drives the cost of motion graphics and explainer video.",
    lead: "Length is the least of it; complexity and revisions drive the price.",
    publicationState: "Researched",
    related: ["/services/creative-production/motion"],
    body: STUB("Style, complexity, asset creation and revision rounds drive motion-graphics cost far more than runtime."),
  },
  {
    slug: "brand-style-guide",
    keywordId: "res-brand-guidelines",
    title: "What Is a Brand Style Guide?",
    description: "The document that keeps everything you publish looking like you.",
    lead: "A style guide is the system; a logo is just one page of it.",
    publicationState: "Researched",
    related: ["/services/branding", "/work/halcyon-brand-system"],
    body: STUB("A brand style guide documents colour, type, logo usage and tone so every output stays consistent."),
  },
];

export const getResource = (slug: string) => RESOURCES.find((r) => r.slug === slug);
