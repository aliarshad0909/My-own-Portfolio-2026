/**
 * Dedicated service-hub pages.
 *
 * These are the opposite of doorway pages: one substantial, uniquely written
 * page per primary service intent, each evidenced by a real demonstration
 * build in lib/projects.ts. The existing /services page stays as the overview;
 * these add depth and a clean canonical target for each commercial query named
 * in the keyword registry.
 *
 * A hub or spoke only renders and indexes according to its publicationState
 * (see lib/seo/publication.ts). The six+ core hubs are Published because the
 * capability is real and demonstrated; specialised spokes are Drafted or
 * Researched until each has its own unique copy.
 */

import type { FaqItem } from "@/lib/structured-data";
import type { IconName } from "@/components/ui/Icon";
import type { PublicationState } from "@/lib/seo/publication";

export type ServiceSpoke = {
  /** Last path segment: /services/<hubSlug>/<slug>. */
  slug: string;
  keywordId: string;
  title: string;
  h1: string;
  lead: string;
  body: string[];
  projectSlugs: string[];
  publicationState: PublicationState;
};

export type ServiceStep = { label: string; detail: string };

export type ServiceHub = {
  /** /services/<slug>. Matches a primaryUrl in the keyword registry. */
  slug: string;
  keywordId: string;
  icon: IconName;
  title: string; // <title> / metadata
  h1: string;
  lead: string;
  /** Standfirst beneath the H1. */
  intent: string;
  /** Client problems, in the client's words. */
  problems: string[];
  /** What a typical engagement includes. */
  includes: string[];
  /** How the work runs. */
  process: ServiceStep[];
  /** Real demonstration builds that evidence this service. */
  projectSlugs: string[];
  /** Related tools (/tools/*) and sibling hubs for internal linking. */
  relatedTools: string[];
  relatedHubs: string[];
  faqs: FaqItem[];
  publicationState: PublicationState;
  spokes: ServiceSpoke[];
};

export const SERVICE_HUBS: ServiceHub[] = [
  {
    slug: "web-development",
    keywordId: "hub-web-development",
    icon: "code",
    title: "Freelance Web Development Services (Next.js, React, TypeScript)",
    h1: "Web and application development",
    lead: "Custom websites and web applications built with Next.js, React and TypeScript, by an independent studio that owns the whole build.",
    intent: "For founders and teams who need a real application, not a template — and one point of contact who understands design, code and the business behind it.",
    problems: [
      "We outgrew a template and need something built properly",
      "Our site is slow and does not rank",
      "We have a product idea and need an MVP we can show investors",
      "We need a developer who can also think about design and conversion",
    ],
    includes: [
      "Discovery and a plain-language written scope before any code",
      "Next.js / React / TypeScript application development",
      "Responsive, accessible front-end from a real design system",
      "API and third-party integrations",
      "Performance and technical SEO baked in, not bolted on",
      "Staged delivery, documentation and an agreed support arrangement",
    ],
    process: [
      { label: "Discovery", detail: "A short conversation, then a written scope" },
      { label: "Design", detail: "Interface and data model agreed before building" },
      { label: "Build", detail: "Delivered in reviewable stages" },
      { label: "Launch", detail: "Deploy, documentation, hand-off and support" },
    ],
    projectSlugs: ["tessera-clayworks-storefront", "northwind-analytics-dashboard"],
    relatedTools: ["/tools/web-project-estimator"],
    relatedHubs: ["/services/ecommerce-development", "/services/ai-agents", "/services/business-dashboards"],
    faqs: [
      {
        q: "What stack do you build on?",
        a: "Next.js, React and TypeScript, deployed on Vercel. The portfolio itself and every interactive demo are built this way, so the stack is not theoretical — it is what the work pages run on.",
      },
      {
        q: "Can you take over an existing codebase?",
        a: "Often, yes, provided it is a stack I work in and the code is accessible. The honest answer depends on the state of what exists, which is what the discovery conversation is for.",
      },
      {
        q: "How much does a custom web application cost?",
        a: "Every project is quoted individually; there is no fixed price list. The web project estimator on this site gives an honest range from a few inputs, and a written scope follows discovery.",
      },
    ],
    publicationState: "Published",
    spokes: [
      {
        slug: "nextjs",
        keywordId: "spec-nextjs-developer",
        title: "Hire a Next.js Developer",
        h1: "Next.js development",
        lead: "App Router, server components and the modern Next.js stack, used in production on this very site.",
        body: [
          "Next.js is the framework this studio builds on daily. The portfolio you are reading, its sitemap, structured data and every demo run on the App Router with TypeScript.",
          "This page is being expanded with specific Next.js engagement detail. Until then, the web development hub covers the full offering.",
        ],
        projectSlugs: ["tessera-clayworks-storefront"],
        publicationState: "Drafted",
      },
      {
        slug: "mvp",
        keywordId: "spec-saas-mvp",
        title: "MVP Development for Startups",
        h1: "MVP development",
        lead: "A working first version you can show users and investors, scoped to prove one thing well.",
        body: [
          "An MVP is not a smaller version of everything — it is a complete version of the one thing that matters. The job is to find that thing with you and build it so it holds up to real use.",
          "This spoke page is drafted and will carry startup-specific detail before it is published.",
        ],
        projectSlugs: ["northwind-analytics-dashboard"],
        publicationState: "Drafted",
      },
    ],
  },
  {
    slug: "n8n-automation",
    keywordId: "hub-n8n-automation",
    icon: "bot",
    title: "n8n Workflow Automation Services",
    h1: "n8n workflow automation",
    lead: "Business processes automated with n8n, so repetitive steps run themselves and your team keeps the judgement calls.",
    intent: "For teams drowning in manual steps — lead handling, onboarding, reporting — who want automation that is reliable and that they can actually see working.",
    problems: [
      "Our team copies data between tools all day",
      "Leads slip through the cracks before anyone follows up",
      "Reports are assembled by hand every week",
      "We tried Zapier and hit its limits",
    ],
    includes: [
      "Mapping the current process before automating anything",
      "n8n workflow design, build and testing",
      "Integrations across CRMs, inboxes, sheets and APIs",
      "Clear hand-offs where a human should stay in the loop",
      "Documentation so the workflow is not a black box",
    ],
    process: [
      { label: "Map", detail: "The real process, step by step" },
      { label: "Design", detail: "What to automate, what stays human" },
      { label: "Build", detail: "Workflows built and tested in n8n" },
      { label: "Hand-off", detail: "Documented, monitored, yours to own" },
    ],
    projectSlugs: ["inbound-lead-qualification-workflow"],
    relatedTools: ["/tools/automation-roi-calculator"],
    relatedHubs: ["/services/ai-agents", "/services/business-dashboards"],
    faqs: [
      {
        q: "Why n8n rather than Zapier or Make?",
        a: "n8n is self-hostable, handles complex branching cleanly and does not bill per task, which matters once volume grows. The inbound lead-qualification demonstration on this site is built in n8n end to end.",
      },
      {
        q: "What can realistically be automated?",
        a: "Anything repetitive and rule-based: validation, enrichment, routing, scoring, notifications, reporting. Decisions that need human judgement are kept with people, by design.",
      },
      {
        q: "How do you measure whether it was worth it?",
        a: "Hours saved against build cost. The automation ROI calculator on this site estimates that from your own numbers.",
      },
    ],
    publicationState: "Published",
    spokes: [],
  },
  {
    slug: "ai-agents",
    keywordId: "hub-ai-agents",
    icon: "bot",
    title: "AI Agent Development Services",
    h1: "AI agent development",
    lead: "Scoped AI agents for support, sales and internal operations — built to help, with clear limits and human hand-off where it counts.",
    intent: "For businesses who want practical AI that does a specific job well, not a chatbot that makes things up.",
    problems: [
      "Our support team answers the same questions all day",
      "We lose sales leads outside business hours",
      "We want to use AI but not at the cost of trust",
      "Off-the-shelf bots do not know our business",
    ],
    includes: [
      "A defined scope: what the agent does and explicitly does not do",
      "Retrieval over your own knowledge so answers are grounded",
      "Support, sales or operations agents built and tested",
      "Human hand-off wherever judgement or stakes are high",
      "Honest guardrails and a plain account of the limits",
    ],
    process: [
      { label: "Scope", detail: "One job, defined precisely" },
      { label: "Ground", detail: "Your knowledge, retrievable" },
      { label: "Build", detail: "Agent built, tested against real questions" },
      { label: "Guard", detail: "Limits and hand-off wired in" },
    ],
    projectSlugs: ["tideline-support-agent", "kestrel-voice-sales-agent"],
    relatedTools: [],
    relatedHubs: ["/services/n8n-automation", "/services/web-development"],
    faqs: [
      {
        q: "Will the agent make things up?",
        a: "The design goal is the opposite: answers are retrieved from your own content, the agent is scoped to a defined job, and anything outside that is handed to a person. The support-agent demonstration shows this pattern working.",
      },
      {
        q: "What is the difference between an AI agent and a chatbot?",
        a: "A chatbot follows a script; an agent retrieves, reasons over context and takes a defined action, with guardrails. The resources section explains this in plain terms.",
      },
      {
        q: "Can an agent qualify sales leads?",
        a: "Yes — the voice sales-agent demonstration captures answers and qualifies against criteria, then hands the real conversation to a human.",
      },
    ],
    publicationState: "Published",
    spokes: [
      {
        slug: "support",
        keywordId: "spec-support-agent",
        title: "AI Customer Support Agent",
        h1: "AI customer support agents",
        lead: "An agent that answers from your own knowledge base and escalates cleanly when it should.",
        body: [
          "The Tideline support-agent demonstration shows the shape of this work: grounded answers, a visible confidence signal and a hand-off to a person when the question is out of scope.",
          "This spoke is drafted; the support hub above covers the full offering today.",
        ],
        projectSlugs: ["tideline-support-agent"],
        publicationState: "Drafted",
      },
      {
        slug: "sales",
        keywordId: "spec-ai-sales-agent",
        title: "AI Sales Agent Development",
        h1: "AI sales agents",
        lead: "Qualify and route inbound interest around the clock, then hand the real conversation to a human.",
        body: [
          "The Kestrel voice sales-agent demonstration captures a prospect's answers, scores them and passes a qualified, summarised lead onward.",
          "This spoke is drafted; the AI agents hub covers the full offering today.",
        ],
        projectSlugs: ["kestrel-voice-sales-agent"],
        publicationState: "Drafted",
      },
    ],
  },
  {
    slug: "ecommerce-development",
    keywordId: "hub-ecommerce",
    icon: "layers",
    title: "Ecommerce Website Development",
    h1: "Ecommerce development",
    lead: "Custom storefronts and the operational tooling around them — catalogue, cart, checkout and order handling that fit how you actually sell.",
    intent: "For brands who have outgrown a generic template and need a storefront built around their products and operations.",
    problems: [
      "Our template store cannot do what we need",
      "Checkout is clunky and we lose carts",
      "We need the storefront to talk to our back office",
      "We want a store that is genuinely fast",
    ],
    includes: [
      "Product catalogue with filtering and search",
      "Cart and checkout flows designed for conversion",
      "Order handling and inventory views",
      "Integration with payment, fulfilment and back-office tools",
      "A fast, accessible, SEO-ready front end",
    ],
    process: [
      { label: "Scope", detail: "Products, operations, integrations" },
      { label: "Design", detail: "Storefront and checkout flow" },
      { label: "Build", detail: "Catalogue, cart, checkout, admin" },
      { label: "Launch", detail: "Deploy, test, hand-off" },
    ],
    projectSlugs: ["tessera-clayworks-storefront"],
    relatedTools: ["/tools/web-project-estimator"],
    relatedHubs: ["/services/web-development", "/services/business-dashboards"],
    faqs: [
      {
        q: "Shopify or custom?",
        a: "Whichever genuinely fits. Shopify is right for many brands; custom earns its cost when operations or experience need something a template cannot do. The resources section has an honest comparison.",
      },
      {
        q: "Is there a real example?",
        a: "The Tessera Clayworks storefront is a complete demonstration build — catalogue, cart, checkout and admin — under a fictional brand, labelled as a demonstration.",
      },
    ],
    publicationState: "Published",
    spokes: [],
  },
  {
    slug: "business-dashboards",
    keywordId: "hub-dashboards",
    icon: "trending",
    title: "Business Dashboard Development",
    h1: "Dashboards and data visualisation",
    lead: "Custom dashboards that turn scattered data into a view people actually use to make decisions.",
    intent: "For teams who have the data but cannot see it — operations, sales, inventory, finance — and want one honest, fast dashboard built around their questions.",
    problems: [
      "Our numbers live in five different tools",
      "Leadership asks for a view we cannot assemble quickly",
      "Spreadsheets break every time someone touches them",
      "We need operational dashboards, not just charts",
    ],
    includes: [
      "The questions the dashboard must answer, agreed first",
      "Data modelling and derivation logic",
      "Clear, accessible charts and tables",
      "Operational views: orders, inventory, pipeline, KPIs",
      "A fast front end that loads real data",
    ],
    process: [
      { label: "Questions", detail: "What decisions it must support" },
      { label: "Model", detail: "The data and how it derives" },
      { label: "Build", detail: "Views, charts, tables" },
      { label: "Iterate", detail: "Refined against real use" },
    ],
    projectSlugs: ["northwind-analytics-dashboard", "meridian-inventory-operations"],
    relatedTools: [],
    relatedHubs: ["/services/web-development", "/services/global-sourcing"],
    faqs: [
      {
        q: "Can you work with our existing data?",
        a: "Usually yes — from databases, APIs, exports or sheets. The discovery step establishes what is available and how reliable it is.",
      },
      {
        q: "Is there an example?",
        a: "The Northwind analytics dashboard and the Meridian inventory-operations tooling are both complete demonstration builds of exactly this kind of work.",
      },
    ],
    publicationState: "Published",
    spokes: [],
  },
  {
    slug: "branding",
    keywordId: "hub-branding",
    icon: "lightbulb",
    title: "Brand Identity Design Services",
    h1: "Brand and identity systems",
    lead: "A coherent brand system — not just a logo — that makes everything you publish look like it belongs to you.",
    intent: "For founders and teams who need a visual identity that holds together across a website, product and content.",
    problems: [
      "Our brand looks different everywhere it appears",
      "We have a logo but no system",
      "New content never quite matches",
      "We are about to build a site and need the brand first",
    ],
    includes: [
      "Core identity: logotype, colour, type and usage",
      "A documented system, not a single asset",
      "Applied examples across web and content",
      "Hand-off files a developer and a marketer can both use",
    ],
    process: [
      { label: "Direction", detail: "Positioning and visual territory" },
      { label: "System", detail: "Colour, type, logo, rules" },
      { label: "Apply", detail: "Shown in real contexts" },
      { label: "Document", detail: "Usable guidelines and files" },
    ],
    projectSlugs: ["halcyon-brand-system"],
    relatedTools: [],
    relatedHubs: ["/services/web-development", "/services/ecommerce-development"],
    faqs: [
      {
        q: "Do I get more than a logo?",
        a: "Yes — a system: colour, type, logo and the rules that keep them consistent. The Halcyon brand-system demonstration shows the deliverable.",
      },
      {
        q: "Can you build the website too?",
        a: "Yes. Brand and build under one roof is the point of a studio of one — the identity and the site stay in sync.",
      },
    ],
    publicationState: "Published",
    spokes: [],
  },
  {
    slug: "global-sourcing",
    keywordId: "hub-sourcing",
    icon: "briefcase",
    title: "Global Sourcing and Supply Chain Coordination",
    h1: "Global sourcing coordination",
    lead: "Supplier research, comparison and landed-cost analysis, grounded in a supply-chain background — coordination and tooling, not brokerage.",
    intent: "For brands and operators who need help finding, comparing and costing suppliers, with clear-eyed numbers behind the decision.",
    problems: [
      "We do not know how to compare suppliers fairly",
      "The real landed cost keeps surprising us",
      "We need sourcing help but not a full-time hire",
      "We want the numbers before we commit",
    ],
    includes: [
      "Requirements, volume and target-cost definition",
      "Supplier research and like-for-like comparison",
      "Landed-cost modelling, including duties and freight",
      "Decision support and tooling you keep",
    ],
    process: [
      { label: "Define", detail: "Specification, volume, target cost" },
      { label: "Find", detail: "Supplier research and shortlist" },
      { label: "Compare", detail: "Scored, like-for-like" },
      { label: "Cost", detail: "Landed cost modelled honestly" },
    ],
    projectSlugs: ["lantern-sourcing-platform"],
    relatedTools: ["/tools/landed-cost-calculator"],
    relatedHubs: ["/services/business-dashboards"],
    faqs: [
      {
        q: "Are you a customs broker?",
        a: "No. This is sourcing coordination and tooling — research, comparison and cost modelling. Customs clearance and legal import duties stay with a licensed broker, and I say so upfront.",
      },
      {
        q: "What background is this based on?",
        a: "A BBA in Supply Chain Management plus the Lantern sourcing-platform demonstration, which models supplier comparison and landed cost directly.",
      },
    ],
    publicationState: "Published",
    spokes: [],
  },
  {
    slug: "creative-production",
    keywordId: "spec-blender-viz",
    icon: "clapperboard",
    title: "Creative Production: Video, Motion and 3D",
    h1: "Creative production",
    lead: "3D product visualisation, video editing and motion graphics that make a product easy to understand and hard to scroll past.",
    intent: "For brands and founders who need launch-ready visual content without an agency's turnaround or price.",
    problems: [
      "Our product is hard to explain in a photo",
      "We need launch content fast",
      "Our social ads look homemade",
      "We have no product photography",
    ],
    includes: [
      "Blender 3D product visualisation and renders",
      "Video editing and motion graphics",
      "Short-form social video",
      "Campaign-ready graphics",
    ],
    process: [
      { label: "Brief", detail: "Product, message, channels" },
      { label: "Produce", detail: "3D, edit, motion" },
      { label: "Review", detail: "Rounds with clear feedback" },
      { label: "Deliver", detail: "Final assets, formatted per channel" },
    ],
    projectSlugs: ["blender-product-visualisation", "motion-production-pipeline"],
    relatedTools: [],
    relatedHubs: ["/services/branding", "/services/ecommerce-development"],
    faqs: [
      {
        q: "Can you make 3D renders without product photography?",
        a: "Yes — that is a strength of 3D. The Blender product-visualisation demonstration builds product imagery from a model, not a photo shoot.",
      },
      {
        q: "What formats do you deliver?",
        a: "Whatever the channel needs — the motion-production pipeline demonstration covers the workflow from brief to formatted delivery.",
      },
    ],
    publicationState: "Published",
    spokes: [
      {
        slug: "3d-visualization",
        keywordId: "spec-blender-viz",
        title: "Blender 3D Product Visualisation",
        h1: "3D product visualisation",
        lead: "Photoreal product imagery built in Blender, from a model rather than a photo shoot.",
        body: [
          "The Blender product-visualisation demonstration shows the approach: a product modelled and lit so it can be rendered in any angle, colourway or scene without a reshoot.",
          "This spoke is drafted; the creative production hub covers the full offering today.",
        ],
        projectSlugs: ["blender-product-visualisation"],
        publicationState: "Drafted",
      },
      {
        slug: "motion",
        keywordId: "spec-motion-graphics",
        title: "Motion Graphics and Video Editing",
        h1: "Motion graphics",
        lead: "Edited video and motion graphics that explain a product and hold attention.",
        body: [
          "The motion-production pipeline demonstration covers the workflow from brief and shot list through edit to channel-formatted delivery.",
          "This spoke is drafted; the creative production hub covers the full offering today.",
        ],
        projectSlugs: ["motion-production-pipeline"],
        publicationState: "Drafted",
      },
    ],
  },
];

// ─────────────────────────────── Helpers ────────────────────────────────────

export const getHub = (slug: string) => SERVICE_HUBS.find((h) => h.slug === slug);

export const getSpoke = (hubSlug: string, spokeSlug: string) =>
  getHub(hubSlug)?.spokes.find((s) => s.slug === spokeSlug);

export const allSpokes = () =>
  SERVICE_HUBS.flatMap((h) => h.spokes.map((s) => ({ hub: h, spoke: s })));
