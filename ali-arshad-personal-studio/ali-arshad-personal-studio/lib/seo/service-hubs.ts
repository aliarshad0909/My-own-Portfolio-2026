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
import type { ServiceSpoke } from "@/lib/seo/service-spoke-types";
import { SPOKES_AI_AND_WEB } from "@/lib/seo/service-spokes-a";
import { SPOKES_CREATIVE_BRAND_SOURCING } from "@/lib/seo/service-spokes-b";

export type { ServiceSpoke } from "@/lib/seo/service-spoke-types";

const ALL_SPOKES: Record<string, ServiceSpoke[]> = {
  ...SPOKES_AI_AND_WEB,
  ...SPOKES_CREATIVE_BRAND_SOURCING,
};

export type ServiceStep = { label: string; detail: string };

export type ServiceHub = {
  /** /services/<slug>. Matches a primaryUrl in the keyword registry. */
  slug: string;
  keywordId: string;
  /** Parent business pillar id matching lib/services.ts. */
  pillarId: string;
  /** Clearly distinguishes primary business-pillar hubs from focused SEO specializations. */
  hubTier: "pillar" | "seo-specialization";
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
    pillarId: "web-development",
    hubTier: "pillar",
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
    projectSlugs: ["pipelineos-crm", "stockflow-inventory", "tessera-clayworks-storefront", "northwind-analytics-dashboard"],
    relatedTools: ["/tools/web-project-estimator"],
    relatedHubs: ["/services/ecommerce-development", "/services/ai-agents", "/services/business-dashboards"],
    faqs: [
      {
        q: "What stack do you build on?",
        a: "Next.js (App Router), React and TypeScript, typically deployed on Vercel. This portfolio, its technical SEO architecture and the locally tested demonstration builds in the work archive run on the same stack.",
      },
      {
        q: "Can you take over an existing React or Next.js codebase?",
        a: "Often, yes, provided the repository is accessible and runs on a stack I work in. Discovery starts with an honest audit of what exists so you know whether refactoring or rebuilding saves more time.",
      },
      {
        q: "How much does a custom web application cost?",
        a: "Every build is scoped and quoted individually rather than from a rigid price sheet. Use the Web Project Estimator on this site for an illustrative planning range, followed by a plain-language written scope after discovery.",
      },
      {
        q: "Do we own the source code, domain and hosting accounts?",
        a: "Yes. The Git repository, deployment account and third-party credentials live directly under your ownership with clear documentation at hand-off.",
      },
      {
        q: "How do you handle technical SEO and Core Web Vitals?",
        a: "Semantic headings, unique metadata, canonical URLs, dynamic sitemaps, accurate JSON-LD structured data and lean asset sizing are built into the architecture from day one rather than patched on after launch.",
      },
    ],
    publicationState: "Published",
    spokes: ALL_SPOKES["web-development"] ?? [],
  },
  {
    slug: "n8n-automation",
    keywordId: "hub-n8n-automation",
    pillarId: "ai-automation",
    hubTier: "seo-specialization",
    icon: "bot",
    title: "n8n Workflow Automation Services & Custom Integrations",
    h1: "n8n workflow automation",
    lead: "Replace repetitive copy-paste work and per-task SaaS bills with self-hostable n8n workflows — engineered with validation, deduplication, retries and human approval where judgement counts.",
    intent: "For founder-led, sales and operations teams who need lead qualification, CRM sync, Google Workspace reporting and cross-app pipelines they can actually inspect and own.",
    problems: [
      "Our team copies data between tools all day",
      "Leads slip through the cracks before anyone follows up",
      "Reports are assembled by hand every week",
      "We tried Zapier and hit its limits",
    ],
    includes: [
      "Process mapping and edge-case specification before building",
      "Modular n8n workflow architecture, webhooks and branching",
      "Tested JavaScript Code nodes for scoring, normalisation and transforms",
      "CRM, Google Workspace, Slack and custom REST API integrations",
      "Dedicated error workflows, retry policies and human approval gates",
      "Exportable JSON, credential checklist and operator documentation",
    ],
    process: [
      { label: "Process audit", detail: "The real workflow, exceptions and edge cases mapped" },
      { label: "Architecture", detail: "Triggers, branches, credentials and human gates" },
      { label: "Build & test", detail: "Workflows built in n8n with verified Code-node logic" },
      { label: "Hand-off", detail: "Deployed, documented and yours to own" },
    ],
    projectSlugs: ["inbound-lead-qualification-workflow"],
    relatedTools: ["/tools/automation-roi-calculator"],
    relatedHubs: ["/services/ai-agents", "/services/business-dashboards", "/services/web-development", "/services/gpu-compute"],
    faqs: [
      {
        q: "Why choose n8n rather than Zapier or Make?",
        a: "n8n can be self-hosted on your own infrastructure, supports full JavaScript and Python Code nodes for non-trivial logic, and does not charge per individual task step. That keeps complex multi-step workflows affordable and inspectable as volume grows.",
      },
      {
        q: "Do we own the workflows and where are they hosted?",
        a: "Yes. Every workflow is handed over as clean, exportable JSON with zero vendor lock-in. You can run it on n8n Cloud or on your own self-hosted Docker server under your own credentials and data boundary.",
      },
      {
        q: "How do you prevent silent failures or bad data entering our CRM?",
        a: "Validation runs at the entry gate so malformed submissions return a clear error rather than polluting your CRM. Downstream API calls use bounded retries, and a dedicated error workflow logs context and alerts your team if a dependency stays down.",
      },
      {
        q: "Can n8n combine deterministic rules with AI models safely?",
        a: "Yes — and the split matters. Schema checks, deduplication, routing thresholds and formatting stay in deterministic code, while LLM steps are scoped to narrow tasks like summarisation or draft preparation with human review before external sends.",
      },
      {
        q: "What can realistically be automated — and what stays human?",
        a: "Repetitive, rule-based steps automate cleanly: webhook intake, enrichment, lead scoring, CRM updates, Google Sheets reporting and Slack alerts. Pricing exceptions, relationship replies and final approvals stay with people by design.",
      },
      {
        q: "How do you decide whether an automation is worth building?",
        a: "Compare weekly manual hours saved (at a realistic automation share, never 100%) against the build cost. The Automation ROI Calculator on this site models payback period from your own numbers before any commitment.",
      },
    ],
    publicationState: "Published",
    spokes: ALL_SPOKES["n8n-automation"] ?? [],
  },
  {
    slug: "ai-agents",
    keywordId: "hub-ai-agents",
    pillarId: "ai-automation",
    hubTier: "seo-specialization",
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
    relatedHubs: ["/services/n8n-automation", "/services/web-development", "/services/gpu-compute"],
    faqs: [
      {
        q: "How do you stop an AI agent from hallucinating policies or prices?",
        a: "By narrowing the job and grounding every response in your own versioned documents. In the Tideline support-agent demonstration, replies are retrieved via inspectable BM25 scoring, quoted verbatim from the source article, and escalated whenever confidence falls below a tuned floor.",
      },
      {
        q: "What is the practical difference between an AI agent and a chatbot?",
        a: "A basic chatbot walks a brittle decision tree; a well-designed agent retrieves context from your knowledge base, extracts structured slots or triggers defined actions (like creating a CRM ticket) and escalates cleanly when outside its boundary.",
      },
      {
        q: "Can an agent qualify sales leads over voice or chat?",
        a: "Yes. The Kestrel voice qualification demonstration captures caller name, fleet size, need and timeline via an explicit state machine — using browser speech where available and degrading honestly to typed chat where it is not.",
      },
      {
        q: "Does every agent require an expensive LLM API?",
        a: "Not always. When deterministic retrieval (BM25) or an explicit slot-filling state machine solves the job with higher auditability and verbatim policy quoting, I recommend that first and reserve LLMs for tasks where language reasoning genuinely helps.",
      },
      {
        q: "How does human hand-off work when the agent cannot answer?",
        a: "The full transcript, captured fields and escalation reason pass into your CRM, helpdesk or Slack channel (often via n8n) so a person picks up with complete context instead of asking the customer to repeat themselves.",
      },
    ],
    publicationState: "Published",
    spokes: ALL_SPOKES["ai-agents"] ?? [],
  },
  {
    slug: "ecommerce-development",
    keywordId: "hub-ecommerce",
    pillarId: "web-development",
    hubTier: "seo-specialization",
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
        q: "Should we use Shopify or build a custom storefront?",
        a: "Whichever genuinely fits your stage and operations. Standard Shopify is faster and cheaper for straightforward catalogues; custom or headless Next.js earns its cost when variant logic, speed, editorial presentation or back-office rules outgrow templates.",
      },
      {
        q: "How do you prevent overselling or discount calculation bugs?",
        a: "Pricing, promotions, shipping thresholds and tax run in integer cents inside unit-tested TypeScript modules outside the UI, and stock is re-validated on submission rather than trusting a stale browser cart.",
      },
      {
        q: "Can we manage products and inventory without touching code?",
        a: "Yes — either via a clean custom product admin (as shown in the Tessera Clayworks build) or by connecting a headless CMS, Shopify backend or ERP API so your team edits catalogues directly.",
      },
      {
        q: "How are payments and security handled?",
        a: "Card processing always stays with established providers like Stripe or Shopify Checkout rather than rolling custom payment handling. Your custom build owns the shopping experience, rules and post-purchase webhooks.",
      },
      {
        q: "Is there a complete demonstration build to inspect?",
        a: "Yes — Tessera Clayworks is a complete demonstration storefront under a fictional ceramics brand covering catalogue filtering, variant previews, cart, three-step simulated checkout and product admin CRUD, backed by 56 automated tests.",
      },
    ],
    publicationState: "Published",
    spokes: [],
  },
  {
    slug: "business-dashboards",
    keywordId: "hub-dashboards",
    pillarId: "web-development",
    hubTier: "seo-specialization",
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
    projectSlugs: ["northwind-analytics-dashboard", "meridian-inventory-operations", "stockflow-inventory"],
    relatedTools: [],
    relatedHubs: ["/services/web-development", "/services/global-sourcing"],
    faqs: [
      {
        q: "Can you build a dashboard on top of our existing databases or spreadsheets?",
        a: "Usually yes — PostgreSQL, Supabase, REST APIs, Shopify, Stripe, HubSpot or structured exports. Discovery audits where the data lives today and how cleanly it reconciles before designing the interface.",
      },
      {
        q: "How do you make sure KPI cards and tables never contradict each other?",
        a: "Every headline figure, chart series and table row derives from one shared pure-TypeScript analytics layer. Because the UI computes nothing independently, contradictions are ruled out by construction and verified by unit tests.",
      },
      {
        q: "Why use an append-only ledger for inventory operations?",
        a: "Storing a mutable quantity column leads to silent drift whenever a double-click, failed write or partial receipt happens. Recording every receipt, shipment and transfer as an immutable movement makes every balance auditable.",
      },
      {
        q: "Are the charts accessible and exportable?",
        a: "Yes. Charts are rendered as crisp custom SVG paired with visually hidden data tables for screen readers, and operational tables support exact CSV export from the active filtered view.",
      },
      {
        q: "Are there live demonstration builds to review?",
        a: "Yes — Northwind (revenue analytics over 7,146 generated orders) and Meridian (append-only inventory and purchasing operations over 1,265 movements) both demonstrate this architecture end to end.",
      },
    ],
    publicationState: "Published",
    spokes: ALL_SPOKES["business-dashboards"] ?? [],
  },
  {
    slug: "branding",
    keywordId: "hub-branding",
    pillarId: "brand-growth",
    hubTier: "pillar",
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
        q: "Do I get more than a logo file?",
        a: "Yes — a usable brand system: lockups, WCAG-checked colour palette, modular typography, usage rules and real applied templates across web, social and email, as demonstrated in the Halcyon Brand System build.",
      },
      {
        q: "Can you handle ongoing social media, email and content coordination?",
        a: "Yes. Alongside visual systems, I bring over two years of hands-on brand management for US-based brands, plus active HubSpot Social Media and Google Ads AI-Powered Performance Ads certifications.",
      },
      {
        q: "Why do you measure WCAG colour contrast during branding?",
        a: "Brand colours often look great on a pitch deck and fail legibility once placed on a website or email. Measuring relative luminance upfront ensures your palette works for real readers and developers.",
      },
      {
        q: "Can you build the website and HTML email templates too?",
        a: "Yes. Brand systems, Next.js web builds and client-safe HTML email templates sit in the same studio so your design tokens stay aligned from launch day onward.",
      },
      {
        q: "Do you guarantee specific ad ROAS or follower counts?",
        a: "No — honest marketing work never promises fixed algorithm or ad outcomes. What I deliver is disciplined brand positioning, clean creative execution, consistent publishing and transparent reporting.",
      },
    ],
    publicationState: "Published",
    spokes: ALL_SPOKES["branding"] ?? [],
  },
  {
    slug: "global-sourcing",
    keywordId: "hub-sourcing",
    pillarId: "global-sourcing",
    hubTier: "pillar",
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
    projectSlugs: ["lantern-sourcing-platform", "stockflow-inventory"],
    relatedTools: ["/tools/landed-cost-calculator"],
    relatedHubs: ["/services/business-dashboards"],
    faqs: [
      {
        q: "Are you a licensed customs broker or freight forwarder?",
        a: "No. This service covers sourcing coordination, supplier research, comparison frameworks and landed-cost modelling. Legal HS classification, import compliance and customs clearance always remain with a licensed broker.",
      },
      {
        q: "What supply-chain background is this grounded in?",
        a: "A Bachelor of Business Administration (BBA) specializing in Supply Chain Management, supported directly by the Lantern supplier-sourcing and Meridian inventory-operations software demonstrations.",
      },
      {
        q: "Why compare suppliers on landed cost instead of unit price?",
        a: "Unit price excludes freight (often billed on volumetric weight), import duty, insurance and port handling. Changing an order from EXW to DDP or adjusting carton volume can completely reverse which supplier is cheapest.",
      },
      {
        q: "Do I keep direct relationships with the suppliers?",
        a: "Yes. Every shortlist includes direct contact details, structured quote comparisons and transparent scoring so your business owns the supplier relationship rather than paying hidden brokerage markups.",
      },
      {
        q: "Can you also build custom procurement or inventory tracking software?",
        a: "Yes — if your SKU count has outgrown spreadsheets, I can build a custom Next.js/TypeScript comparison or inventory ledger tool tailored to your exact workflows.",
      },
    ],
    publicationState: "Published",
    spokes: ALL_SPOKES["global-sourcing"] ?? [],
  },
  {
    slug: "creative-production",
    keywordId: "hub-creative-production",
    pillarId: "creative-production",
    hubTier: "pillar",
    icon: "clapperboard",
    title: "Creative Production Services: Video Editing, Motion & 3D",
    h1: "Creative production",
    lead: "Video editing, motion graphics, social advertising creatives and scripted Blender 3D product visualisation — delivered channel-ready and web-optimised.",
    intent: "For product brands and founders who need clear, brand-consistent visual content without agency turnaround or bloated media files.",
    problems: [
      "Our product is hard to explain in a photo",
      "We need launch content fast",
      "Our social ads look homemade",
      "We have no product photography",
    ],
    includes: [
      "Video editing and short-form social ad cutdowns (9:16, 4:5, 16:9)",
      "Motion graphics, product explainers and animated brand assets",
      "Blender 3D product visualisation, built as reproducible scene code",
      "Web video preparation (H.264 +faststart, VP9, silent hover previews, posters)",
      "Channel-formatted campaign graphics aligned with your brand tokens",
    ],
    process: [
      { label: "Brief", detail: "Product, message, channels" },
      { label: "Produce", detail: "3D, edit, motion" },
      { label: "Review", detail: "Rounds with clear feedback" },
      { label: "Deliver", detail: "Final assets, formatted per channel" },
    ],
    projectSlugs: ["motion-production-pipeline"],
    relatedTools: [],
    relatedHubs: ["/services/branding", "/services/ecommerce-development", "/services/gpu-compute"],
    faqs: [
      {
        q: "Can you produce 3D product visuals instead of a physical photo shoot?",
        a: "Yes — rendering from a 3D model lets you generate consistent angles, material colourways and turntables without booking repeat studio shoots. The scene architecture behind it is built as reproducible Blender/Python code (three material presets, six camera angles and a 120-frame turntable, covered by 20 tests); finished renders are produced per engagement on a Blender workstation.",
      },
      {
        q: "Why is there no embedded showreel on this page yet?",
        a: "Because earlier client edits are still being cleared for public listing and no standalone Blender render is published in this repository yet. Rather than display stock footage or unattributed frames, the studio keeps that slot transparently labelled until cleared work is published.",
      },
      {
        q: "What formats and aspect ratios do you deliver?",
        a: "Everything your channels need: 9:16 for Reels/TikTok/Shorts, 4:5 for paid feeds, 16:9 for YouTube and web, plus web-optimised H.264 (+faststart), VP9, poster images and silent hover previews prepared through a verified ffmpeg pipeline.",
      },
      {
        q: "What do you need from us to start a video or 3D project?",
        a: "For video and social ads: your brief, brand guidelines and raw footage or screen captures. For 3D visualisation: CAD files (if available), dimensions, reference photos and finish/material specs.",
      },
      {
        q: "Can creative assets match our website and brand system directly?",
        a: "Yes — because brand systems, creative production and web engineering sit in the same studio, typography, colour contrast and video compression standards stay aligned from start to finish.",
      },
    ],
    publicationState: "Published",
    spokes: ALL_SPOKES["creative-production"] ?? [],
  },
];

// ─────────────────────────────── Helpers ────────────────────────────────────

export const getHub = (slug: string) => SERVICE_HUBS.find((h) => h.slug === slug);

export const getSpoke = (hubSlug: string, spokeSlug: string) =>
  getHub(hubSlug)?.spokes.find((s) => s.slug === spokeSlug);

export const allSpokes = () =>
  SERVICE_HUBS.flatMap((h) => h.spokes.map((s) => ({ hub: h, spoke: s })));
