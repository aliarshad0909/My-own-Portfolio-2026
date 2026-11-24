import type { GameSlug } from "@/lib/games/catalog";
import { EXPANSION_PROJECTS_A, type ConceptVisualSpec } from "@/lib/projects-expansion-a";
import { EXPANSION_PROJECTS_B } from "@/lib/projects-expansion-b";
import { EXPANSION_PROJECTS_C } from "@/lib/projects-expansion-c";
import { GAME_WORK_ENTRIES } from "@/lib/projects-games";

const REPO_TREE_BASE =
  "https://github.com/aliarshad0909/My-own-Portfolio-2026/tree/feature/studio-polish-curated-work";

const CORE_SOURCE_DIR: Record<string, string> = {
  "pipelineos-crm": "apps/pipelineos",
  "stockflow-inventory": "apps/stockflow",
  "tessera-clayworks-storefront": "demos/commerce-storefront",
  "northwind-analytics-dashboard": "demos/analytics-dashboard",
  "tideline-support-agent": "demos/support-agent",
  "kestrel-voice-sales-agent": "demos/voice-sales-agent",
  "inbound-lead-qualification-workflow": "demos/n8n-lead-automation",
  "meridian-inventory-operations": "demos/supply-chain",
  "lantern-sourcing-platform": "demos/sourcing-platform",
  "blender-product-visualisation": "demos/blender-product-viz",
  "motion-production-pipeline": "demos/motion-production",
  "halcyon-brand-system": "demos/brand-system",
  "ledgerlight-block-explorer": "demos/chain-explorer",
  "sentryline-security-posture": "demos/security-dashboard",
};

/**
 * Central project records.
 * Add, edit or remove entries here — the homepage, /work, /work/[slug],
 * /case-studies and /case-studies/[slug] all read from this file.
 *
 * Honesty rules baked into the model:
 *   - `projectType` always says how the work came about (own work, concept, or
 *     an adaptation of someone else's open-source project).
 *   - `status` says how finished it is. Only "Published" and verified
 *     "Demo Ready" builds are indexed by search engines and listed in the sitemap.
 *     "Concept", "Sample Scenario", "Prototype", "Planned", and "In Development"
 *     stay noindex so search indices never receive unbuilt concept pages.
 *   - `attribution` is required for every Open-Source Adaptation.
 *   - `usesSampleMedia` marks any card whose imagery is not real project work.
 */

export const PROJECT_CATEGORIES = [
  "Creative Production",
  "3D & Motion",
  "Branding & Marketing",
  "Web & Software",
  "AI Automation",
  "Business Solutions",
  "Games & Experiments",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/**
 * Professional Work      — paid or employed work Ali genuinely contributed to.
 * Original Concept       — built from scratch by Ali; the scenario may be fictional, the software is real.
 * Open-Source Adaptation — built on someone else's licensed project; see `attribution`.
 * Personal Experiment    — self-initiated browser game or interactive lab built out of personal interest.
 */
export type ProjectType =
  | "Professional Work"
  | "Original Concept"
  | "Open-Source Adaptation"
  | "Personal Experiment";

/**
 * Planned             — scoped but not started. Not indexed, not shown in the gallery.
 * In Development      — being built. Not indexed.
 * Demo Ready          — built and locally tested in this repository; NOT publicly deployed unless `liveUrl` is set.
 * Prototype           — built runnable prototype verified locally in apps/ or project-lab/. Not indexed.
 * Playable Experiment — playable browser game experiment in /games/[slug]. Not indexed under /work/*.
 * Concept             — illustrative architecture concept + small local workflow slice. Not indexed.
 * Sample Scenario     — illustrative fictional business brief + architecture scope. Not indexed.
 * Verified            — a real professional engagement confirmed with the client, including naming permission.
 * Published           — live, written up, and approved for public listing. Indexed.
 */
export type ProjectStatus =
  | "Planned"
  | "In Development"
  | "Demo Ready"
  | "Prototype"
  | "Playable Experiment"
  | "Concept"
  | "Sample Scenario"
  | "Verified"
  | "Published";

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectMedia =
  | ({ type: "image" } & ProjectImage)
  | { type: "video"; src: string; poster?: string; alt: string };

/** Required whenever `projectType` is "Open-Source Adaptation". */
export type Attribution = {
  /** Upstream project name, e.g. "Medusa". */
  project: string;
  /** Upstream repository or homepage. */
  url: string;
  /** SPDX identifier, e.g. "MIT", "Apache-2.0", "BSD-2-Clause". */
  license: string;
  licenseUrl: string;
  /** Who holds copyright upstream. */
  copyright: string;
  /** What the original provides versus what was changed here. */
  originalWork: string;
  modifications: string[];
};

/** A decision worth explaining, with the reasoning rather than just the choice. */
export type Decision = { title: string; text: string };

export type CaseStudy = {
  /** Client or project background. */
  background?: string;
  /** Problem or challenge. */
  challenge?: string;
  /** What the project set out to do — scope, not outcomes. */
  objectives?: string[];
  /** Strategy and approach. */
  approach?: string;
  /** Features that are genuinely implemented and working. Never aspirational. */
  features?: string[];
  /**
   * Engineering and creative decisions: architecture, data modelling, interface
   * design, error handling, state, accessibility, testing, automation logic.
   */
  decisions?: Decision[];
  /** Production or development process — one entry per step. */
  process?: string[];
  /** What was delivered. */
  solution?: string;
  /**
   * Verified outcomes only. For demonstrations, describe capabilities that were
   * tested — never invent commercial metrics.
   */
  results?: string[];
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  /** Optional search-intent-optimized title for the case study metadata. */
  seoTitle?: string;
  /** Optional concise meta description for the case study page. */
  seoDescription?: string;
  /** Only name a client with their written permission. */
  client?: string;
  categories: ProjectCategory[];
  tags: string[];
  /** e.g. "2026". Omit when not confirmed. */
  year?: string;
  summary: string;
  projectType: ProjectType;
  status: ProjectStatus;
  /** True when the cover or gallery uses sample artwork rather than real work. */
  usesSampleMedia?: boolean;
  /** Ali's role in one line. */
  role: string;
  /** What Ali personally did — be specific and truthful. */
  contribution: string[];
  /** Languages, frameworks and tools actually used. */
  technologies: string[];
  /** Shown in "Selected Work" on the homepage. */
  featured: boolean;
  cover: ProjectImage;
  /** Optional muted preview clip, e.g. /videos/project-slug.mp4 */
  previewVideo?: string;
  gallery: ProjectMedia[];
  /** Live deployment, once one exists. */
  liveUrl?: string;
  /** Playable internal route for Games & Experiments entries (e.g. /games/signal-link). */
  playUrl?: string;
  /** Linked game slug for rendering original GameCoverArt on /work. */
  gameSlug?: GameSlug;
  /** Public source code URL pointing to an actual folder/file in this repository. */
  sourceUrl?: string;
  /** Verified relative repository path (e.g. apps/pipelineos, demos/support-agent, project-lab/...). */
  sourceRepoPath?: string;
  /** Explicit engineering or scope limitations shown transparently on the detail page. */
  limitations?: string;
  /** Optional AI-generated architectural concept visual explicitly labeled as non-screenshot art. */
  generatedVisual?: { src: string; alt: string; label: string };
  attribution?: Attribution;
  /** Optional technical architecture diagram shown inside the project / case study write-up. */
  architectureDiagram?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption: string;
  };
  /** Optional interactive demo credentials and deployment blueprint details. */
  demoAccess?: {
    deploymentTarget: string;
    demoEmail: string;
    demoPassword: string;
    localRunCommand: string;
    hostingNote: string;
  };
  /** Optional mobile companion app showcase rendered under #mobile-preview. */
  mobilePreview?: {
    headline: string;
    summary: string;
    distributionNote: string;
    interactiveWebUrl?: string;
    androidApkUrl?: string;
    techBadges: string[];
    screens: (ProjectImage & { label: string })[];
  };
  /** True for the 66 portfolio expansion showcases (prototypes, concepts, scenarios). */
  isCatalogExpansion?: boolean;
  /** Substantiated studio niche label for the 80-project showcase directory. */
  nicheLabel?: string;
  /** Direct published service/niche paths linked from /work/[slug]. */
  relatedServicePaths?: string[];
  /** Direct free business calculator paths linked from /work/[slug]. */
  relatedToolPaths?: string[];
  /** Bespoke architectural SVG blueprint metadata for expansion showcases. */
  conceptVisual?: ConceptVisualSpec;
  /** Presence of this object lists core builds under /case-studies. */
  caseStudy?: CaseStudy;
};

const COMMERCE: Project = {
  id: "p01",
  slug: "tessera-clayworks-storefront",
  title: "Tessera Clayworks: E-Commerce Storefront",
  categories: ["Web & Software", "Branding & Marketing"],
  tags: ["Storefront", "Cart & checkout", "Admin CRUD", "TypeScript", "Accessibility"],
  year: "2026",
  summary:
    "A complete demonstration storefront for a fictional ceramics studio: catalogue with working filters, product variants, cart, simulated checkout and a product admin that writes back to the shop.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Designed the brand, layout and interface, separate from this portfolio's visual identity",
    "Built the catalogue, filtering, sorting and search",
    "Implemented the cart, promotions, shipping rules and tax estimate in integer cents",
    "Built the simulated checkout with client and server-grade validation and stock enforcement",
    "Built the product admin with create, edit and delete, validation and live preview",
    "Drew every product illustration in code as SVG, with no stock photography",
    "Wrote 18 unit tests and a 38-check browser suite covering the shopping journeys",
  ],
  technologies: ["TypeScript", "React 19", "esbuild", "CSS", "Node.js test runner", "Playwright"],
  featured: true,
  cover: {
    src: "/images/projects/commerce/cover.webp",
    alt: "Tessera Clayworks storefront homepage with a vase, mug and bowl illustration",
    width: 1600,
    height: 900,
  },
  gallery: [
    { type: "image", src: "/images/projects/commerce/shop.webp", alt: "Shop page with category, glaze and price filters applied", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/product.webp", alt: "Product page showing glaze and size variants with stock state", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/cart.webp", alt: "Cart with quantity steppers, a promotion code applied and an order summary", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/checkout.webp", alt: "Checkout with delivery details, shipping options and a simulated payment notice", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/admin.webp", alt: "Product admin with an edit form, stock fields and a live illustration preview", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/order.webp", alt: "Order confirmation screen showing the demo order number and totals", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/mobile.webp", alt: "The shop and product pages on a phone-sized screen", width: 1382, height: 1420 },
  ],
  caseStudy: {
    background:
      "Tessera Clayworks is a fictional small-batch ceramics studio invented for this project. The brief was to build the storefront such a business would actually need, so the work shows commerce mechanics rather than a styled template.",
    challenge:
      "Most portfolio storefronts are a grid of product photos with buttons that do nothing. The hard parts of commerce are the ones that are usually faked: filters that really narrow a catalogue, variants that change price and availability, a cart that cannot oversell, and totals that stay correct when a discount pushes an order back below the free-shipping threshold.",
    approach:
      "I separated the commerce rules from the interface. Pricing, cart, promotions, shipping, tax and checkout live in plain TypeScript modules with no React imports, so they can be unit tested directly and reused by a real backend later. Every amount is held in integer cents, so no total is subject to floating-point drift. The interface is a thin layer over those rules.",
    process: [
      "Modelled the domain: products, glaze and size variants, per-variant stock, cart lines, promotions and orders.",
      "Wrote the pricing and cart rules first, with 18 unit tests covering stock caps, discount interaction with the free-shipping threshold, and order creation.",
      "Designed a brand distinct from this portfolio, using warm paper, forest green and terracotta, so the demo reads as its own business.",
      "Drew all 8 product shapes as parametric SVG, tinted at runtime by the selected glaze, so changing a variant visibly changes the product.",
      "Built the storefront: catalogue, filters, search, sort, product pages, wishlist, cart and a three-step checkout.",
      "Built the product admin so the catalogue is genuinely editable, with validation, confirm-before-delete and a live preview.",
      "Wrote a 38-check Playwright suite covering the shopping journeys end to end, then fixed the two real defects it surfaced.",
    ],
    solution:
      "A static, deployable storefront of roughly 2,400 lines of TypeScript. Filters, cart, checkout, order history and admin all work against the same in-browser state, so an order placed in the shop reduces the stock the admin reports. Nothing is faked at the interface layer: where a real store would call a payment provider, the demo says so plainly instead of showing a false success.",
    objectives: [
      "Build the commerce mechanics that portfolio storefronts usually fake: real filtering, real variants, a cart that cannot oversell.",
      "Keep pricing, promotions, shipping and tax correct under every combination, including a discount that drops an order back below the free-shipping threshold.",
      "Make the catalogue genuinely editable through an admin, so the data is not a frozen fixture.",
      "Prove the shopping journeys work end to end rather than asserting they do.",
    ],
    features: [
      "Catalogue with category, glaze and price filters, search and sorting",
      "Product pages with glaze and size variants that change price, stock and the illustration",
      "Cart with quantity steppers, stock caps, promotion codes and a live order summary",
      "Three-step checkout with field-level validation, shipping options and a simulated payment",
      "Product admin with create, edit, delete, validation, confirm-before-delete and live preview",
      "Wishlist, order confirmation and an order history view",
    ],
    decisions: [
      {
        title: "Commerce rules live outside React",
        text: "Pricing, cart, promotions, shipping, tax and checkout are plain TypeScript modules with no React imports. They can be unit tested directly and handed to a real backend later without rewriting them.",
      },
      {
        title: "Every amount is an integer in cents",
        text: "Money is never a float. A catalogue price, a percentage discount and a tax estimate all compose without drift, which is why the totals in the tests are exact rather than approximate.",
      },
      {
        title: "Product art is drawn in code",
        text: "All eight product shapes are parametric SVG tinted at runtime by the selected glaze, so changing a variant visibly changes the product. No stock photography, and no gap between what the data says and what you see.",
      },
      {
        title: "Stock is enforced on the server path too",
        text: "The checkout re-validates stock at submission rather than trusting the cart, so a quantity edited in another tab cannot oversell.",
      },
    ],
    results: [
      "18 unit tests and 38 browser checks pass, covering catalogue, cart, checkout, admin CRUD and keyboard access.",
      "Verified no horizontal overflow at 360, 390, 768, 1024 and 1440 px, with interactive targets at least 40 px.",
      "Testing caught two genuine defects: a hidden-label rule that widened the page on mobile, and colour swatches that rendered blank. Both were fixed and are now covered by tests.",
      "Production bundle is 240 KB of JavaScript and 14 KB of CSS, with no UI framework, icon library or image dependencies.",
    ],
  },
};


const ANALYTICS: Project = {
  id: "p02",
  slug: "northwind-analytics-dashboard",
  title: "Northwind: Revenue Analytics Dashboard",
  categories: ["Web & Software", "Business Solutions"],
  tags: ["Analytics", "Data visualisation", "SVG charts", "CSV export", "TypeScript"],
  year: "2026",
  summary:
    "An analytics dashboard over 7,146 generated orders: period comparison, revenue trends, channel and category breakdowns, and a sortable product table with CSV export. Every chart is hand-drawn SVG with a table alternative for screen readers.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Wrote the deterministic data generator: 24 products and roughly 7,100 orders across 18 months, seeded so every run produces the same figures",
    "Built the analytics layer: period summaries, previous-period comparison, time bucketing, grouping and product performance",
    "Drew the revenue chart, breakdown bars and sparklines as SVG by hand, with no charting library",
    "Gave every chart a visually hidden data table, so the figures are available to screen readers rather than locked in a picture",
    "Implemented CSV export from the same data the table renders",
    "Wrote 15 unit tests over the analytics functions and 14 browser checks over the interface",
  ],
  technologies: ["TypeScript", "React 19", "SVG", "esbuild", "Node.js test runner", "Playwright"],
  featured: true,
  usesSampleMedia: false,
  cover: {
    src: "/images/projects/analytics-dashboard/cover.webp",
    alt: "Northwind dashboard showing revenue, orders and average order value with a trend chart",
    width: 1500,
    height: 1055,
  },
  gallery: [
    { type: "image", src: "/images/projects/analytics-dashboard/detail.webp", alt: "Channel and category breakdowns beside a sortable product performance table", width: 1500, height: 1055 },
    { type: "image", src: "/images/projects/analytics-dashboard/mobile.webp", alt: "The dashboard stacked into a single column on a phone-sized screen", width: 780, height: 1640 },
  ],
  caseStudy: {
    background:
      "Northwind is an invented wholesaler. The dashboard exists to show how a reporting interface should behave when the numbers are real and have to agree with each other, rather than being a layout exercise over a static JSON blob.",
    challenge:
      "Dashboard demos usually hard-code their figures, so nothing can disagree and nothing can be wrong. The interesting problems only appear once the data is generated: comparisons against the correct previous period, buckets that do not drop the final partial week, and a headline figure that still matches the table beneath it after a filter is applied.",
    approach:
      "A seeded linear congruential generator produces the orders, so the dataset is identical on every load and tests can assert exact values against it. The analytics functions are pure and separately testable; the interface only renders what they return.",
    process: [
      "Built the generator with a fixed seed, modelling seasonality, channel mix and a customer base that grows month over month.",
      "Wrote the analytics layer (summarise, delta, previousPeriod, bucketOf, timeSeries, groupBy, productPerformance) with unit tests asserting exact figures.",
      "Drew the chart components as SVG, sizing and labelling axes from the data rather than from fixed pixel values.",
      "Added a visually hidden table alongside every chart so the same figures are reachable without sight of the graphic.",
      "Wrote the browser suite, which caught the generator defect described below.",
    ],
    solution:
      "A dashboard where the headline tiles, charts, breakdowns and product table are all derived from one dataset, so they cannot contradict one another. Changing the period or granularity recomputes everything from source.",
    objectives: [
      "Generate a dataset substantial enough that the analytics have something real to be wrong about.",
      "Make every figure on the page derive from one source, so the headline tiles and the table cannot disagree.",
      "Compare each period against the correct previous period rather than an arbitrary offset.",
      "Keep the charts readable without sight of them.",
    ],
    features: [
      "Period selector with correct previous-period comparison and percentage deltas",
      "Revenue trend chart with day, week and month granularity",
      "Channel and category breakdowns driven by the same filters",
      "Sortable product performance table with CSV export",
      "Hand-drawn SVG charts with a visually hidden data table behind each one",
    ],
    decisions: [
      {
        title: "A seeded generator, not a fixture file",
        text: "A linear congruential generator with a fixed seed produces the same ~7,100 orders on every load. That makes exact assertions possible in tests while keeping the data varied enough to exercise the grouping and bucketing code.",
      },
      {
        title: "Pure analytics functions",
        text: "summarise, delta, previousPeriod, bucketOf, timeSeries, groupBy and productPerformance take data and return data. The interface renders what they return and computes nothing itself, so a disagreement between a tile and a table is impossible by construction.",
      },
      {
        title: "No charting library",
        text: "The charts are SVG written for this project. It keeps the bundle small, and it means the axis labels and tick spacing are computed from the data rather than from a library's defaults.",
      },
      {
        title: "Every chart has a table",
        text: "Each chart ships with a visually hidden table of the same figures. A screen reader gets the numbers rather than an alt attribute summarising them.",
      },
    ],
    results: [
      "15 unit tests and 14 browser checks pass against the generated dataset.",
      "Testing caught a real generator defect: every customer was created in the first months, so \"new customers\" read 0 and −100% for every later period. Fixed with a customer pool that grows over time.",
      "Several of my own test expectations were wrong, and the application was right: the dataset is 7,146 orders, not the 8,000+ I had assumed. The tests were corrected to the real figures rather than the figures being nudged to fit.",
      "No charting library: the production bundle carries no chart dependency at all.",
    ],
  },
};

const SUPPORT_AGENT: Project = {
  id: "p03",
  slug: "tideline-support-agent",
  title: "Tideline: Knowledge-Base Support Agent",
  categories: ["AI Automation", "Web & Software"],
  tags: ["Retrieval", "BM25", "Knowledge base", "Escalation", "TypeScript"],
  year: "2026",
  summary:
    "A support agent that answers from a 24-article knowledge base using BM25 retrieval, quotes the source article verbatim, and hands off to a human when its confidence is below the floor. It is not a language model and does not claim to be.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Implemented Okapi BM25 ranking from the formula, with title boosting and a tuned confidence floor",
    "Built bidirectional synonym expansion so \"refund\" and \"money back\" reach the same articles",
    "Wrote the 24-article knowledge base and the conversation layer around it",
    "Made every sourced reply quote its article verbatim, with a test asserting the agent never paraphrases a source into something the article does not say",
    "Built the escalation path for queries that fall below the confidence floor, rather than letting the agent guess",
    "Wrote 43 unit tests and 17 browser checks",
  ],
  technologies: ["TypeScript", "React 19", "esbuild", "Node.js test runner", "Playwright"],
  featured: true,
  cover: {
    src: "/images/projects/support-agent/cover.webp",
    alt: "Tideline support agent with suggested questions and a knowledge base panel",
    width: 1500,
    height: 1055,
  },
  gallery: [
    { type: "image", src: "/images/projects/support-agent/conversation.webp", alt: "A conversation where the agent answers a refund question and cites the source article", width: 1500, height: 1055 },
    { type: "image", src: "/images/projects/support-agent/mobile.webp", alt: "The agent on a phone-sized screen", width: 780, height: 1640 },
  ],
  caseStudy: {
    background:
      "Tideline is an invented outdoor-equipment retailer. The agent exists to show retrieval and escalation behaviour, which is where most support automation actually succeeds or fails.",
    challenge:
      "The failure mode that matters in support automation is a confident wrong answer. A system that answers everything will answer badly; a system that answers nothing is useless. The real work is the boundary: knowing when retrieval has not found the answer.",
    approach:
      "Lexical retrieval rather than a language model, deliberately: BM25 scores are inspectable, the confidence floor is a number you can tune, and the agent can only ever say what an article says, because replies are quoted from the source. Where the score is below the floor, it escalates instead of improvising.",
    process: [
      "Implemented BM25 with K1 1.4 and B 0.72, plus a title boost so an article titled for the question outranks one that merely mentions it.",
      "Built synonym expansion as a bidirectional map, so every word in a synonym group reaches the others rather than only mapping one way.",
      "Set a confidence floor and tested the boundary in both directions: known questions answer, out-of-scope questions escalate.",
      "Wrote a test asserting every sourced reply is verbatim article text, so the agent cannot drift into inventing support policy.",
    ],
    solution:
      "An agent that answers in-scope questions with sourced, quoted text, shows which article it used, and escalates rather than guessing when nothing scores highly enough.",
    objectives: [
      "Answer in-scope support questions from a knowledge base without inventing policy.",
      "Know when retrieval has not found the answer, and escalate instead of guessing.",
      "Make the retrieval inspectable, so a wrong answer can be diagnosed rather than re-prompted.",
    ],
    features: [
      "BM25 retrieval over a 24-article knowledge base with title boosting",
      "Bidirectional synonym expansion, so 'refund' and 'money back' reach the same articles",
      "Replies quoted verbatim from the source article, with the article shown alongside",
      "A confidence floor that routes low-scoring queries to a human hand-off",
      "Suggested starter questions and a visible knowledge-base panel",
    ],
    decisions: [
      {
        title: "Lexical retrieval, not a language model",
        text: "BM25 scores are numbers you can inspect and a floor you can tune. The interface says so plainly, because a visitor should know what they are looking at.",
      },
      {
        title: "The agent can only say what an article says",
        text: "Sourced replies are verbatim article text. A test asserts this, which removes the failure mode that matters most in support automation: a confident answer that invents policy.",
      },
      {
        title: "Synonyms expand in both directions",
        text: "The first implementation mapped one way only, so a query using the less common word found nothing. Each group now maps every word to every other.",
      },
      {
        title: "Escalation is a feature, not a fallback",
        text: "Below the confidence floor the agent hands off rather than returning its best weak match. A system that answers everything answers badly.",
      },
    ],
    results: [
      "43 unit tests and 17 browser checks pass, including the verbatim-source assertion and the escalation boundary.",
      "The interface states plainly that this is lexical retrieval, not a language model, so no one mistakes what they are looking at.",
      "A test expectation of mine was wrong about the stemmer's output; the stemmer was right and the test was corrected.",
    ],
  },
};

const VOICE_AGENT: Project = {
  id: "p04",
  slug: "kestrel-voice-sales-agent",
  title: "Kestrel: Voice Qualification Agent",
  categories: ["AI Automation", "Business Solutions"],
  tags: ["Web Speech API", "Dialogue state machine", "Slot filling", "Accessibility"],
  year: "2026",
  summary:
    "A voice-driven qualification agent: a deterministic slot-filling state machine with speech input and output where the browser supports it, and an honest degraded mode where it does not.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Designed the dialogue as an explicit state machine with required and optional slots, so its behaviour is inspectable rather than emergent",
    "Wrote the extraction layer: names, numbers written as words, timeframes, and intent phrases",
    "Added a loop guard: an unrecognised answer to an optional slot records \"not given\" and moves on, while a required slot is re-asked once, then hands off",
    "Integrated the Web Speech API with capability detection, a listening timeout and voice-count checks",
    "Made the interface degrade honestly to typed input when speech is unavailable, rather than appearing to listen and never responding",
    "Wrote 28 unit tests and 20 browser checks",
  ],
  technologies: ["TypeScript", "React 19", "Web Speech API", "esbuild", "Node.js test runner", "Playwright"],
  featured: false,
  cover: {
    src: "/images/projects/voice-sales-agent/cover.webp",
    alt: "Kestrel voice agent showing the conversation, captured answers and speech status",
    width: 1500,
    height: 1055,
  },
  gallery: [
    { type: "image", src: "/images/projects/voice-sales-agent/mobile.webp", alt: "The voice agent on a phone-sized screen", width: 780, height: 1640 },
  ],
  caseStudy: {
    background:
      "Kestrel is an invented fleet-services company. The agent qualifies an inbound enquiry by filling a small set of slots: who is calling, fleet size, what they need, and how soon.",
    challenge:
      "Browser speech support is inconsistent and fails in ways that look like nothing happening. Headless Chromium, for example, exposes the speech APIs, reports zero voices and never returns a recognition result: an interface that trusts the capability check will simply hang.",
    approach:
      "The dialogue is deterministic and fully testable without any speech at all; speech is an input and output layer on top of it. Capability detection checks for a non-empty voice list, not merely for the API's existence, and recognition has an eight-second timeout so a silent failure surfaces as a message rather than a hang.",
    process: [
      "Modelled the slots and transitions, then tested the state machine directly with text input.",
      "Built extraction with regular expressions, testing each against phrasings people actually use.",
      "Added the speech layer last, behind capability detection.",
      "Ran the browser suite in headless Chromium, which exposed the zero-voices case described above.",
    ],
    solution:
      "A qualification flow that completes by voice where speech works and by typing where it does not, and that says which mode it is in instead of pretending.",
    objectives: [
      "Qualify an inbound enquiry by filling a small set of slots, by voice where the browser allows it.",
      "Degrade honestly to typed input where speech is unavailable, rather than appearing to listen.",
      "Keep the dialogue inspectable and testable without any speech at all.",
    ],
    features: [
      "Deterministic slot-filling state machine with required and optional slots",
      "Extraction of names, numbers written as words, timeframes and intent phrases",
      "Speech recognition and synthesis via the Web Speech API, behind capability detection",
      "An eight-second listening timeout so a silent failure surfaces as a message",
      "A visible transcript and a live summary of the answers captured so far",
    ],
    decisions: [
      {
        title: "An explicit state machine",
        text: "The dialogue is a set of states and transitions rather than emergent behaviour, so it can be driven by text in tests and its paths enumerated.",
      },
      {
        title: "Capability detection checks for voices, not just APIs",
        text: "Headless Chromium exposes the speech APIs, reports zero voices and never returns a result. Checking that getVoices() is non-empty is what separates 'supported' from 'present but useless'.",
      },
      {
        title: "A loop guard on every slot",
        text: "An unrecognised answer to an optional slot records 'not given' and moves on; a required slot is re-asked once and then hands off. The first version re-asked for ever.",
      },
      {
        title: "Extraction tested against real phrasings",
        text: "Four genuine defects came out of this: a greedy pattern matching a bare 'a', 'for now' read as 'immediately', a case-sensitive name pattern, and plurals breaking a word boundary.",
      },
    ],
    results: [
      "28 unit tests and 20 browser checks pass.",
      "Testing found four genuine extraction defects: a greedy pattern matching a bare \"a\", \"for now\" being read as \"immediately\", a case-sensitive name pattern missing lowercase \"i'm\", and plurals breaking a word boundary.",
      "It also found an infinite loop: an unrecognised answer to an optional slot re-asked the same question for ever. Now bounded.",
      "The interface never claims to be listening when the browser cannot listen.",
    ],
  },
};

const N8N: Project = {
  id: "p05",
  slug: "inbound-lead-qualification-workflow",
  title: "Inbound Lead Qualification: n8n Workflow",
  categories: ["AI Automation", "Business Solutions"],
  tags: ["n8n", "Workflow automation", "Lead scoring", "Deduplication"],
  year: "2026",
  summary:
    "A 15-node n8n workflow that validates, scores, deduplicates and routes inbound leads. The JavaScript inside its Code nodes is extracted and executed by a 22-test suite, so the logic is verified rather than merely drawn.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole author",
  contribution: [
    "Designed and wrote the 15-node workflow as importable n8n JSON",
    "Wrote the validation, scoring, deduplication and routing logic in the Code nodes",
    "Built a test harness that reads the workflow file, extracts each Code node's JavaScript and executes it with stubbed n8n globals, so the tests run the real code rather than a copy",
    "Wrote 22 tests covering a hot lead, a cold lead, an invalid submission and the deduplication window",
    "Drew the workflow diagram as SVG and documented the required credentials by name only",
  ],
  technologies: ["n8n", "JavaScript", "Node.js test runner", "SVG"],
  featured: false,
  cover: {
    src: "/images/projects/n8n-lead-automation/workflow-diagram.svg",
    alt: "Diagram of the 15-node inbound lead qualification workflow",
    width: 1200,
    height: 700,
  },
  gallery: [],
  caseStudy: {
    background:
      "Automation work is usually shown as a screenshot of a canvas, which proves only that nodes were placed. This project exists to show the logic inside the nodes, tested.",
    challenge:
      "n8n Code nodes are JavaScript strings inside a JSON document. They are easy to get wrong and, in the usual workflow, untestable short of running the whole automation against live services.",
    approach:
      "The test suite parses the workflow JSON, pulls each Code node's source and runs it in a function with `$input` and `$getWorkflowStaticData` stubbed. The code under test is literally the code that would run in n8n, so if the workflow file changes, the tests see the change.",
    process: [
      "Modelled the pipeline: webhook, validation, normalisation, scoring, deduplication against workflow static data, branch, enrichment, notification, and a response.",
      "Wrote the Code nodes, then the harness that executes them.",
      "Built three example payloads (hot, cold and invalid) and asserted the end-to-end outcome for each.",
      "Documented required credentials by name, with no values anywhere in the repository.",
    ],
    solution:
      "An importable workflow with its business logic under test, plus example inputs and a diagram.",
    objectives: [
      "Show the logic inside an automation, not a screenshot of a canvas with nodes on it.",
      "Make the Code nodes testable without running the whole workflow against live services.",
      "Keep credentials out of the exported workflow entirely.",
    ],
    features: [
      "15-node workflow: webhook, validation, normalisation, scoring, deduplication, branch, enrichment, notification and response",
      "Lead scoring with configurable thresholds and a hot/cold branch",
      "Deduplication against workflow static data within a time window",
      "Three example payloads (hot, cold and invalid) with asserted end-to-end outcomes",
    ],
    decisions: [
      {
        title: "The tests execute the workflow's own JavaScript",
        text: "The suite reads the workflow JSON, extracts each Code node's source and runs it with $input and $getWorkflowStaticData stubbed. The code under test is the code that would run in n8n, so editing the workflow file is visible to the tests.",
      },
      {
        title: "Validation happens before scoring",
        text: "An invalid submission is rejected with a reason rather than scored as a zero, which keeps bad data out of the CRM instead of inside it with a low number attached.",
      },
      {
        title: "Credentials are referenced, never embedded",
        text: "The export names the credentials it needs and contains no values, tokens or endpoints.",
      },
    ],
    results: [
      "22 tests pass by executing the workflow's own Code-node JavaScript.",
      "No credentials, tokens or endpoints are present in the exported workflow, only named credential references.",
      "The workflow has not been run inside an n8n instance; the logic is verified, the orchestration is not.",
    ],
  },
};

const SUPPLY_CHAIN: Project = {
  id: "p06",
  slug: "meridian-inventory-operations",
  title: "Meridian: Inventory & Purchasing Operations",
  categories: ["Business Solutions", "Web & Software"],
  tags: ["Inventory", "Append-only ledger", "Purchasing", "Reorder logic", "TypeScript"],
  year: "2026",
  summary:
    "An inventory and purchasing system built on an append-only movement ledger: stock is never stored as a number, it is the sum of its movements. Receipts, transfers, reorder suggestions and valuation all derive from the same record.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Designed the ledger as the single source of truth: balances are computed, never written",
    "Built the posting gate that refuses movements which would drive stock negative or carry the wrong sign",
    "Implemented transfers as matched movement pairs, so a transfer can never create or destroy stock",
    "Built purchase orders with status derivation, over-receipt refusal and partial receipts",
    "Implemented reorder suggestions that account for stock already on order",
    "Wrote 31 unit tests and 27 browser checks",
  ],
  technologies: ["TypeScript", "React 19", "esbuild", "Node.js test runner", "Playwright"],
  featured: true,
  cover: {
    src: "/images/projects/supply-chain/cover.webp",
    alt: "Meridian stock overview with on-hand, on-order and reorder columns",
    width: 1500,
    height: 1055,
  },
  gallery: [
    { type: "image", src: "/images/projects/supply-chain/mobile.webp", alt: "The stock table on a phone-sized screen", width: 780, height: 1640 },
  ],
  caseStudy: {
    background:
      "Meridian is an invented distributor. The system covers the part of operations where mistakes are expensive: knowing what you have, what is coming, and what to order.",
    challenge:
      "Inventory systems that store a quantity field drift. A failed write, a double-click or a race and the number no longer matches reality, with no record of how it got there.",
    approach:
      "An append-only ledger. Every change is a movement with a reason, a reference and a timestamp; on-hand is the sum. Nothing can silently change a balance, and every balance can be explained by replaying its movements.",
    process: [
      "Built the ledger primitives (post, transfer, balances, running balance, valuation) with the posting gate refusing invalid movements.",
      "Built purchasing on top: orders, partial receipts, status derivation and over-receipt refusal.",
      "Added reorder suggestions, then found the inconsistency described below.",
      "Wrote the browser suite over the real interface.",
    ],
    solution:
      "A system where the stock figure, the movement history, the purchase orders and the reorder advice are all views of one ledger, so they agree by construction.",
    objectives: [
      "Make stock impossible to drift by never storing it as a number.",
      "Keep purchase orders, receipts and reorder advice consistent with the same record.",
      "Refuse the operations that corrupt an inventory system rather than recording them.",
    ],
    features: [
      "Append-only movement ledger with reason, reference and timestamp on every entry",
      "On-hand, on-order and running balances computed from the ledger",
      "Transfers posted as matched pairs, so stock cannot be created or destroyed",
      "Purchase orders with partial receipts, status derivation and over-receipt refusal",
      "Reorder suggestions that account for stock already on order",
      "Stock valuation and a movement history view per SKU",
    ],
    decisions: [
      {
        title: "The ledger is the only source of truth",
        text: "Balance is the sum of movements, never a stored field. Every figure can be explained by replaying its movements, and a failed write cannot leave a quantity that no longer matches reality.",
      },
      {
        title: "The posting gate refuses invalid movements",
        text: "A movement that would drive stock negative, or that carries the wrong sign for its type, is rejected at the boundary rather than written and corrected later.",
      },
      {
        title: "Reorder advice and the stock table share a calculation",
        text: "They did not at first: the headline said 'below reorder: 0' while the table flagged an item, because one counted stock on order and the other did not. Both now use the same figure and a test asserts they agree.",
      },
    ],
    results: [
      "31 unit tests and 27 browser checks pass.",
      "Testing caught a contradiction the interface was showing: the headline said \"below reorder: 0\" while the table flagged an item. The reorder calculation counted stock on order and the table did not. Both now use the same figure, and a test asserts they agree.",
      "My own seed-size expectation was wrong: the fixture holds 1,265 movements, not the 1,500+ I had assumed. The test was corrected to the real number.",
    ],
  },
};

const SOURCING: Project = {
  id: "p07",
  slug: "lantern-sourcing-platform",
  title: "Lantern: Supplier Sourcing & Landed Cost",
  categories: ["Business Solutions", "Web & Software"],
  tags: ["Landed cost", "Incoterms", "Supplier scoring", "Shipment tracking", "TypeScript"],
  year: "2026",
  summary:
    "A sourcing tool that compares suppliers on landed cost rather than unit price: incoterms, duty by HS code, freight by volume or weight, and a weighted score across cost, speed, quality, reliability and responsiveness.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Implemented landed-cost calculation across EXW, FOB, CIF and DDP, zeroing the cost lines each incoterm already covers",
    "Built duty lookup by HS code and freight costing that takes the greater of volumetric and actual weight",
    "Designed the weighted supplier score and implemented it as relative scoring, so suppliers are ranked against each other rather than against arbitrary absolutes",
    "Built working-day-aware arrival estimates, shipment progress and milestone variance",
    "Wrote 31 unit tests and 21 browser checks",
  ],
  technologies: ["TypeScript", "React 19", "esbuild", "Node.js test runner", "Playwright"],
  featured: false,
  cover: {
    src: "/images/projects/sourcing-platform/cover.webp",
    alt: "Lantern comparing suppliers by landed cost with incoterm and quantity controls",
    width: 1500,
    height: 1055,
  },
  gallery: [
    { type: "image", src: "/images/projects/sourcing-platform/mobile.webp", alt: "The supplier comparison on a phone-sized screen", width: 780, height: 1640 },
  ],
  caseStudy: {
    background:
      "Lantern is an invented sourcing desk. The tool addresses the mistake that costs importers the most money: choosing a supplier on unit price.",
    challenge:
      "Unit price is a small part of landed cost. Freight, duty, insurance and the incoterm can reverse a ranking entirely, and the arithmetic is fiddly enough that spreadsheets get it wrong.",
    approach:
      "Model the cost lines explicitly and let the incoterm decide which ones the buyer pays. Score suppliers relatively across five weighted factors, so the comparison answers \"which of these\" rather than scoring against an invented ideal.",
    process: [
      "Built the landed-cost model with freight rates, duty by HS code and per-incoterm cost allocation.",
      "Implemented relative scoring with weights of 40% cost, 20% speed, 20% quality, 12% reliability and 8% responsiveness.",
      "Added shipment progress and milestone variance for orders already placed.",
      "Wrote the test suite, correcting my own wrong assumption described below.",
    ],
    solution:
      "A comparison where changing quantity or incoterm visibly reorders the suppliers, because the full cost is recomputed rather than the unit price being decorated.",
    objectives: [
      "Compare suppliers on landed cost rather than unit price.",
      "Make the incoterm decide which cost lines the buyer actually pays.",
      "Score suppliers against each other rather than against an invented ideal.",
    ],
    features: [
      "Landed-cost model across EXW, FOB, CIF and DDP with per-incoterm cost allocation",
      "Duty lookup by HS code and freight costed on the greater of volumetric and actual weight",
      "Weighted supplier score across cost, speed, quality, reliability and responsiveness",
      "Working-day-aware arrival estimates, shipment progress and milestone variance",
      "Quantity and incoterm controls that visibly reorder the comparison",
    ],
    decisions: [
      {
        title: "Cost lines are modelled, not approximated",
        text: "Freight, duty, insurance and handling are separate lines, and the incoterm zeroes the ones the seller already covers. That is what lets changing EXW to DDP reverse a ranking.",
      },
      {
        title: "Relative scoring",
        text: "Suppliers are scored against each other, so the comparison answers 'which of these' rather than grading everyone against an absolute that nobody set.",
      },
      {
        title: "Integer-cent arithmetic throughout",
        text: "The same rule as the storefront: money never touches a float, so a landed cost built from six lines across two currencies stays exact.",
      },
    ],
    results: [
      "31 unit tests and 21 browser checks pass.",
      "One of my test expectations assumed the cheapest unit price would not also be the cheapest landed; in this dataset it is. The test was rewritten to assert what is actually true: it still loses on the weighted score.",
      "A long select option stretched the layout to 448px inside a 360px viewport; found by the layout sweep and fixed.",
    ],
  },
};

const BLENDER: Project = {
  id: "p08",
  slug: "blender-product-visualisation",
  title: "Product Visualisation: Blender Scene System",
  categories: ["3D & Motion"],
  tags: ["Blender", "Python", "bpy", "Three-point lighting", "Turntable"],
  year: "2026",
  summary:
    "A scripted Blender scene builder: three material presets, six camera angles and a 120-frame turntable, built with bpy and covered by 20 tests that run outside Blender. No image has been rendered.",
  projectType: "Original Concept",
  status: "In Development",
  role: "Sole author",
  contribution: [
    "Wrote the scene builder in Python against the bpy API: geometry, materials, three-point lighting, camera placement on a sphere and a 120-frame turntable",
    "Structured it so every function is importable without Blender present, with bpy stubbed, making the maths testable",
    "Wrote 20 tests covering camera placement, light positioning, preset application and frame ranges",
    "Wrote the product specification and a render status document stating plainly that nothing has been rendered",
  ],
  technologies: ["Python", "Blender (bpy)", "unittest"],
  featured: false,
  cover: {
    src: "/images/projects/placeholder-interior.webp",
    alt: "Placeholder image: no render exists for this project",
    width: 1600,
    height: 900,
  },
  usesSampleMedia: true,
  gallery: [],
  architectureDiagram: {
    src: "/images/site-visuals/specializations/blender-bpy-camera-rig.svg",
    alt: "Technical schematic of the Blender Python scene builder showing six spherical camera positions, three-point lighting and 120-frame turntable — not a rendered 3D image",
    width: 1200,
    height: 720,
    caption: "Technical architecture schematic of the Python (bpy) rig — not rendered 3D output.",
  },
  caseStudy: {
    background:
      "A product visualisation pipeline, written as code so that lighting and camera setups are reproducible rather than hand-placed per shot.",
    challenge:
      "Blender is not installed in the environment this was built in, so the scene has never been executed. The honest options were to fabricate renders or to ship the scene system and say so. I shipped the scene system and said so.",
    approach:
      "Write the builder so its geometry and placement maths can be verified without Blender: bpy is imported defensively and falls back to None, and the functions that compute camera positions, light positions and frame ranges are pure.",
    process: [
      "Wrote the product specification first: dimensions, materials, the shots required.",
      "Built the scene functions: geometry, three presets, three-point lighting, spherical camera placement, six angles and the turntable.",
      "Wrote 20 tests over the computable parts and ran them.",
      "Wrote RENDER_STATUS.md, which states in its first line that no image in the project has been rendered.",
    ],
    solution:
      "A complete, tested scene system that will produce the specified shots when run in Blender. The renders themselves do not exist.",
    objectives: [
      "Make lighting and camera setups reproducible as code rather than hand-placed per shot.",
      "Keep the geometry and placement maths verifiable without Blender present.",
      "Document honestly that nothing has been rendered.",
    ],
    features: [
      "Scene builder with geometry, three material presets and three-point lighting",
      "Spherical camera placement with six defined product angles",
      "A 120-frame turntable with configurable frame range",
      "A bpy fallback so every pure function is importable and testable outside Blender",
    ],
    decisions: [
      {
        title: "bpy is imported defensively",
        text: "Outside Blender, bpy falls back to None and the pure functions (camera positions, light positions, frame ranges) remain importable. That is what makes 20 tests possible in an environment with no Blender installed.",
      },
      {
        title: "Cameras are placed on a sphere, not typed in",
        text: "Angles are computed from azimuth, elevation and radius, so a new shot is three numbers rather than a hand-tuned transform.",
      },
      {
        title: "RENDER_STATUS.md states the gap in its first line",
        text: "No image in the project has been rendered. Saying so in the repository, on the card and in this case study was the alternative to generating something and implying it came from the scene.",
      },
    ],
    results: [
      "20 Python tests pass outside Blender.",
      "**Nothing has been rendered.** The cover image on this card is a placeholder, labelled as sample media, not output from this project.",
      "This project is listed as In Development rather than Demo Ready, because the thing it is for (images) has not been produced.",
    ],
  },
};

const MOTION: Project = {
  id: "p09",
  slug: "motion-production-pipeline",
  title: "Motion Production: Media Pipeline",
  categories: ["3D & Motion", "Creative Production"],
  tags: ["ffmpeg", "H.264", "VP9", "Contact sheets", "Node.js"],
  year: "2026",
  summary:
    "The tooling that prepares motion work for the web: H.264 and VP9 encodes with faststart, silent hover previews, poster extraction and storyboard contact sheets. 28 tests invoke ffmpeg for real. No finished film is included.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole author",
  contribution: [
    "Wrote the media preparation tool: probes the source, encodes H.264 with faststart and VP9, extracts a poster a quarter of the way in, and builds a silent 6-second hover preview",
    "Made it refuse to upscale past the source, keep dimensions even for both codecs, and drop the audio track when the source is silent rather than failing",
    "Wrote the contact-sheet tool: evenly spaced frames inset from both ends, so slates and fade-ups are skipped",
    "Wrote 28 tests that run ffmpeg and ffprobe against a generated clip and assert the real output properties",
    "Wrote the shot-list and case-study templates",
  ],
  technologies: ["Node.js", "ffmpeg", "ffprobe", "Node.js test runner"],
  featured: false,
  cover: {
    src: "/images/projects/placeholder-travel.webp",
    alt: "Placeholder image: no finished film exists for this project",
    width: 1600,
    height: 900,
  },
  usesSampleMedia: true,
  gallery: [],
  architectureDiagram: {
    src: "/images/site-visuals/services/creative-production/production-encoding-pipeline.svg",
    alt: "Technical architecture diagram of the Node.js and ffmpeg/ffprobe media pipeline showing source probing and parallel H.264 faststart, VP9, WebP poster, hover preview and contact-sheet outputs",
    width: 1200,
    height: 720,
    caption: "Technical architecture schematic of the verified ffmpeg/ffprobe CLI pipeline — not finished film footage.",
  },
  caseStudy: {
    background:
      "Motion work needs a repeatable path from a master file to the files a website actually serves. This is that path, written as two command-line tools.",
    challenge:
      "The details that matter in web video are easy to get wrong and invisible until someone complains: a file without faststart will not begin playing until it has largely downloaded, a hover preview with audio is a bug, and an odd pixel dimension makes VP9 fail outright.",
    approach:
      "Encode decisions are made from a real probe of the source rather than from assumptions, and the tests invoke ffmpeg rather than mocking it, so if an encoder flag is wrong, the test sees the wrong output.",
    process: [
      "Wrote the probe and the argument builders for each output.",
      "Wrote tests that generate a clip with ffmpeg, run the pipeline over it and probe the results: faststart present, preview silent, poster dimensions correct, no upscaling.",
      "Built the contact-sheet tool and tested the frame timestamps and grid geometry.",
    ],
    solution:
      "Two tools that take a master file and produce everything the portfolio needs, including the JSON snippet to paste into this project data file with the poster's real dimensions filled in.",
    objectives: [
      "Take a master file to the files a website actually serves, repeatably.",
      "Get the details right that are invisible until someone complains: faststart, silent previews, even dimensions.",
      "Verify the output by probing it rather than trusting the flags.",
    ],
    features: [
      "H.264 encode with +faststart and a VP9 alternative",
      "Silent six-second hover preview, with the audio track dropped rather than failing on silent sources",
      "Poster extraction a quarter of the way in, with dimensions reported back",
      "Contact sheets from evenly spaced frames, inset from both ends to skip slates and fade-ups",
      "A JSON snippet generated for pasting into the project data file",
    ],
    decisions: [
      {
        title: "Encode decisions come from a real probe",
        text: "The tool probes the source and refuses to upscale past it, keeps dimensions even for VP9, and drops audio when the source is silent. None of that is assumed from the filename.",
      },
      {
        title: "The tests run ffmpeg",
        text: "They generate a clip, run the pipeline over it and probe the results. A mocked encoder would have passed with the wrong flags; probing the output cannot.",
      },
      {
        title: "Frames are inset from both ends",
        text: "A contact sheet sampled from 0% to 100% is mostly slate and fade-up. Insetting gives frames that represent the content.",
      },
    ],
    results: [
      "28 tests pass by running ffmpeg and ffprobe for real.",
      "**No finished video is in this repository.** Footage and edits have not been supplied, and nothing has been generated to stand in for them. The cover image here is a placeholder, labelled as sample media.",
      "What is verified is the pipeline, on a generated test clip. What is not shown is any motion work, because there is none to show yet.",
    ],
  },
};

const BRAND_SYSTEM: Project = {
  id: "p10",
  slug: "halcyon-brand-system",
  title: "Halcyon: Brand System & Campaign",
  categories: ["Branding & Marketing", "Creative Production"],
  tags: ["Design system", "WCAG contrast", "Type scale", "HTML email", "SVG"],
  year: "2026",
  summary:
    "A complete brand system for an invented sleep brand: palette with live WCAG contrast checking, a generated type scale, downloadable SVG lockups and social templates, a table-based HTML email and a landing page.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Implemented the WCAG 2.2 relative-luminance and contrast formulas, so every documented pairing is measured on render rather than asserted in a document",
    "Built the type scale as a generated modular scale, so changing the base size or ratio regenerates every step",
    "Drew the mark, three lockups and three social templates as SVG, serialised to real downloadable files from the live DOM",
    "Wrote a table-based HTML email with inline styles, an Outlook conditional, a hidden preheader and a plain-text alternative",
    "Wrote 29 unit tests and 21 browser checks",
  ],
  technologies: ["TypeScript", "React 19", "SVG", "HTML email", "esbuild", "Playwright"],
  featured: true,
  cover: {
    src: "/images/projects/brand-system/cover.webp",
    alt: "Halcyon brand identity page with the stacked lockup and voice guidance",
    width: 1600,
    height: 1075,
  },
  gallery: [
    { type: "image", src: "/images/projects/brand-system/colour.webp", alt: "The eight-colour palette with roles, tokens and a note on a darkened accent", width: 1600, height: 1075 },
    { type: "image", src: "/images/projects/brand-system/contrast.webp", alt: "Contrast table with measured ratios and a live checker for any colour pair", width: 1600, height: 1075 },
    { type: "image", src: "/images/projects/brand-system/type.webp", alt: "The generated type scale with adjustable base size and ratio", width: 1600, height: 1075 },
    { type: "image", src: "/images/projects/brand-system/assets.webp", alt: "Lockups and the mark, each downloadable as an SVG file", width: 1600, height: 1075 },
    { type: "image", src: "/images/projects/brand-system/campaign.webp", alt: "Campaign channels and social templates, with a notice that no campaign has run", width: 1600, height: 1075 },
    { type: "image", src: "/images/projects/brand-system/email.webp", alt: "The HTML email template rendered live in an iframe", width: 1600, height: 1075 },
    { type: "image", src: "/images/projects/brand-system/landing.webp", alt: "The landing page built from the same tokens", width: 1600, height: 1075 },
    { type: "image", src: "/images/projects/brand-system/mobile.webp", alt: "The palette and contrast table on a phone-sized screen", width: 780, height: 1560 },
  ],
  caseStudy: {
    background:
      "Halcyon is an invented sleep-and-recovery brand. The system exists to show brand work as something that holds up under checking, rather than a page of swatches.",
    challenge:
      "Brand guidelines usually assert accessibility rather than demonstrate it. A contrast ratio typed into a document is a claim; a contrast ratio computed from the palette is a fact that can fail.",
    approach:
      "Implement the WCAG formulas, compute every documented pairing on render, and put a test in the suite asserting they all pass, plus a second test asserting that a known-bad pairing fails, so the first test cannot pass vacuously over an empty set.",
    process: [
      "Wrote the colour maths and the type scale generator, tested against the WCAG reference values and the ratio.",
      "Chose the palette, then let the checker judge it, which forced the change described below.",
      "Drew the mark, lockups and social templates as SVG, with download serialised from the live DOM.",
      "Wrote the email template to the constraints email clients actually impose, and previewed it by rendering the generated HTML in an iframe.",
      "Built the landing page from the same tokens.",
    ],
    solution:
      "A brand system where the accessibility claims are computed in front of you, the type scale is generated rather than listed, and every asset downloads as a real file.",
    objectives: [
      "Make the accessibility claims computable rather than asserted.",
      "Generate the type scale from a ratio so it cannot drift out of step.",
      "Produce assets that download as real files, and email markup that survives real clients.",
    ],
    features: [
      "Palette with every documented pairing measured live against its WCAG threshold",
      "A contrast checker for any two colours, graded against AA and AAA",
      "A modular type scale regenerated from an adjustable base size and ratio",
      "Mark, three lockups and three social templates, each downloading as a real SVG",
      "A table-based HTML email with a plain-text alternative, previewed in an iframe",
      "A landing page built from the same tokens",
    ],
    decisions: [
      {
        title: "Contrast is computed, not typed in",
        text: "The WCAG relative-luminance and contrast formulas are implemented, so the table is a measurement that can fail. One test asserts every pairing passes; a second asserts a known-bad pairing fails, so the first cannot pass vacuously.",
      },
      {
        title: "The checker overruled the palette",
        text: "The original Clay accent measured 3.36:1 on Paper, below the 4.5:1 needed for body text. It was darkened to #A94F30 at 5.12:1, and the palette carries a note recording why.",
      },
      {
        title: "Tables and inline styles for email",
        text: "Outlook renders mail with the Word engine, so flexbox and grid are unreliable and external stylesheets can be stripped. A 600px table with inline styles is what arrives looking right.",
      },
      {
        title: "Downloads are serialised from the live DOM",
        text: "What you see is what the file contains, because the SVG is cloned from the rendered element rather than regenerated from a second source.",
      },
    ],
    results: [
      "29 unit tests and 21 browser checks pass.",
      "The checker rejected the original Clay accent: #C96F4A measured 3.36:1 on Paper, below the 4.5:1 needed for body text. It was darkened to #A94F30 (5.12:1) and the palette carries a note recording why.",
      "The browser suite found a real crash: the contrast checker called the parser before validating input, so typing a non-colour unmounted the React tree and left a blank page. Now guarded, with the test kept as a regression check.",
      "No campaign has run. The campaign section lists what would be measured and says there are no results, and a test asserts the copy contains no results language.",
    ],
  },
};

const CHAIN_EXPLORER: Project = {
  id: "p11",
  slug: "ledgerlight-block-explorer",
  title: "Ledgerlight: EVM Block Explorer",
  categories: ["Web & Software"],
  tags: ["Keccak-256", "EIP-55", "JSON-RPC", "EIP-1193", "TypeScript"],
  year: "2026",
  summary:
    "A read-only EVM block explorer with Keccak-256 and EIP-55 checksumming implemented from the specifications, a real JSON-RPC client, wallet connection over EIP-1193, and a fixture node so the interface works offline without pretending to be live.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Implemented Keccak-256 from the permutation, with the original 0x01 padding rather than NIST SHA3's, tested against the published Ethereum vectors",
    "Implemented EIP-55 checksum encoding and validation, tested against all four vectors in the specification",
    "Wrote the JSON-RPC 2.0 client with timeouts and typed failures for unreachable, timed out, RPC error, malformed and not-found",
    "Built a fixture node that implements the same JSON-RPC envelope, including null results and -32601 for unknown methods, so the client code under test is the real one",
    "Implemented EIP-1193 wallet connection, read-only, with a test asserting it never calls any signing or sending method",
    "Held every quantity as a bigint, with formatting that truncates rather than rounds",
    "Wrote 62 unit tests and 25 browser checks",
  ],
  technologies: ["TypeScript", "React 19", "JSON-RPC", "EIP-1193", "esbuild", "Playwright"],
  featured: true,
  cover: {
    src: "/images/projects/chain-explorer/cover.webp",
    alt: "Ledgerlight showing the latest blocks with gas usage, base fee and the RPC call log",
    width: 1600,
    height: 1059,
  },
  gallery: [
    { type: "image", src: "/images/projects/chain-explorer/block.webp", alt: "A block page with its hash, gas usage and transaction list", width: 1600, height: 1176 },
    { type: "image", src: "/images/projects/chain-explorer/transaction.webp", alt: "A transaction with its receipt, fee paid, calldata and decoded logs", width: 1600, height: 1822 },
    { type: "image", src: "/images/projects/chain-explorer/address.webp", alt: "An address page with balance, nonce, account type and history", width: 1600, height: 1176 },
    { type: "image", src: "/images/projects/chain-explorer/checksum-error.webp", alt: "A mixed-case address rejected for a bad EIP-55 checksum, with the correction offered", width: 1600, height: 1176 },
    { type: "image", src: "/images/projects/chain-explorer/live-error.webp", alt: "A live network that cannot be reached, showing the real error rather than fixture data", width: 1600, height: 1176 },
    { type: "image", src: "/images/projects/chain-explorer/mobile.webp", alt: "The block list on a phone-sized screen", width: 780, height: 1600 },
  ],
  caseStudy: {
    background:
      "A block explorer is a good test of whether someone understands a chain or merely uses a library for it. This one implements the primitives (the hash function, the address encoding, the RPC protocol) rather than importing ethers or viem.",
    challenge:
      "Two things are easy to get wrong and easy to hide. The first is Keccak-256: it is not SHA3-256, the padding differs, and a wrong implementation produces plausible-looking hashes. The second is honesty about data source: a demo with no network access can quietly serve fixtures while claiming to be live.",
    approach:
      "Test the cryptography against published vectors, including an explicit assertion that the output is not SHA3-256. For the data source, build the fixture as a real JSON-RPC node rather than a mock, and make the interface state which source it is using in a banner that cannot be missed.",
    process: [
      "Implemented Keccak-256 and verified it against the empty string, \"abc\", \"hello\" and the canonical ERC-20 Transfer topic.",
      "Implemented EIP-55 and verified it against the specification's four vectors.",
      "Wrote the RPC client with typed failures, then the fixture node that exercises each of them.",
      "Built the explorer: block list, block, transaction with receipt and logs, address, and a visible log of every RPC call made.",
      "Added the wallet panel, read-only, with the forbidden-methods test.",
    ],
    solution:
      "An explorer that reads blocks, transactions, receipts and addresses, decodes calldata selectors and log topics, checksums every address it displays, and tells you plainly whether it is reading a fixture or a live node.",
    objectives: [
      "Implement the primitives (hash function, address encoding, RPC protocol) rather than importing them.",
      "Stay read-only by construction, with no path that could sign or send.",
      "Never let a fixture be mistaken for a live chain.",
    ],
    features: [
      "Block list with gas usage, base fee and validator, and block, transaction and address views",
      "Receipts with status, gas used and the fee actually paid",
      "Calldata selectors and log topics named from a local signature table",
      "EIP-55 validation that rejects a mixed-case address with a bad checksum and offers the correction",
      "Read-only EIP-1193 wallet connection with honest states when no wallet is present",
      "A visible log of every JSON-RPC call the page has made, with outcome and duration",
    ],
    decisions: [
      {
        title: "Keccak-256, not SHA3-256",
        text: "Ethereum uses the original Keccak padding (0x01), not NIST's (0x06), and the two produce completely different digests. The suite checks the published vectors and adds an explicit assertion that the output is not SHA3-256.",
      },
      {
        title: "Every quantity is a bigint",
        text: "A balance in wei overflows a JS number. Formatting truncates rather than rounds, so an explorer never shows more than the chain holds.",
      },
      {
        title: "The fixture is a node, not a mock",
        text: "It implements the JSON-RPC envelope, returns null for a missing hash and -32601 for an unknown method, and respects the AbortSignal. The client path under test is the real one.",
      },
      {
        title: "Read-only is enforced by a test",
        text: "The wallet module is asserted never to call eth_sendTransaction, eth_sign, personal_sign, eth_signTypedData_v4 or eth_sendRawTransaction. The network list contains three testnets and no mainnet.",
      },
    ],
    results: [
      "62 unit tests and 25 browser checks pass.",
      "The Keccak implementation reproduces every published vector, including the ERC-20 Transfer topic 0xddf252ad… that appears in every such log on every EVM chain.",
      "A browser test aborts the connection to a live endpoint and asserts the real error appears with no fixture rows behind it, so the \"live\" mode cannot silently fall back.",
      "**The live-network path has never reached a real node.** The environment this was built in blocks outbound requests to public RPC endpoints. The code and its failure handling are tested; the success path against a real chain is not.",
      "No ethers, viem, web3.js or js-sha3: the cryptography and encoding are in the source.",
    ],
  },
};

const SECURITY: Project = {
  id: "p12",
  slug: "sentryline-security-posture",
  title: "Sentryline: Web Security Posture",
  categories: ["Web & Software", "Business Solutions"],
  tags: ["Security headers", "X.509", "ASN.1", "CSP", "npm audit"],
  year: "2026",
  summary:
    "Defensive analysis of data you supply: security headers graded with reasoning, TLS certificates parsed by a DER parser written from the specification, and npm audit reports rolled up to the dependency you actually have to upgrade. It scans nothing.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Wrote the DER/ASN.1 parser and X.509 reader: subject, issuer, validity, key algorithm and size, signature algorithm, subjectAltName and basic constraints",
    "Verified the parser against openssl: the test suite asserts the subject, validity window and SAN list match `openssl x509` for eight generated certificates",
    "Built the header rule engine: CSP parsed directive by directive, HSTS, cookies, X-Frame-Options conflicts, wildcard CORS and version disclosure",
    "Implemented browser wildcard host matching, so *.example.com does not match a.b.example.com or the bare domain",
    "Built the npm audit reader, walking the effects chain to the direct dependency responsible",
    "Wrote 57 unit tests and 23 browser checks",
  ],
  technologies: ["TypeScript", "React 19", "ASN.1/DER", "openssl (test fixtures)", "esbuild", "Playwright"],
  featured: true,
  cover: {
    src: "/images/projects/security-dashboard/cover.webp",
    alt: "Sentryline watchlist showing a grade trend over recorded results",
    width: 1500,
    height: 1148,
  },
  gallery: [
    { type: "image", src: "/images/projects/security-dashboard/headers.webp", alt: "A typical response head graded F with its findings listed by severity", width: 1500, height: 1148 },
    { type: "image", src: "/images/projects/security-dashboard/headers-hardened.webp", alt: "A hardened response head graded A", width: 1500, height: 1148 },
    { type: "image", src: "/images/projects/security-dashboard/certificate.webp", alt: "A parsed certificate showing a 1024-bit RSA key and the names it covers", width: 1500, height: 1348 },
    { type: "image", src: "/images/projects/security-dashboard/dependencies.webp", alt: "An npm audit report with severities, the direct dependency to upgrade and fix availability", width: 1500, height: 1289 },
    { type: "image", src: "/images/projects/security-dashboard/mobile.webp", alt: "The header analysis on a phone-sized screen", width: 780, height: 1640 },
  ],
  caseStudy: {
    background:
      "Security tooling is the area where a demo is most tempting to fake, because the output looks authoritative whether or not anything was checked. This one is built so that every claim can be traced to data the user supplied and logic that is tested.",
    challenge:
      "A browser cannot read another origin's response headers, and cannot inspect a TLS certificate at all. Any page claiming to scan a site from the browser is proxying through a server it has not mentioned. The honest design has to make the input the user's own, and say why.",
    approach:
      "Analyse only what is pasted in: a response head from curl, a PEM certificate from openssl, an audit report from npm. State the scope in the interface, in the footer and in the README. Implement the parsing rather than importing it, so the analysis can be verified against an independent tool.",
    process: [
      "Wrote the ASN.1/DER parser and the X.509 reader.",
      "Generated eight test certificates with openssl and Python's cryptography library: valid, wildcard, 1024-bit, SHA-1, ECDSA, over-long lifetime, no SAN and genuinely expired.",
      "Wrote tests that compare the parser's output against `openssl x509` for every one of them.",
      "Built the header rule engine, with the reasoning attached to each finding rather than a bare score.",
      "Built the npm audit reader and the watchlist, which records results the user has run so a grade can be tracked over time.",
    ],
    solution:
      "Four views (watchlist, headers, certificate, dependencies) over data the user provides, with every limitation stated where someone would otherwise assume otherwise.",
    objectives: [
      "Analyse only data the user supplies, and say why that constraint is technical as well as ethical.",
      "Implement the parsing so the output can be checked against an independent tool.",
      "Attach reasoning to every finding rather than emitting a bare score.",
    ],
    features: [
      "Security header grading with CSP parsed directive by directive",
      "HSTS, cookie, CORS and version-disclosure checks with severity and explanation",
      "X.509 parsing from a DER/ASN.1 parser: subject, issuer, validity, key size, signature, SANs",
      "Browser wildcard host matching, so *.example.com does not match a.b.example.com",
      "npm audit report rollup that walks the effects chain to the direct dependency to upgrade",
      "A watchlist that tracks a grade over results the user has recorded",
    ],
    decisions: [
      {
        title: "Nothing is fetched, and the interface says why",
        text: "A browser cannot read another origin's response headers or inspect a certificate. A page claiming to scan a site from the browser is proxying through a server it has not mentioned. The input is the user's own.",
      },
      {
        title: "The parser is checked against openssl",
        text: "Eight generated certificates are parsed and compared against what openssl x509 reports for the same files. If the ASN.1 parser drifts, openssl disagrees and the suite fails.",
      },
      {
        title: "Penalties have diminishing returns",
        text: "The first scoring model summed a penalty per finding, which graded a response with no security headers above one with eight configured badly. The second gave the analyser more to find. Sorting penalties worst-first and decaying them fixed the ordering, and a test now asserts it.",
      },
      {
        title: "Limits are stated in the interface",
        text: "It cannot verify a signature chain, reach a root store or check revocation. Those need a TLS client, and the certificate panel says so above the result.",
      },
    ],
    results: [
      "57 unit tests and 23 browser checks pass. The certificate tests fail if the parser ever disagrees with openssl.",
      "The first scoring model was wrong, and testing showed it: summing a penalty per finding graded a response with no security headers above one with eight headers configured badly, because the second gave the analyser more to find. Replaced with diminishing returns, and a test now asserts the ordering.",
      "The interface states what it cannot do (verify a signature chain, reach a root store, check revocation) rather than leaving the impression that it did.",
      "No node-forge, pkijs or header-scanner library: the ASN.1 parser, CSP parser and rule engine are in the source.",
    ],
  },
};

const PIPELINEOS: Project = {
  id: "p13",
  slug: "pipelineos-crm",
  title: "PipelineOS — CRM & Sales Management SaaS",
  seoTitle: "PipelineOS CRM — Live Full-Stack B2B Sales CRM Case Study",
  seoDescription:
    "Explore PipelineOS, a live Next.js and PostgreSQL B2B CRM demonstration with contacts, transactional lead conversion, Kanban pipeline, and live analytics.",
  categories: ["Web & Software", "Business Solutions"],
  tags: ["Full-Stack SaaS", "PostgreSQL", "Kanban Pipeline", "Lead Conversion", "RBAC Auth"],
  year: "2026",
  summary:
    "A complete full-stack CRM and sales management SaaS built with Next.js, Drizzle ORM, and PostgreSQL — featuring persistent contacts, transactional lead conversion, a 6-stage Kanban deal pipeline, activities, live revenue analytics, and 1-click demo reset.",
  projectType: "Open-Source Adaptation",
  status: "Demo Ready",
  role: "Product architect and full-stack software engineer",
  contribution: [
    "Audited open-source CRM licenses and rejected AGPL/Enterprise codebases in favor of a legally clean MIT-inspired architecture",
    "Designed a standalone deep-navy SaaS interface completely separate from the portfolio's obsidian/coral identity",
    "Engineered an 8-table PostgreSQL relational schema with Drizzle ORM, integer-cent deal values, and versioned SQL migrations",
    "Implemented scrypt salted password authentication, SHA-256 HttpOnly sessions, RBAC roles, and in-memory write rate limiting",
    "Built end-to-end CRUD for contacts with communication history, leads with atomic conversion to contact + deal, Kanban deal stage moves with audit history, follow-up tasks, and live DB-computed analytics",
    "Verified with automated unit/PostgreSQL integration tests and headless Chromium desktop/mobile E2E checks",
  ],
  technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "Tailwind CSS", "Zod", "Node.js Test Runner"],
  featured: true,
  liveUrl: process.env.NEXT_PUBLIC_PIPELINEOS_URL?.trim() || "https://crm.aliarshad.co",
  sourceUrl: "https://github.com/aliarshad0909/My-own-Portfolio-2026",
  cover: {
    src: "/images/projects/pipelineos/dashboard.png",
    alt: "PipelineOS CRM executive dashboard showing open pipeline value, won revenue, conversion rate, and overdue tasks",
    width: 1440,
    height: 900,
  },
  gallery: [
    {
      type: "image",
      src: "/images/projects/pipelineos/pipeline.png",
      alt: "PipelineOS 6-stage Kanban deal pipeline board with stage totals and quick stage transitions",
      width: 1440,
      height: 900,
    },
    {
      type: "image",
      src: "/images/projects/pipelineos/contacts.png",
      alt: "PipelineOS contacts directory with live search, detail drawer, and communication timeline",
      width: 1440,
      height: 900,
    },
    {
      type: "image",
      src: "/images/projects/pipelineos/leads.png",
      alt: "PipelineOS lead capture workspace with source filtering and one-click transactional conversion",
      width: 1440,
      height: 900,
    },
    {
      type: "image",
      src: "/images/projects/pipelineos/analytics.png",
      alt: "PipelineOS live PostgreSQL revenue analytics, funnel conversion rates, and rep performance",
      width: 1440,
      height: 900,
    },
    {
      type: "image",
      src: "/images/projects/pipelineos/login.png",
      alt: "PipelineOS sign-in screen with one-click demo access and credential login",
      width: 1440,
      height: 900,
    },
  ],
  architectureDiagram: {
    src: "/images/projects/pipelineos/architecture.svg",
    alt: "PipelineOS technical architecture connecting Next.js App Router UI, Zod-validated REST APIs, Drizzle ORM, and PostgreSQL",
    width: 1200,
    height: 620,
    caption: "PipelineOS system blueprint: Next.js 16 App Router, scrypt/cookie RBAC authentication, transactional lead conversion, and dual-driver PostgreSQL persistence.",
  },
  demoAccess: {
    deploymentTarget: "https://crm.aliarshad.co (live production web app with PostgreSQL)",
    demoEmail: "demo@pipelineos.studio",
    demoPassword: "PipelineDemo2026!",
    localRunCommand: "cd apps/pipelineos && npm install && npm run dev -- -p 3010",
    hostingNote:
      "Public sandbox demo is live at https://crm.aliarshad.co with HTTPS and persistent PostgreSQL data. The credentials below belong to an intentional fictional sandbox account — use Reset Demo Data inside the app anytime to restore the baseline dataset.",
  },
  attribution: {
    project: "Atomic CRM (Marmelab)",
    url: "https://github.com/marmelab/atomic-crm",
    license: "MIT",
    licenseUrl: "https://opensource.org/licenses/MIT",
    copyright: "Marmelab",
    originalWork:
      "Reference CRM domain modeling for contacts, companies, deals, notes, and sales pipeline stages under the permissive MIT License.",
    modifications: [
      "Clean-room TypeScript implementation built directly on Next.js 16 App Router and Drizzle ORM without React-Admin or Supabase dependencies",
      "Added transactional Lead → Contact + Deal conversion with immutable deal_stage_history audit logging",
      "Added custom scrypt password hashing, SHA-256 HttpOnly cookie sessions, RBAC enforcement, rate limiting, and 1-click seeded demo reset",
      "Built standalone deep-navy responsive UI with live PostgreSQL funnel analytics and automated E2E QA verification",
    ],
  },
  caseStudy: {
    background:
      "Prospective B2B clients evaluating a software studio want to interact with real, persistent business applications rather than static Figma slides. PipelineOS was built as a standalone CRM & Sales Management SaaS demonstrating full-stack architecture, database modeling, and conversion-ready UI polish.",
    challenge:
      "Many open-source CRM codebases rely on AGPL-3.0 licenses, proprietary Enterprise modules, or heavy 2–4 GB RAM container stacks that are expensive to host and legally restrictive for commercial agency reuse. The challenge was delivering a genuine PostgreSQL-backed CRM that is 100% permissively licensed, lightweight enough for $0/month commercial-compatible free hosting, and clean to demo repeatedly.",
    objectives: [
      "Deliver real CRUD persistence across contacts, leads, deals, notes, and follow-up tasks in PostgreSQL",
      "Model transactional business logic: atomic Lead → Contact + Deal conversion and immutable stage movement history",
      "Provide safe public demonstration access with one-click demo sign-in, rate limiting, and instant seeded dataset reset",
      "Establish an independent B2B SaaS visual identity distinct from the main portfolio website",
    ],
    approach:
      "Built as a self-contained Next.js 16 TypeScript application (`apps/pipelineos`) backed by Drizzle ORM and an 8-table PostgreSQL schema. A dual-driver database adapter connects seamlessly to Neon Free PostgreSQL in production (`DATABASE_URL`) while using persisted PostgreSQL-compatible PGlite locally for zero-friction development and deterministic CI/E2E testing.",
    features: [
      "Executive dashboard displaying open pipeline value, weighted forecast, won revenue, lead conversion rate, and overdue tasks",
      "Contacts directory with live search, CRUD forms, and per-contact communication timeline (notes, calls, emails, meetings)",
      "Lead capture & qualification queue with status tracking and atomic 1-click conversion into a Contact + Pipeline Deal",
      "6-stage Kanban pipeline board (New → Qualified → Proposal → Negotiation → Won / Lost) with stage-move audit history",
      "Activity & follow-up task manager linked directly to deals and contacts with overdue status indicators",
      "Live analytics view computed directly from PostgreSQL records (pipeline by stage, lead source attribution, rep performance)",
      "Demo Workspace Reset button that cleanly restores the realistic B2B demonstration dataset in a single transaction",
    ],
    decisions: [
      {
        title: "MIT clean-room stack over AGPL / Enterprise forks",
        text: "After directly auditing upstream license files, AGPL-3.0 and Enterprise-gated CRM repos were rejected. Modeling the workflow on MIT-licensed Atomic CRM concepts in TypeScript/Drizzle guarantees clean commercial ownership and ~150 MB runtime memory.",
      },
      {
        title: "Transactional lead conversion with stage history",
        text: "Converting a lead creates the Contact, opens a Deal, links the originating Lead ID, and records the opening stage history entry inside one PostgreSQL transaction so partial records can never exist.",
      },
      {
        title: "Integer-cent currency accounting",
        text: "All deal values and pipeline forecasts are stored as integer cents (`value_cents`) and formatted at display time, avoiding floating-point rounding drift in rollups and analytics.",
      },
    ],
    process: [
      "Audited open-source CRM repositories, license files, and commercial-compatible free hosting limits",
      "Designed the 8-table PostgreSQL relational schema, SQL migrations, and realistic B2B seed dataset",
      "Built authenticated REST endpoints with Zod validation, scrypt/cookie sessions, RBAC checks, and rate limiting",
      "Implemented the responsive deep-navy desktop/mobile interface across Dashboard, Contacts, Leads, Pipeline, Activities, and Analytics",
      "Verified every journey with automated unit/DB tests and headless Chromium desktop (1440px) & mobile (390px) E2E suites",
    ],
    solution:
      "A live, standalone CRM SaaS deployed at https://crm.aliarshad.co with HTTPS, persistent PostgreSQL storage, and a self-service sandbox workspace.",
    results: [
      "5/5 automated unit and real PostgreSQL integration tests pass (auth, Zod schemas, rate limiting, CRUD, atomic lead conversion, stage history, analytics, and demo reset).",
      "Headless Chromium E2E QA verified unauthenticated redirect, 1-click demo login, contact create/edit, lead conversion, live analytics update, task creation, and demo reset with zero console/page errors and zero overflow at 1440px and 390px.",
      "Production Next.js build (`npm run build`), TypeScript strict check (`tsc --noEmit`), and ESLint 9 pass with zero errors.",
    ],
  },
};

const STOCKFLOW: Project = {
  id: "p14",
  slug: "stockflow-inventory",
  title: "StockFlow — Inventory & Operations SaaS + Mobile App",
  seoTitle: "StockFlow — Multi-Warehouse Inventory SaaS & Mobile Case Study",
  seoDescription:
    "Explore StockFlow, a live multi-warehouse inventory platform and React Native mobile preview with atomic PostgreSQL transfers, barcode lookup, and order fulfillment.",
  categories: ["Web & Software", "Business Solutions"],
  tags: ["Inventory SaaS", "React Native & Expo", "Barcode Scanner", "Multi-Warehouse", "PostgreSQL"],
  year: "2026",
  summary:
    "A multi-warehouse inventory and operations platform paired with a real 11-screen React Native + Expo mobile companion app — sharing a single PostgreSQL database and versioned /api/v1 REST API for live barcode scanning, stock adjustments, transfers, and order fulfilment.",
  projectType: "Open-Source Adaptation",
  status: "Demo Ready",
  role: "Full-stack & mobile systems architect",
  contribution: [
    "Architected an 11-table PostgreSQL inventory schema covering products, EAN-13 barcodes, warehouses, per-bin stock levels, immutable movement ledgers, suppliers, purchase orders, customers, and sales orders",
    "Built dual Web HttpOnly-cookie and Mobile Authorization Bearer authentication on a unified `/api/v1/*` REST API with CORS support",
    "Engineered atomic PostgreSQL transactions preventing negative stock balances across receipts, adjustments, issues, inter-warehouse transfers, PO receiving, and SO reserve/fulfil/ship workflows",
    "Built the full StockFlow web operations console (`apps/stockflow`) in an industrial slate-emerald visual identity",
    "Built the genuine 11-screen React Native + Expo companion mobile app (`apps/stockflow-mobile`) with `expo-camera` barcode scanning, live stock adjustments, transfers, order receiving, and alerts",
    "Verified real-time web-to-mobile synchronization against the same PostgreSQL database via automated integration tests and Chromium E2E suites",
  ],
  technologies: [
    "Next.js 16",
    "React Native",
    "Expo SDK 52",
    "expo-camera",
    "TypeScript",
    "PostgreSQL",
    "Drizzle ORM",
    "Zod",
  ],
  featured: true,
  liveUrl: process.env.NEXT_PUBLIC_STOCKFLOW_URL?.trim() || "https://stock.aliarshad.co",
  sourceUrl: "https://github.com/aliarshad0909/My-own-Portfolio-2026",
  cover: {
    src: "/images/projects/stockflow/dashboard.png",
    alt: "StockFlow inventory operations dashboard showing total units on hand, stock valuation, low-stock alerts, warehouse breakdown, and movement feed",
    width: 1440,
    height: 900,
  },
  gallery: [
    {
      type: "image",
      src: "/images/projects/stockflow/products.png",
      alt: "StockFlow SKU catalog with EAN-13 barcodes, category filters, pricing, and multi-warehouse availability",
      width: 1440,
      height: 900,
    },
    {
      type: "image",
      src: "/images/projects/stockflow/warehouses.png",
      alt: "StockFlow multi-warehouse console with Austin, Chicago, and Newark hubs plus atomic stock transfer and adjustment forms",
      width: 1440,
      height: 900,
    },
    {
      type: "image",
      src: "/images/projects/stockflow/orders.png",
      alt: "StockFlow Purchase Orders receiving and Sales Orders reserve, fulfil, and dispatch workflow",
      width: 1440,
      height: 900,
    },
    {
      type: "image",
      src: "/images/projects/stockflow/movements.png",
      alt: "StockFlow immutable stock movement audit trail distinguishing web and mobile operator events",
      width: 1440,
      height: 900,
    },
  ],
  architectureDiagram: {
    src: "/images/projects/stockflow/architecture.svg",
    alt: "StockFlow system architecture showing Web Console and React Native Expo Mobile App sharing the /api/v1 REST backend and PostgreSQL database",
    width: 1200,
    height: 640,
    caption: "StockFlow unified web + mobile architecture: shared /api/v1 REST API serving both the Next.js operations console and the 11-screen Expo mobile app from one PostgreSQL ledger.",
  },
  demoAccess: {
    deploymentTarget: "https://stock.aliarshad.co (live web app & shared REST API) + https://stockflow-mobile-web.onrender.com (interactive mobile web preview)",
    demoEmail: "ops@stockflow.studio",
    demoPassword: "StockFlowDemo2026!",
    localRunCommand: "cd apps/stockflow && npm install && npm run dev -- -p 3020",
    hostingNote:
      "The StockFlow web application is live at https://stock.aliarshad.co with HTTPS and persistent PostgreSQL storage. The interactive mobile web preview is live at https://stockflow-mobile-web.onrender.com and writes to the same backend API using the intentional sandbox credentials below.",
  },
  mobilePreview: {
    headline: "StockFlow Mobile — React Native + Expo Companion App (11 Screens)",
    summary:
      "Built in TypeScript with Expo SDK 52 and native expo-camera barcode scanning, StockFlow Mobile authenticates via Bearer tokens directly against the live StockFlow /api/v1 backend at https://stock.aliarshad.co. Every barcode lookup, stock receipt, cycle count, warehouse transfer, and purchase order receipt writes atomically to the same PostgreSQL ledger.",
    distributionNote:
      "Three clear preview modes: (1) Verified mobile screenshots below, (2) Live Interactive Mobile Web Preview at https://stockflow-mobile-web.onrender.com (supports live API sync plus manual/quick EAN-13 lookup; native camera scanning requires a physical mobile device), and (3) React Native / Expo EAS Android APK source configuration (not yet published as a public APK or on the Apple App Store / Google Play Store).",
    interactiveWebUrl:
      process.env.NEXT_PUBLIC_STOCKFLOW_MOBILE_WEB_URL?.trim() || "https://stockflow-mobile-web.onrender.com",
    androidApkUrl: process.env.NEXT_PUBLIC_STOCKFLOW_APK_URL?.trim() || undefined,
    techBadges: [
      "React Native 0.76",
      "Expo SDK 52",
      "expo-camera (EAN-13 / Code-128 / QR)",
      "Bearer Token Auth",
      "AsyncStorage",
      "11 Native Screens",
    ],
    screens: [
      {
        label: "Mobile Dashboard",
        src: "/images/projects/stockflow/mobile-dashboard.png",
        alt: "StockFlow Mobile dashboard screen showing active Austin warehouse banner, 668 units on hand, stock valuation, quick operations, and low-stock watchlist",
        width: 780,
        height: 1688,
      },
      {
        label: "Barcode Scanner",
        src: "/images/projects/stockflow/mobile-scanner.png",
        alt: "StockFlow Mobile barcode scanner screen with live EAN-13 lookup matching SF-AUD-101 Studio Monitor Headphones Pro",
        width: 780,
        height: 1688,
      },
      {
        label: "Stock Adjustment",
        src: "/images/projects/stockflow/mobile-adjust.png",
        alt: "StockFlow Mobile stock adjustment screen with receipt/count/issue modes, interactive quantity stepper, and live projected balance",
        width: 780,
        height: 1688,
      },
      {
        label: "Orders & Receiving",
        src: "/images/projects/stockflow/mobile-orders.png",
        alt: "StockFlow Mobile orders screen with 1-tap Purchase Order receiving into warehouse and Sales Order fulfilment",
        width: 780,
        height: 1688,
      },
    ],
  },
  attribution: {
    project: "InvenTree",
    url: "https://github.com/inventree/InvenTree",
    license: "MIT",
    licenseUrl: "https://opensource.org/licenses/MIT",
    copyright: "InvenTree Contributors",
    originalWork:
      "Reference open-source inventory domain architecture for multi-location stock items, barcode scanning workflows, purchase/sales order fulfilment, and immutable stock tracking logs under the MIT License.",
    modifications: [
      "Clean-room TypeScript implementation built on Next.js 16 + Drizzle ORM + PostgreSQL (replacing Django/Python + Celery worker stack for lightweight free-tier deployment)",
      "Designed a unified versioned `/api/v1/*` REST API supporting both Web HttpOnly cookies and Mobile Bearer tokens simultaneously",
      "Built a dedicated 11-screen React Native + Expo SDK 52 mobile companion app (`apps/stockflow-mobile`) with `expo-camera` barcode scanning and EAS Android APK build configuration",
      "Added live movement source attribution (`web` vs `mobile`) and one-click seeded multi-warehouse demo reset",
    ],
  },
  caseStudy: {
    background:
      "Inventory-heavy e-commerce, sourcing, and distribution teams rarely work only at a desk — warehouse staff scan incoming cartons at receiving docks while operations managers review valuation and purchase orders on desktop. StockFlow was built to demonstrate full-stack SaaS plus real cross-platform mobile engineering backed by one source of truth.",
    challenge:
      "Running a traditional Python/Django + Redis + Celery inventory stack alongside a separate mobile app requires multiple paid servers and complex sync layers. The goal was to architect a single, transactional TypeScript/PostgreSQL platform that serves both a full desktop operations console and an 11-screen React Native + Expo mobile app without risking negative inventory or stale balances.",
    objectives: [
      "Maintain strict inventory integrity across multiple warehouses with atomic PostgreSQL transactions and an immutable movement ledger",
      "Support real-time synchronization between the web console and a React Native + Expo mobile companion app via one `/api/v1/*` API",
      "Implement all 11 operational mobile screens including native camera barcode scanning, adjustments, transfers, orders, and alerts",
      "Provide clean deployment blueprints (`render.yaml`, `eas.json`) for zero-cost commercial-compatible hosting and Android APK preview builds",
    ],
    approach:
      "Engineered two cohesive workspaces — `apps/stockflow` (Next.js 16 web console + `/api/v1/*` REST API + Drizzle PostgreSQL) and `apps/stockflow-mobile` (React Native + Expo SDK 52 + `expo-camera`). Every inventory mutation executes inside a PostgreSQL transaction that validates available stock, updates `stock_levels`, and appends an immutable `stock_movements` audit entry tagged with `source: \"web\"` or `source: \"mobile\"`.",
    features: [
      "Operations dashboard with real-time total units, cost valuation, low-stock alerts, warehouse distribution, and movement feed",
      "SKU catalog with unique SKU & EAN-13 barcode lookup, category filtering, cost/sell pricing, and per-warehouse bin breakdown",
      "Multi-warehouse management (Austin, Chicago, Newark demo hubs) with atomic stock receipts, cycle counts, issues, and inter-warehouse transfers",
      "Supplier & Purchase Order workflow with 1-tap full stock receiving directly into the destination warehouse",
      "Customer & Sales Order lifecycle enforcing Reserve → Fulfil (stock deduction) → Ship (carrier tracking)",
      "11-screen React Native + Expo mobile companion app covering Login, Dashboard, Products, Product Details, Barcode Scanner, Stock Adjustment, Warehouse Selection, Stock Transfer, Orders, Notifications, and Profile & Settings",
    ],
    decisions: [
      {
        title: "Dual cookie + Bearer session tokens on one REST API",
        text: "Web operators use HttpOnly SameSite cookies while the Expo mobile app sends `Authorization: Bearer <token>` headers stored in AsyncStorage — both validated against the same SHA-256 hashed PostgreSQL `sessions` table.",
      },
      {
        title: "Negative-stock guard & immutable movement ledger",
        text: "Stock adjustments, transfers, and sales order fulfilments compute resulting on-hand balances inside database transactions and reject any operation that would drop a warehouse bin below zero.",
      },
      {
        title: "Native camera scanner with simulator/web barcode fallback",
        text: "StockFlow Mobile uses native `expo-camera` `CameraView` for EAN-13/UPC/Code-128 scanning on iOS/Android hardware while providing manual entry and quick-test EAN-13 presets so evaluators can test real barcode lookup without a physical scanner.",
      },
    ],
    process: [
      "Designed the 11-table PostgreSQL inventory schema, Drizzle migrations, and realistic 3-warehouse seeded catalog",
      "Built and tested the versioned `/api/v1/*` REST API with atomic inventory ledger helpers and dual Web/Mobile auth",
      "Implemented the slate-emerald desktop operations console and verified all web CRUD & order workflows in Chromium",
      "Built all 11 screens of StockFlow Mobile in React Native + Expo SDK 52 with `eas.json` APK & iOS profiles",
      "Ran live end-to-end integration tests and 390×844 mobile browser QA confirming mobile scans and adjustments persist immediately to PostgreSQL",
    ],
    solution:
      "A complete multi-warehouse inventory platform (`apps/stockflow`) and 11-screen React Native + Expo mobile companion (`apps/stockflow-mobile`) verified end-to-end against a shared PostgreSQL backend.",
    results: [
      "StockFlow backend: 3/3 unit & full PostgreSQL workflow tests pass (product CRUD, multi-warehouse transfers, PO receiving, SO reserve/fulfil/ship, low-stock alerts, demo reset) alongside Next.js production build, typecheck, and ESLint.",
      "StockFlow Mobile: 4/4 API client & live backend sync tests pass against the running StockFlow server, `tsc --noEmit` passes with zero errors, and Expo Web bundles 305 modules cleanly.",
      "Headless Chromium mobile QA (390×844) verified Login, Dashboard, Products, Product Details, EAN-13 barcode scan (`8901234500101` → `SF-AUD-101`), live stock adjustment persisted with `source: \"mobile\"`, Orders, Alerts, and Warehouse Selection with zero runtime errors and zero overflow.",
    ],
  },
};

export const LIVE_PRODUCT_SLUGS = ["pipelineos-crm", "stockflow-inventory"] as const;

export const CORE_PROJECTS: Project[] = [
  PIPELINEOS, STOCKFLOW,
  COMMERCE, ANALYTICS, SUPPORT_AGENT, VOICE_AGENT, N8N, SUPPLY_CHAIN,
  SOURCING, BLENDER, MOTION, BRAND_SYSTEM, CHAIN_EXPLORER, SECURITY,
].map((proj) => {
  const dir = CORE_SOURCE_DIR[proj.slug];
  return dir
    ? {
        ...proj,
        sourceRepoPath: dir,
        sourceUrl: `${REPO_TREE_BASE}/${dir}`,
      }
    : proj;
});

/** 100 distinct software, AI, analytics, sourcing, brand, and creative project showcases. */
export const COMMERCIAL_PROJECTS: Project[] = [
  ...CORE_PROJECTS,
  ...EXPANSION_PROJECTS_A,
  ...EXPANSION_PROJECTS_B,
  ...EXPANSION_PROJECTS_C,
];

/** Full Work portfolio: 100 technical/creative project showcases + 20 playable browser game experiments. */
export const PROJECTS: Project[] = [
  ...COMMERCIAL_PROJECTS,
  ...GAME_WORK_ENTRIES,
];

/**
 * The remaining planned projects. These are deliberately NOT in PROJECTS:
 * nothing is shown as portfolio work until it is built and tested. /work lists
 * them as a pipeline so the roadmap is visible without inflating the count.
 */
export type PlannedProject = {
  title: string;
  category: ProjectCategory;
  projectType: ProjectType;
  note: string;
};

/**
 * Nothing is planned-but-unbuilt right now: every project in the expansion has
 * been built and tested. The array stays for the next one — /work hides the
 * pipeline section when it is empty.
 */
export const PLANNED: PlannedProject[] = [];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);

export const featuredProjects = (count = 3) => PROJECTS.filter((p) => p.featured).slice(0, count);

export const caseStudies = () => CORE_PROJECTS.filter((p) => p.caseStudy !== undefined);

/**
 * Indexable work: published projects and finished core demonstration builds.
 * Unbuilt Concepts, Sample Scenarios, local Prototypes, and In-Development
 * entries stay noindex and out of sitemap.xml so search engines never see
 * speculative concept pages as completed implementations.
 */
export const isIndexable = (p: Project) => p.status === "Published" || p.status === "Demo Ready";

/** Statuses safe to display in the public /work showcase gallery. */
export const isLive = (p: Project) =>
  p.status === "Demo Ready" ||
  p.status === "Prototype" ||
  p.status === "Playable Experiment" ||
  p.status === "Concept" ||
  p.status === "Sample Scenario" ||
  p.status === "Verified" ||
  p.status === "Published";

export const STATUS_NOTE: Record<ProjectStatus, string> = {
  Planned: "This project is scoped but not built yet.",
  "In Development": "This project is being built. Details may change.",
  "Demo Ready": "This is a working demonstration, not a client engagement. The brand and data are fictional.",
  Prototype:
    "This is a runnable studio prototype built and locally tested inside this repository using synthetic data — not a paid client deployment.",
  "Playable Experiment":
    "Personal browser game experiment built out of personal interest in interactive UI and state machines — not client work or a claimed game-development service line.",
  Concept:
    "Architecture Concept — illustrative studio design & technical scope paired with a small representative workflow prototype in project-lab/concepts/. Not a finished production build or client engagement.",
  "Sample Scenario":
    "Sample Scenario — illustrative fictional business brief & proposed architecture paired with a small representative workflow prototype. Not a real client, completed engagement, or verified outcome.",
  Verified: "This was a real engagement, confirmed with the client.",
  Published: "",
};

/** Related projects: shared categories first, then anything else. */
export function relatedProjects(project: Project, count = 2): Project[] {
  const others = PROJECTS.filter((p) => p.slug !== project.slug);
  const score = (p: Project) => p.categories.filter((c) => project.categories.includes(c)).length;
  return [...others].sort((a, b) => score(b) - score(a)).slice(0, count);
}
