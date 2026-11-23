/**
 * Editorial Insights / Blog content registry.
 *
 * Every post distinguishes its editorial framing (`Project Notes`,
 * `Original Opinion`, or `Sourced Guide`), records author, publish/update
 * dates, and cites primary documentation URLs with verification dates for
 * factual or time-sensitive claims.
 */

export const INSIGHT_CATEGORIES = [
  "Product Build Notes",
  "AI & Automation",
  "Web Engineering",
  "Analytics & Operations",
  "Motion & Creative",
] as const;

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export type InsightKind = "Project Notes" | "Original Opinion" | "Sourced Guide";

export type InsightSource = {
  label: string;
  publisher: string;
  url: string;
  checkedDate: string;
};

export type InsightSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type InsightPost = {
  slug: string;
  title: string;
  seoDescription: string;
  excerpt: string;
  kind: InsightKind;
  category: InsightCategory;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  coverVariant: "crm" | "inventory" | "automation" | "motion";
  status: "Published" | "Draft";
  sections: InsightSection[];
  sources: InsightSource[];
  relatedServiceLabel: string;
  relatedServiceHref: string;
  relatedProjectSlugs: string[];
  relatedInsightSlugs: string[];
};

export const INSIGHTS: InsightPost[] = [
  {
    slug: "building-pipelineos-mit-clean-crm",
    title: "Why We Audited Open-Source CRM Licenses Before Building PipelineOS",
    seoDescription:
      "Engineering build notes from PipelineOS CRM: auditing AGPL vs. MIT open-source foundations, modeling integer-cent deal pipelines, and shipping transactional lead conversion in Next.js and PostgreSQL.",
    excerpt:
      "Build notes on choosing an MIT-clean architecture over AGPL/Enterprise CRM forks, avoiding floating-point revenue drift, and keeping lead-to-deal conversion atomic in PostgreSQL.",
    kind: "Project Notes",
    category: "Product Build Notes",
    tags: ["Next.js", "PostgreSQL", "Drizzle ORM", "CRM Architecture", "Open Source"],
    author: "Ali Arshad",
    publishedAt: "2026-11-23",
    updatedAt: "2026-11-23",
    readingMinutes: 5,
    coverVariant: "crm",
    status: "Published",
    sections: [
      {
        heading: "Why license due diligence comes before writing code",
        paragraphs: [
          "When scoping PipelineOS as a live demonstration CRM for the studio, the first step was reading upstream LICENSE files rather than cloning the most starred repository. Several popular open-source CRMs pair AGPL-3.0 licensing with proprietary Enterprise directories and heavy multi-container memory footprints.",
          "For commercial client builds — or a reusable studio architecture — copyleft restrictions and proprietary modules create avoidable legal friction. Modeling the workflow cleanly on MIT-licensed concepts (such as Marmelab Atomic CRM) in a lean Next.js 16 + Drizzle ORM + PostgreSQL stack gave us full ownership, predictable hosting costs, and a compact runtime.",
        ],
      },
      {
        heading: "Designing atomic lead conversion and integer-cent accounting",
        paragraphs: [
          "Two bugs routinely break early-stage custom CRMs: partial lead conversions that leave orphaned contacts without deals, and floating-point rounding drift in pipeline rollups.",
        ],
        bullets: [
          "Lead conversion executes inside one PostgreSQL transaction: creating the Contact, opening the Deal, linking the originating Lead, and writing the opening deal_stage_history audit entry together.",
          "Every deal value and weighted forecast is stored as integer cents in PostgreSQL and formatted only at the UI boundary.",
          "Public sandbox access uses scrypt password hashing, SHA-256 HttpOnly cookie sessions, CSRF origin validation, rate limiting, and a 1-click Reset Demo workspace button so visitors can test safely.",
        ],
      },
      {
        heading: "What you can inspect live",
        paragraphs: [
          "PipelineOS is live at crm.aliarshad.co using fictional B2B demonstration data. Visitors can create contacts, convert leads, move deals across the six-stage Kanban board, verify live PostgreSQL analytics updates, and reset the sandbox workspace cleanly.",
        ],
      },
    ],
    sources: [
      {
        label: "Marmelab Atomic CRM (MIT License)",
        publisher: "GitHub / Marmelab",
        url: "https://github.com/marmelab/atomic-crm",
        checkedDate: "2026-11-23",
      },
      {
        label: "Drizzle ORM PostgreSQL Transactions Documentation",
        publisher: "Drizzle Team",
        url: "https://orm.drizzle.team/docs/transactions",
        checkedDate: "2026-11-23",
      },
    ],
    relatedServiceLabel: "Web & Software Development",
    relatedServiceHref: "/services/web-development",
    relatedProjectSlugs: ["pipelineos-crm", "northwind-analytics-dashboard"],
    relatedInsightSlugs: [
      "preventing-negative-inventory-postgres-transactions",
      "practical-ai-agents-human-handoff-architecture",
    ],
  },
  {
    slug: "preventing-negative-inventory-postgres-transactions",
    title: "Preventing Negative Inventory Across Web & Mobile with PostgreSQL Transactions",
    seoDescription:
      "How StockFlow synchronizes a desktop web console and an 11-screen React Native + Expo mobile companion against one atomic PostgreSQL inventory ledger.",
    excerpt:
      "Build notes from StockFlow: sharing one versioned /api/v1 REST API across web cookies and mobile Bearer tokens while enforcing atomic bin balances and an immutable audit trail.",
    kind: "Project Notes",
    category: "Web Engineering",
    tags: ["PostgreSQL", "Inventory Systems", "React Native", "Expo", "REST API"],
    author: "Ali Arshad",
    publishedAt: "2026-11-23",
    updatedAt: "2026-11-23",
    readingMinutes: 6,
    coverVariant: "inventory",
    status: "Published",
    sections: [
      {
        heading: "Why spreadsheet and client-side stock math drifts",
        paragraphs: [
          "Warehouse operations happen concurrently: a receiving clerk scans incoming cartons on a phone while an operations manager reserves inventory for a wholesale sales order on desktop. If balances are updated loosely on the client without server-side transactional guards, on-hand stock quickly drops below zero.",
        ],
      },
      {
        heading: "One transactional ledger serving both Web and Mobile",
        paragraphs: [
          "StockFlow keeps both the Next.js operations console (stock.aliarshad.co) and the React Native + Expo companion app connected to the exact same /api/v1/* endpoints and 11-table PostgreSQL schema.",
        ],
        bullets: [
          "Dual authentication on one sessions table: HttpOnly cookies for the web console and Authorization: Bearer tokens for the mobile companion.",
          "Every receipt, cycle count, issue, inter-warehouse transfer, PO receive, and SO fulfillment checks resulting balances inside a database transaction and rejects operations that would create negative stock.",
          "Every stock mutation writes an immutable stock_movements entry tagged with source: 'web' or source: 'mobile' so operators can audit where each change originated.",
        ],
      },
      {
        heading: "Honest separation of web preview vs. native camera hardware",
        paragraphs: [
          "Because prospective clients often evaluate on a laptop first, StockFlow pairs the live web console with an interactive Expo Web preview (stockflow-mobile-web.onrender.com) supporting manual and quick-test EAN-13 lookups. Live camera barcode scanning via expo-camera is implemented in the React Native codebase and requires a native build on a physical phone.",
        ],
      },
    ],
    sources: [
      {
        label: "InvenTree Open-Source Inventory Reference (MIT License)",
        publisher: "GitHub / InvenTree",
        url: "https://github.com/inventree/InvenTree",
        checkedDate: "2026-11-23",
      },
      {
        label: "Expo Camera Documentation (Barcode Scanning)",
        publisher: "Expo",
        url: "https://docs.expo.dev/versions/latest/sdk/camera/",
        checkedDate: "2026-11-23",
      },
    ],
    relatedServiceLabel: "Business Dashboards & Operations Tools",
    relatedServiceHref: "/services/business-dashboards",
    relatedProjectSlugs: ["stockflow-inventory", "meridian-inventory-operations"],
    relatedInsightSlugs: [
      "building-pipelineos-mit-clean-crm",
      "practical-ai-agents-human-handoff-architecture",
    ],
  },
  {
    slug: "practical-ai-agents-human-handoff-architecture",
    title: "Designing Practical AI Agents & n8n Workflows with Clear Human Hand-Offs",
    seoDescription:
      "Original studio perspective on building reliable AI support agents and n8n automation pipelines that route routine work automatically while escalating judgment calls to people.",
    excerpt:
      "Where AI automation actually pays off for small and mid-sized businesses — and why explicit escalation gates, structured outputs, and audit logs matter more than fully autonomous hype.",
    kind: "Original Opinion",
    category: "AI & Automation",
    tags: ["AI Agents", "n8n", "Workflow Automation", "Human-in-the-Loop", "Operations"],
    author: "Ali Arshad",
    publishedAt: "2026-11-23",
    updatedAt: "2026-11-23",
    readingMinutes: 5,
    coverVariant: "automation",
    status: "Published",
    sections: [
      {
        heading: "Automate repeatable routing, not high-stakes judgment",
        paragraphs: [
          "Most failed business automation projects try to replace an entire relationship or exception-heavy workflow on day one. In practice, the highest-return automation sits at the intake and coordination layer: validating form fields, enriching company context, classifying support questions against verified policies, updating a CRM, and preparing a clean summary for a human owner.",
          "This is the principle behind both the Tideline Support Agent and the n8n Inbound Lead-Qualification Workflow demonstrations in this portfolio: deterministic steps run automatically, while ambiguous requests or commercial commitments escalate cleanly to a person.",
        ],
      },
      {
        heading: "Four guardrails every production workflow needs",
        paragraphs: [
          "Before putting an AI agent or n8n pipeline in front of real leads or customers, four engineering basics separate dependable systems from brittle demos:",
        ],
        bullets: [
          "Schema-validated outputs (e.g., strict JSON / Zod validation) between the LLM step and any CRM, email, or ticketing API.",
          "Explicit confidence and policy escalation triggers (refund disputes, legal terms, custom enterprise pricing always route to a human queue).",
          "Idempotency keys and retry handling so a webhook timeout never creates duplicate deals or double-sends follow-up emails.",
          "Readable execution logs showing inputs, model classification, and downstream API responses so teams can debug quickly.",
        ],
      },
      {
        heading: "Starting with a narrow, measurable pilot",
        paragraphs: [
          "Rather than buying an all-in-one AI platform upfront, start with one repetitive workflow your team performs dozens of times a week, map the exact decision tree on paper, and measure time saved and error rate over two weeks before expanding.",
        ],
      },
    ],
    sources: [
      {
        label: "n8n Official Documentation — Error Handling & AI Workflows",
        publisher: "n8n",
        url: "https://docs.n8n.io/",
        checkedDate: "2026-11-23",
      },
    ],
    relatedServiceLabel: "AI Agents & n8n Workflow Automation",
    relatedServiceHref: "/services/ai-agents",
    relatedProjectSlugs: ["tideline-support-agent", "inbound-lead-qualification-workflow"],
    relatedInsightSlugs: [
      "building-pipelineos-mit-clean-crm",
      "designing-motion-and-3d-without-hurting-web-performance",
    ],
  },
  {
    slug: "designing-motion-and-3d-without-hurting-web-performance",
    title: "Using Motion Graphics and Selective 3D Without Hurting Web Performance",
    seoDescription:
      "A sourced engineering and creative guide to pairing product visuals, Remotion loops, and lightweight 3D interactions with fast Core Web Vitals and reduced-motion accessibility.",
    excerpt:
      "How to bring studio-grade visual depth, product animation, and selective 3D cues to a business website while keeping bundle sizes lean and respecting reduced-motion preferences.",
    kind: "Sourced Guide",
    category: "Motion & Creative",
    tags: ["Motion Graphics", "Web Performance", "3D", "Accessibility", "Remotion"],
    author: "Ali Arshad",
    publishedAt: "2026-11-23",
    updatedAt: "2026-11-23",
    readingMinutes: 4,
    coverVariant: "motion",
    status: "Published",
    sections: [
      {
        heading: "Why heavy 3D scenes on every page backfire",
        paragraphs: [
          "Full WebGL canvases loaded on every route routinely add hundreds of kilobytes of JavaScript, delay Largest Contentful Paint (LCP), and drain laptop or mobile batteries — especially when visitors are simply trying to evaluate services or open a contact form.",
          "Selective visual richness works much better: pre-rendered high-craft Blender visuals or short compressed MP4/WebM loops where storytelling genuinely benefits, paired with lightweight CSS 3D depth cues that degrade instantly to clean static layouts on mobile or reduced-motion settings.",
        ],
      },
      {
        heading: "Practical performance and accessibility checklist",
        paragraphs: [
          "Every visual or motion asset shipped in this studio follows five non-negotiable standards:",
        ],
        bullets: [
          "Explicit width and height on every image and media frame to prevent Cumulative Layout Shift (CLS).",
          "Modern formats (WebP/AVIF for stills; H.264 MP4/WebM with poster images and preload='metadata' for walkthrough videos).",
          "Zero sound-on autoplay — narration or product walkthroughs always require explicit user play and ship with WebVTT captions and transcripts.",
          "Full @media (prefers-reduced-motion: reduce) support disabling tilt, parallax, and non-essential transitions.",
          "Honest labeling: illustrative diagrams and editorial artwork are never presented as live client screenshots.",
        ],
      },
    ],
    sources: [
      {
        label: "Core Web Vitals (LCP, INP, CLS) Overview",
        publisher: "web.dev / Google Chrome Developers",
        url: "https://web.dev/articles/vitals",
        checkedDate: "2026-11-23",
      },
      {
        label: "MDN Web Docs — prefers-reduced-motion Media Feature",
        publisher: "Mozilla MDN",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion",
        checkedDate: "2026-11-23",
      },
    ],
    relatedServiceLabel: "Creative Production, Video & 3D",
    relatedServiceHref: "/services/creative-production",
    relatedProjectSlugs: ["motion-production-pipeline", "blender-product-visualisation"],
    relatedInsightSlugs: [
      "practical-ai-agents-human-handoff-architecture",
      "preventing-negative-inventory-postgres-transactions",
    ],
  },
];

export const publishedInsights = (): InsightPost[] =>
  INSIGHTS.filter((post) => post.status === "Published");

export const getInsight = (slug: string): InsightPost | undefined =>
  INSIGHTS.find((post) => post.slug === slug);
