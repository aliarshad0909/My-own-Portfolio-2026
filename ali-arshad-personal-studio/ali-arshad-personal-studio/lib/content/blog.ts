/**
 * Studio Blog & Engineering Journal (`/blog`, `/blog/[slug]`, `/blog/rss.xml`).
 *
 * Complements `/resources` (evergreen buyer decision guides) with timely AI
 * engineering notes, transparent studio build logs, service explainers,
 * creative workflow breakdowns, and browser-game engineering dispatches.
 *
 * Truthfulness rules:
 *  - Every build log describes ONLY verified builds, prototypes, or games that
 *    genuinely exist in this repository.
 *  - Technical standards & AI ecosystem references cite direct primary specs
 *    and distinguish verified facts from studio opinion.
 *  - Easy to extend: append a typed `BlogPost` record below.
 */

import type { LocalSource } from "@/lib/geo/local-content-types";

export const BLOG_CATEGORIES = [
  "AI Developments",
  "Build Logs",
  "Service Explainers",
  "Creative Workflows",
  "Games & Experiments",
  "Business Technology",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogVisual = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  /** True for dark technical diagrams that should use the obsidian diagram frame. */
  darkDiagram?: boolean;
};

export type BlogPost = {
  slug: string;
  title: string;
  category: BlogCategory;
  excerpt: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  /** Purposeful domain-specific screenshot or architecture diagram accompanying this article. */
  visual?: BlogVisual;
  /** Explicit factual vs. opinion/status note shown cleanly on the article. */
  editorialNote?: string;
  sections: BlogSection[];
  sources?: LocalSource[];
  relatedLinks: { label: string; href: string; kind: string }[];
};

export function estimateReadingMinutes(post: BlogPost): number {
  const words = post.sections
    .flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])])
    .join(" ")
    .trim()
    .split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 210));
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "building-20-browser-games-typescript",
    title: "Building 20 Lightweight Browser Games in TypeScript Without External Game Engines",
    category: "Games & Experiments",
    excerpt:
      "How we engineered twenty original interactive puzzles across six genres using pure TypeScript state engines, GF(2) hint solvers, keyboard focus grids, and reduced-motion fallbacks.",
    author: "Ali Arshad",
    publishedAt: "2026-11-24",
    updatedAt: "2026-11-24",
    tags: ["TypeScript", "React", "Accessibility", "State Machines", "Games"],
    visual: {
      src: "/images/site-visuals/specializations/nextjs-app-router-architecture.svg",
      alt: "Modular TypeScript state-engine and lazy-loaded React UI architecture schematic",
      width: 1200,
      height: 720,
      caption: "Modular TypeScript architecture separating deterministic pure-logic modules from lazy-loaded interactive React views.",
      darkDiagram: true,
    },
    editorialNote:
      "Build log describing original portfolio experiments built directly inside this repository — not client work.",
    sections: [
      {
        heading: "Why separate pure game engines from React UI",
        paragraphs: [
          "Browser mini-games quickly turn fragile when canvas loops, DOM events, and win-condition math sit inside one component. Across all twenty games under /games, every board generator, move validator, and completion check lives inside pure TypeScript modules under lib/games/.",
          "Separating pure state transitions makes every puzzle testable with Node's native test runner before a single browser frame renders. Our Signal Link levels verify 100% disjoint full-grid coverage mathematically, and every Pulse Grid scramble tracks its exact remaining toggle set via GF(2) XOR arithmetic so the Hint button is always exact.",
        ],
      },
      {
        heading: "Designing for keyboard, touch, colorblindness, and reduced motion",
        paragraphs: [
          "Interactive experiments are only enjoyable when they work comfortably outside a desktop mouse setup. Every game avoids relying on color alone — Signal Link pairs colors with letters A–F, Cipher Five adds ✓ and ~ indicators, and Contrast Judge grades live WCAG 2.2 luminance math directly.",
          "Under prefers-reduced-motion: reduce, transitions snap cleanly to instant reveals and Orbit Catch switches automatically from continuous ticks to a calm discrete-step cadence.",
        ],
        bullets: [
          "Lazy-loaded via next/dynamic so visiting /games never ships all 20 engines upfront",
          "Zero third-party physics or WebGL dependencies — crisp inline SVGs and CSS grids",
          "Explicit Restart, Undo/Hint where appropriate, and accessible aria-live status readouts",
        ],
      },
    ],
    relatedLinks: [
      { label: "Play all 20 Browser Games", href: "/games", kind: "Interactive Lab" },
      { label: "Play Signal Link", href: "/games/signal-link", kind: "Game" },
      { label: "Try WCAG Contrast Judge", href: "/games/contrast-judge", kind: "Game" },
      { label: "React Application Development", href: "/services/web-development/react-applications", kind: "Service" },
    ],
  },
  {
    slug: "engineering-pipelineos-stockflow-sandboxes",
    title: "How We Built PipelineOS and StockFlow as Inspectable PostgreSQL Sandboxes",
    category: "Build Logs",
    excerpt:
      "A practical look behind our two publicly deployed studio demonstrations — integer-cent schemas, atomic transfers, shared mobile REST APIs, and one-click demo resets.",
    author: "Ali Arshad",
    publishedAt: "2026-11-24",
    updatedAt: "2026-11-24",
    tags: ["Next.js", "PostgreSQL", "Drizzle ORM", "CRM", "Inventory"],
    visual: {
      src: "/images/projects/pipelineos/dashboard.png",
      alt: "PipelineOS CRM live sandbox dashboard displaying revenue KPIs, pipeline conversion metrics, and recent activity",
      width: 1440,
      height: 900,
      caption: "Live screenshot of the PipelineOS CRM PostgreSQL sandbox running with synthetic seeded data.",
    },
    editorialNote:
      "Describes real studio demonstration builds (fictional seeded data, publicly testable at crm.aliarshad.co and stock.aliarshad.co — not paid client deployments).",
    sections: [
      {
        heading: "Why static screenshots are not enough proof for software buyers",
        paragraphs: [
          "When evaluating an independent developer for a custom CRM or multi-warehouse inventory platform, static UI mockups hide the hardest engineering decisions: transactional integrity, error states, data modeling, and resettable environments.",
          "Both PipelineOS CRM and StockFlow Inventory run against real PostgreSQL databases using Drizzle ORM, strict TypeScript validation, and integer-cent currency columns so totals never suffer floating-point drift.",
        ],
      },
      {
        heading: "Sharing one versioned REST contract between Web and Expo Mobile",
        paragraphs: [
          "StockFlow pairs its desktop operations console with an 11-screen React Native / Expo companion verified against the exact same /api/v1 endpoints. Barcode scans and warehouse transfers execute inside database transactions so source and destination stock rows can never diverge.",
        ],
        bullets: [
          "Transactional lead conversion in PipelineOS prevents partial contact/deal creation",
          "Append-only movement tracking preserves an auditable trail for every stock adjustment",
          "One-click demo reset restores realistic fictional companies safely for each reviewer",
        ],
      },
    ],
    relatedLinks: [
      { label: "PipelineOS CRM Case Study", href: "/case-studies/pipelineos-crm", kind: "Live Demo" },
      { label: "StockFlow Inventory Case Study", href: "/case-studies/stockflow-inventory", kind: "Live Demo" },
      { label: "Custom CRM Development", href: "/services/web-development/custom-crm-development", kind: "Service" },
      { label: "Custom Inventory Software", href: "/services/business-dashboards/inventory-software", kind: "Service" },
    ],
  },
  {
    slug: "mcp-tool-use-guardrails-business-ai-agents",
    title: "Model Context Protocol (MCP), Tool Use, and Practical Guardrails for Business AI Agents",
    category: "AI Developments",
    excerpt:
      "Separating open-standard facts from hype: how structured tool protocols like MCP work alongside deterministic state machines, confidence floors, and mandatory human escalation.",
    author: "Ali Arshad",
    publishedAt: "2026-11-24",
    updatedAt: "2026-11-24",
    tags: ["AI Agents", "MCP", "RAG", "Guardrails", "Architecture"],
    visual: {
      src: "/images/site-visuals/specializations/ai-agent-guardrail-loop.svg",
      alt: "AI agent guardrail architecture showing read-only retrieval, schema-validated tool calls, confidence floors, and human escalation",
      width: 1200,
      height: 720,
      caption: "Practical AI guardrail loop pairing structured tool protocols with deterministic abstention and human review.",
      darkDiagram: true,
    },
    editorialNote:
      "Distinguishes documented open specifications (cited directly below) from studio engineering recommendations.",
    sections: [
      {
        heading: "What open tool protocols actually standardize (Fact)",
        paragraphs: [
          "According to the official Model Context Protocol specification, MCP standardizes how LLM host applications discover and invoke external tools, read-only resources, and prompt templates over JSON-RPC rather than maintaining bespoke one-off integrations per model provider.",
          "Paired with schema-validated structured outputs documented across major LLM APIs, teams can enforce strict parameter types before an agent ever queries a database or drafts a CRM action.",
        ],
      },
      {
        heading: "Why protocols alone do not replace application guardrails (Studio Perspective)",
        paragraphs: [
          "In our engineering view, standardized tool wiring solves connectivity — not business safety. A customer-facing support or qualification agent still needs three deterministic layers inside your own application code:",
        ],
        bullets: [
          "Read-only vs. write-action separation: let retrieval tools read policies freely, but require human approval before issuing refunds or modifying billing",
          "Explicit abstention thresholds: when retrieval scores fall below a tuned floor (as implemented in our Tideline BM25 demo), escalate instead of improvising",
          "Regression evaluation suites: run automated test queries against known policy edge cases before every prompt or index change",
        ],
      },
    ],
    sources: [
      {
        title: "Model Context Protocol — Architecture & Specification",
        url: "https://modelcontextprotocol.io/specification/2025-03-26",
        publisher: "Model Context Protocol (Anthropic / Open Specification)",
        accessed: "2026-11-24",
      },
      {
        title: "OWASP Top 10 for Large Language Model Applications",
        url: "https://genai.owasp.org/llm-top-10/",
        publisher: "OWASP GenAI Security Project",
        accessed: "2026-11-24",
      },
    ],
    relatedLinks: [
      { label: "AI Agent Development Service", href: "/services/ai-agents", kind: "Service" },
      { label: "Tideline BM25 Support Agent Demo", href: "/case-studies/tideline-support-agent", kind: "Demo" },
      { label: "AI Agent vs. Chatbot Guide", href: "/resources/ai-agent-vs-chatbot", kind: "Resource" },
    ],
  },
  {
    slug: "when-self-hosted-n8n-beats-saas-automation",
    title: "When Self-Hosted n8n Beats Per-Task SaaS Automation — and When It Doesn't",
    category: "Business Technology",
    excerpt:
      "An honest operational comparison of self-hosted n8n workflows versus hosted Zapier/Make plans: cost predictability, JavaScript Code-node testing, maintenance overhead, and ownership.",
    author: "Ali Arshad",
    publishedAt: "2026-11-24",
    updatedAt: "2026-11-24",
    tags: ["n8n", "Automation", "Operations", "Self-Hosting"],
    visual: {
      src: "/images/site-visuals/resources/n8n-vs-zapier-scaling.svg",
      alt: "Cost and scalability comparison diagram between self-hosted n8n workflows and per-task SaaS automation tiers",
      width: 1200,
      height: 720,
      caption: "Operational trade-off schematic comparing per-task SaaS automation billing against self-hosted n8n infrastructure.",
      darkDiagram: true,
    },
    sections: [
      {
        heading: "Where self-hosted n8n shines for growing operations teams",
        paragraphs: [
          "Per-task automation pricing feels painless at 500 events a month and painful at 50,000 webhook events a month. Self-hosting n8n shifts costs from per-step billing to predictable server hosting while letting engineers write version-controlled JavaScript Code nodes, custom retries, and internal database calls.",
          "In our Inbound Lead Qualification workflow demonstration, extracting and running 22 automated tests directly against the workflow JSON catches scoring and email-validation regressions before deployment.",
        ],
      },
      {
        heading: "When a hosted no-code connector is still the smarter choice",
        paragraphs: [
          "Self-hosting is not free of responsibility. If a two-person team only runs three simple form-to-Slack alerts per day and has nobody maintaining updates or backups, a lightweight managed SaaS plan can save administrative effort.",
          "Before migrating, model realistic weekly manual hours saved and hosting/maintenance effort side by side.",
        ],
      },
    ],
    sources: [
      {
        title: "n8n Official Documentation — Hosting & Code Nodes",
        url: "https://docs.n8n.io/hosting/",
        publisher: "n8n Docs",
        accessed: "2026-11-24",
      },
    ],
    relatedLinks: [
      { label: "n8n Workflow Automation Service", href: "/services/n8n-automation", kind: "Service" },
      { label: "Automation ROI Calculator", href: "/tools/automation-roi-calculator", kind: "Tool" },
      { label: "n8n vs. Zapier Buyer Guide", href: "/resources/n8n-vs-zapier", kind: "Resource" },
    ],
  },
  {
    slug: "designing-accessible-dark-mode-brand-systems",
    title: "Designing Accessible Dark-Mode Brand Systems With Measured WCAG 2.2 Luminance",
    category: "Creative Workflows",
    excerpt:
      "Why vibrant accent colors often fail on dark surfaces, how relative luminance math eliminates guesswork, and how brand tokens drop directly into production CSS.",
    author: "Ali Arshad",
    publishedAt: "2026-11-24",
    updatedAt: "2026-11-24",
    tags: ["WCAG 2.2", "Design Systems", "Branding", "Accessibility", "CSS"],
    visual: {
      src: "/images/projects/brand-system/contrast.webp",
      alt: "Halcyon Brand System live WCAG 2.2 relative-luminance contrast matrix and pair checker screenshot",
      width: 1600,
      height: 1075,
      caption: "Real screenshot from the Halcyon Brand System demonstration measuring WCAG 2.2 contrast ratios live on render.",
    },
    sections: [
      {
        heading: "Why brand palettes break between pitch decks and real web UI",
        paragraphs: [
          "Many brand identity decks pick warm corals, ambers, or mid-slates purely by aesthetic feel on bright white slide backgrounds. The moment developers put white text on a coral button or muted grey captions on obsidian cards, contrast drops well below the WCAG 2.2 AA threshold of 4.5:1.",
          "Measuring exact sRGB relative luminance during identity creation solves that gap upfront — pairing dark ink (#140f0d) on warm coral buttons while brightening secondary text tokens for effortless dark-mode legibility.",
        ],
      },
      {
        heading: "Test your own eye with real contrast math",
        paragraphs: [
          "We built the exact WCAG 2.2 relative luminance formula into both our Halcyon Brand System demonstration (50 automated checks) and our playable Contrast Judge browser game so founders and designers can see real ratios immediately.",
        ],
      },
    ],
    sources: [
      {
        title: "Web Content Accessibility Guidelines (WCAG) 2.2 — Contrast (Minimum)",
        url: "https://www.w3.org/TR/WCAG22/#contrast-minimum",
        publisher: "W3C",
        accessed: "2026-11-24",
      },
    ],
    relatedLinks: [
      { label: "Play Contrast Judge (WCAG 2.2 Game)", href: "/games/contrast-judge", kind: "Game" },
      { label: "Halcyon Brand System Case Study", href: "/case-studies/halcyon-brand-system", kind: "Demo" },
      { label: "Brand Identity Design Service", href: "/services/branding/identity", kind: "Service" },
    ],
  },
  {
    slug: "reproducible-blender-bpy-rigs-ffmpeg-pipelines",
    title: "Why Reproducible Blender Python (bpy) Rigs and Probed ffmpeg Pipelines Beat Manual Exports",
    category: "Creative Workflows",
    excerpt:
      "Treating 3D camera geometry and web-video encoding as versioned, tested code — plus an honest status report on what is built versus still in preparation in our repo.",
    author: "Ali Arshad",
    publishedAt: "2026-11-24",
    updatedAt: "2026-11-24",
    tags: ["Blender", "Python", "ffmpeg", "Creative Production", "3D"],
    visual: {
      src: "/images/site-visuals/services/creative-production/production-encoding-pipeline.svg",
      alt: "Automated ffprobe and ffmpeg media encoding pipeline producing H.264 faststart, VP9, WebP posters, and storyboard contact sheets",
      width: 1200,
      height: 720,
      caption: "Technical architecture diagram of the tested ffmpeg/ffprobe media preparation pipeline.",
      darkDiagram: true,
    },
    editorialNote:
      "Transparent status note: the bpy geometry/lighting builder (20 tests) and ffmpeg encoding CLI (28 tests) are built and verified, while playable Studio Motion Demos live on /services/creative-production. External client footage stays private until written clearance is confirmed.",
    sections: [
      {
        heading: "Scripted camera math prevents shot-to-shot drift",
        paragraphs: [
          "Hand-dragging cameras inside a 3D viewport works for one hero image and falls apart when a product line needs six identical angles across four material finishes. Expressing spherical camera coordinates and three-point lighting in Python lets pure math functions pass unit tests even before invoking Blender Cycles.",
        ],
      },
      {
        heading: "Why probing real video streams prevents silent web-playback bugs",
        paragraphs: [
          "Web video breaks quietly when MP4 files ship without the +faststart moov atom, carry odd pixel dimensions that break VP9, or leave unmuted audio tracks inside hover previews. Running ffprobe before encoding enforces safe constraints automatically.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Creative Production Service", href: "/services/creative-production", kind: "Service" },
      { label: "Motion Production Media Pipeline", href: "/case-studies/motion-production-pipeline", kind: "Demo" },
      { label: "Blender Scene System (In Development)", href: "/case-studies/blender-product-visualisation", kind: "In Dev" },
      { label: "RTX GPU Compute Consultation", href: "/services/gpu-compute", kind: "Consultation" },
    ],
  },
  {
    slug: "how-one-remote-studio-scopes-ships-software",
    title: "How One Remote Studio Scopes, Builds, and Hands Off Full-Stack Software Without Retainer Lock-In",
    category: "Service Explainers",
    excerpt:
      "What working directly with an independent technical studio actually looks like: discovery questions, plain-language written scopes, staged preview URLs, and 100% client ownership.",
    author: "Ali Arshad",
    publishedAt: "2026-11-24",
    updatedAt: "2026-11-24",
    tags: ["Remote Delivery", "Scoping", "Freelance", "Client Process"],
    visual: {
      src: "/images/site-visuals/resources/studio-vs-agency-model.svg",
      alt: "Comparison diagram contrasting direct one-studio technical execution against layered agency account hand-offs",
      width: 1200,
      height: 720,
      caption: "Direct studio delivery model showing written scoping, staged preview builds, and clean client repository ownership.",
      darkDiagram: true,
    },
    sections: [
      {
        heading: "Start with constraints, not a bloated feature wishlist",
        paragraphs: [
          "The fastest way to waste software budget is building ten speculative features before validating the two core workflows your team uses every day. Every engagement starts with a concise discovery conversation focused on what is broken today, what existing systems must stay untouched, and what a realistic Version 1 looks like.",
        ],
      },
      {
        heading: "Staged preview links, transparent collaboration, and clean ownership",
        paragraphs: [
          "Instead of disappearing for six weeks behind status slides, builds progress through inspectable staging URLs, automated test coverage, and repositories owned directly by your organization. When a build genuinely needs external specialist depth (such as formal security audits or smart-contract work), vetted independent collaborators from our Studio Network are introduced openly upfront.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Compare All 6 Studio Services", href: "/services#compare-services", kind: "Services" },
      { label: "Web Project Cost Estimator", href: "/tools/web-project-estimator", kind: "Tool" },
      { label: "Studio Network Collaboration", href: "/studio-network", kind: "Network" },
      { label: "Start a Project", href: "/contact", kind: "Contact" },
    ],
  },
  {
    slug: "structured-data-llms-txt-honest-aeo",
    title: "Structured Data, llms.txt, and Honest AEO: Making Technical Portfolios Machine-Readable Without Hype",
    category: "Business Technology",
    excerpt:
      "How clean @id-linked JSON-LD, crawlable SSR HTML, strict noindex gates, and plain-text llms.txt summaries help search engines and answer engines interpret a site accurately — without promising rankings.",
    author: "Ali Arshad",
    publishedAt: "2026-11-24",
    updatedAt: "2026-11-24",
    tags: ["SEO", "AEO", "JSON-LD", "llms.txt", "Next.js"],
    visual: {
      src: "/images/site-visuals/resources/nextjs-app-router-seo.svg",
      alt: "Technical SEO and structured data diagram for Next.js App Router showing SSR HTML, @id JSON-LD graphs, and strict sitemap gating",
      width: 1200,
      height: 720,
      caption: "Machine-readable portfolio architecture pairing crawlable SSR routes with @id-linked JSON-LD and strict noindex gates.",
      darkDiagram: true,
    },
    sections: [
      {
        heading: "Entity clarity beats keyword stuffing",
        paragraphs: [
          "Search engines and AI answer systems parse clear entity relationships far better than repeated keyword blocks. Linking Person (#person), ProfessionalService (#studio), WebSite (#website), Service, SoftwareApplication, VideoGame, and Article JSON-LD nodes via consistent @id anchors removes ambiguity about who built what — provided every claim matches visible page text.",
        ],
      },
      {
        heading: "Why keeping incomplete pages out of the sitemap protects trust",
        paragraphs: [
          "Publishing 60 unbuilt concepts or dozens of thin city pages into sitemap.xml undermines site quality. Strict publication gates keep unverified city pages, unbuilt architecture concepts, and consultation-only GPU pages cleanly noindex until real evidence exists — and honest AEO never promises guaranteed placement inside ChatGPT, Gemini, or Google search results.",
        ],
      },
    ],
    sources: [
      {
        title: "Google Search Central — Structured Data General Guidelines",
        url: "https://developers.google.com/search/docs/appearance/structured-data/sd-policies",
        publisher: "Google Search Central",
        accessed: "2026-11-24",
      },
      {
        title: "Schema.org Vocabulary Reference",
        url: "https://schema.org/docs/schemas.html",
        publisher: "Schema.org",
        accessed: "2026-11-24",
      },
    ],
    relatedLinks: [
      { label: "Read /llms.txt", href: "/llms.txt", kind: "Machine Readable" },
      { label: "Next.js SEO Best Practices Guide", href: "/resources/nextjs-seo", kind: "Resource" },
      { label: "Next.js Development Service", href: "/services/web-development/nextjs", kind: "Service" },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function allBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}
