/**
 * Industry directory.
 *
 * Sector-framed pages for the same services, each tied to a real demonstration
 * build so the claim is evidenced. Three sectors with genuine demo evidence
 * and unique copy are Published; the rest are honest stubs (Drafted /
 * Researched) that render on previews only, until each has its own real copy
 * and, where the sector implies it, a real client. State agrees with the
 * matching keyword-registry row (asserted by a test).
 */

import type { PublicationState } from "@/lib/seo/publication";

export type Industry = {
  slug: string; // /industries/<slug>
  keywordId: string;
  title: string;
  name: string;
  description: string;
  lead: string;
  publicationState: PublicationState;
  /** Problems this sector recognises, in its own words. */
  problems: string[];
  /** How the studio helps, concretely. */
  helps: string[];
  projectSlugs: string[];
  relatedHub: string;
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "ecommerce",
    keywordId: "ind-ecommerce-brands",
    title: "Web Development for Ecommerce Brands",
    name: "Ecommerce brands",
    description:
      "Storefronts and operational tooling for direct-to-consumer and ecommerce brands that have outgrown a template.",
    lead: "For brands that sell online and need a store built around their products and operations, not the other way round.",
    publicationState: "Published",
    problems: [
      "Our template store cannot do what we need",
      "We lose carts at a clunky checkout",
      "The storefront does not talk to our back office",
      "We need 3D or video because photos do not sell the product",
    ],
    helps: [
      "Custom storefronts with catalogue, cart and checkout built for conversion",
      "Integration with payment, fulfilment and back-office tools",
      "Launch video and motion when photography falls short",
      "A fast, accessible, SEO-ready front end",
    ],
    projectSlugs: ["tessera-clayworks-storefront", "motion-production-pipeline"],
    relatedHub: "/services/ecommerce-development",
  },
  {
    slug: "saas",
    keywordId: "ind-saas",
    title: "Development for SaaS Startups",
    name: "SaaS startups",
    description:
      "MVPs, dashboards and web applications for early-stage software companies that need to ship and show traction.",
    lead: "For founders who need a working product in front of users and investors, built to prove one thing well.",
    publicationState: "Published",
    problems: [
      "We need an MVP we can demo and raise on",
      "Our data is there but we cannot see it",
      "We need to move fast without building something we regret",
      "We are a small team and need a dependable build partner",
    ],
    helps: [
      "MVP scoped to the one thing that matters, built end to end",
      "Dashboards and analytics views over real data",
      "Next.js / React / TypeScript, the stack this site runs on",
      "Honest staging and hand-off so the team can carry it forward",
    ],
    projectSlugs: ["northwind-analytics-dashboard"],
    relatedHub: "/services/web-development",
  },
  {
    slug: "logistics",
    keywordId: "ind-logistics",
    title: "Software for Logistics and Operations",
    name: "Logistics & operations",
    description:
      "Inventory, purchasing and operational dashboards for logistics-heavy businesses that run on spreadsheets today.",
    lead: "For operators who need to see orders, inventory and suppliers in one place that does not break when someone touches it.",
    publicationState: "Published",
    problems: [
      "Our operations live in fragile spreadsheets",
      "We cannot see inventory and orders in one view",
      "Purchasing and receiving are error-prone",
      "We need to compare suppliers on real landed cost",
    ],
    helps: [
      "Operational dashboards: orders, inventory, purchasing, KPIs",
      "Purchase-order logic with receipts and status derivation",
      "Supplier comparison and landed-cost tooling",
      "A data model that holds up to real use",
    ],
    projectSlugs: ["meridian-inventory-operations", "lantern-sourcing-platform"],
    relatedHub: "/services/business-dashboards",
  },

  // ───────────────── Stubs (gated until real copy / client) ─────────────────
  {
    slug: "agencies",
    keywordId: "ind-agencies",
    title: "White-Label Development for Agencies",
    name: "Agencies",
    description: "Overflow development capacity for design and marketing agencies.",
    lead: "Extra build capacity under your brand, when your own team is at the limit.",
    publicationState: "Researched",
    problems: ["We have more work than developers"],
    helps: ["Overflow build capacity on a project basis"],
    projectSlugs: [],
    relatedHub: "/services/web-development",
  },
  {
    slug: "real-estate",
    keywordId: "ind-real-estate",
    title: "Automation for Real Estate",
    name: "Real estate",
    description: "Lead and workflow automation for real-estate teams.",
    lead: "Automate the follow-up so no lead goes cold.",
    publicationState: "Researched",
    problems: ["Leads slip through before anyone follows up"],
    helps: ["Lead capture, routing and follow-up automation"],
    projectSlugs: [],
    relatedHub: "/services/n8n-automation",
  },
  {
    slug: "manufacturing",
    keywordId: "ind-manufacturing",
    title: "Sourcing Support for Manufacturers",
    name: "Manufacturing",
    description: "Supplier sourcing and landed-cost analysis for manufacturers.",
    lead: "Find, compare and cost suppliers with clear numbers.",
    publicationState: "Researched",
    problems: ["We cannot compare suppliers fairly"],
    helps: ["Supplier research, comparison and landed-cost modelling"],
    projectSlugs: [],
    relatedHub: "/services/global-sourcing",
  },
  {
    slug: "healthcare",
    keywordId: "ind-healthcare",
    title: "Web Development for Healthcare",
    name: "Healthcare",
    description: "Web and dashboard development for healthcare organisations.",
    lead: "Careful, accessible builds for a regulated sector.",
    publicationState: "Researched",
    problems: ["We need an accessible, dependable web presence"],
    helps: ["Accessible web development and dashboards"],
    projectSlugs: [],
    relatedHub: "/services/web-development",
  },
  {
    slug: "professional-services",
    keywordId: "ind-professional-services",
    title: "Automation for Professional Services",
    name: "Professional services",
    description: "Workflow automation for law, accounting and consulting firms.",
    lead: "Automate the repetitive admin, keep the judgement with people.",
    publicationState: "Researched",
    problems: ["Admin eats billable time"],
    helps: ["Workflow automation for intake, onboarding and reporting"],
    projectSlugs: [],
    relatedHub: "/services/n8n-automation",
  },
  {
    slug: "hospitality",
    keywordId: "ind-hospitality",
    title: "Websites for Hospitality Brands",
    name: "Hospitality",
    description: "Websites and booking integrations for hospitality businesses.",
    lead: "A site that looks the part and takes bookings cleanly.",
    publicationState: "Researched",
    problems: ["Our site does not reflect the experience"],
    helps: ["Brand-led web development with booking integration"],
    projectSlugs: [],
    relatedHub: "/services/web-development",
  },
  {
    slug: "nonprofits",
    keywordId: "ind-nonprofits",
    title: "Websites for Nonprofits",
    name: "Nonprofits",
    description: "Web development and donation pages for nonprofit organisations.",
    lead: "A clear site and a donation flow that works.",
    publicationState: "Researched",
    problems: ["We need a credible site and an easy way to give"],
    helps: ["Web development with donation and campaign pages"],
    projectSlugs: [],
    relatedHub: "/services/web-development",
  },
];

export const getIndustry = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
