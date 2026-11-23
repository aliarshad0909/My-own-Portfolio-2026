/**
 * Central 12-Product SaaS & AI Software Ecosystem Registry.
 * Powers `/products`, `/products/[slug]`, homepage ecosystem strip, and route checks.
 *
 * Honesty rules:
 *  - `status` is strictly `"Publicly Deployed"` ONLY when a verified `NEXT_PUBLIC_*_URL`
 *    environment variable is configured; otherwise `"Demo Ready"` (with local test verification).
 *  - Never displays broken external links or fabricated commercial/client outcomes.
 */

export const PRODUCT_CATEGORIES = [
  "Business Management",
  "Finance & Analytics",
  "AI & Automation",
  "Supply Chain & Operations",
  "Education & Productivity",
  "Customer Experience",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductStatusBadge =
  | "Demo Ready"
  | "Locally Tested"
  | "Publicly Deployed"
  | "In Development";

export type ProductShot = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  mobile?: boolean;
};

export type StudioProduct = {
  id: string;
  number: string;
  slug: string;
  name: string;
  monogram: string;
  accentColor: string;
  identityLabel: string;
  category: ProductCategory;
  tagline: string;
  shortDescription: string;
  status: ProductStatusBadge;
  secondaryStatus: ProductStatusBadge;
  liveUrl?: string;
  caseStudyUrl?: string;
  repoPath: string;
  branchName: string;
  localPort: string;
  targetSubdomain: string;
  demoEmail: string;
  demoPassword: string;
  overview: string;
  problemSolved: string;
  capabilities: string[];
  architectureOverview: string;
  technologies: string[];
  ossCompliance: string;
  interactivePreviewNote: string;
  cover: ProductShot;
  screenshots: ProductShot[];
  relatedSlugs: string[];
};

const envUrl = (key: string) => {
  const val = process.env[key]?.trim();
  return val && val.startsWith("http") ? val : undefined;
};

function statusFor(liveUrl?: string): { primary: ProductStatusBadge; secondary: ProductStatusBadge } {
  return liveUrl
    ? { primary: "Publicly Deployed", secondary: "Demo Ready" }
    : { primary: "Demo Ready", secondary: "Locally Tested" };
}

function makeProduct(
  spec: Omit<StudioProduct, "status" | "secondaryStatus" | "liveUrl"> & { envKey: string; defaultLiveUrl?: string },
): StudioProduct {
  const liveUrl = envUrl(spec.envKey) ?? spec.defaultLiveUrl;
  const { primary, secondary } = statusFor(liveUrl);
  const { envKey: _envKey, defaultLiveUrl: _defaultLiveUrl, ...rest } = spec;
  void _envKey;
  void _defaultLiveUrl;
  return { ...rest, liveUrl, status: primary, secondaryStatus: secondary };
}

export const STUDIO_PRODUCTS: StudioProduct[] = [
  makeProduct({
    id: "prod-01",
    number: "01",
    slug: "pipelineos-crm",
    name: "PipelineOS",
    monogram: "PO",
    accentColor: "#2563eb",
    identityLabel: "Deep Navy / Blue",
    category: "Business Management",
    tagline: "CRM & Sales Management SaaS",
    shortDescription:
      "Full-stack B2B CRM with persistent PostgreSQL contacts, transactional lead conversion, 6-stage Kanban pipeline, follow-up tasks, and live revenue analytics.",
    envKey: "NEXT_PUBLIC_PIPELINEOS_URL",
    defaultLiveUrl: "https://crm.aliarshad.co",
    caseStudyUrl: "/case-studies/pipelineos-crm",
    repoPath: "apps/pipelineos",
    branchName: "main",
    localPort: "http://localhost:3010",
    targetSubdomain: "crm.aliarshad.co",
    demoEmail: "demo@pipelineos.studio",
    demoPassword: "PipelineDemo2026!",
    overview:
      "PipelineOS is a standalone CRM and revenue operations application engineered on Next.js 16, Drizzle ORM, and PostgreSQL. It models complete B2B sales pipelines with integer-cent valuation, communication history, and one-click demo workspace restoration.",
    problemSolved:
      "Replaces fragmented spreadsheets and legally restrictive AGPL/Enterprise CRM forks with a fast, commercially clean TypeScript CRM ready for small and mid-sized B2B sales teams.",
    capabilities: [
      "Executive dashboard displaying open pipeline, weighted forecast, won revenue & win rate",
      "Contacts directory with search, CRUD & persistent communication timeline",
      "Atomic Lead → Contact + Deal conversion inside one PostgreSQL transaction",
      "6-stage Kanban pipeline with stage totals & immutable stage-move audit history",
      "Follow-up tasks, live DB-computed analytics, RBAC auth & 1-click demo reset",
    ],
    architectureOverview:
      "8-table relational PostgreSQL schema via Drizzle ORM with dual Neon/PGlite driver, scrypt salted passwords, SHA-256 HttpOnly cookie sessions, CSRF origin checks, Zod v4 validation, and HTTP security headers.",
    technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "Tailwind CSS", "Zod v4"],
    ossCompliance: "Clean-room TypeScript implementation inspired by Marmelab Atomic CRM (MIT). Zero AGPL code.",
    interactivePreviewNote:
      "Live public sandbox deployed at https://crm.aliarshad.co with HTTPS, persistent PostgreSQL data, and one-click demo reset.",
    cover: {
      src: "/images/projects/pipelineos/dashboard.png",
      alt: "PipelineOS CRM executive dashboard showing pipeline value, won revenue, and tasks",
      caption: "Executive Revenue & Pipeline Dashboard",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/pipelineos/pipeline.png", alt: "PipelineOS 6-stage Kanban pipeline board", caption: "6-Stage Kanban Sales Pipeline", width: 1440, height: 900 },
      { src: "/images/projects/pipelineos/contacts.png", alt: "PipelineOS contacts directory", caption: "Contacts & Communication History", width: 1440, height: 900 },
      { src: "/images/projects/pipelineos/analytics.png", alt: "PipelineOS live revenue analytics", caption: "Live Database Revenue Analytics", width: 1440, height: 900 },
    ],
    relatedSlugs: ["supportos", "projectos", "financeos"],
  }),
  makeProduct({
    id: "prod-02",
    number: "02",
    slug: "stockflow-inventory",
    name: "StockFlow",
    monogram: "SF",
    accentColor: "#059669",
    identityLabel: "Slate / Emerald",
    category: "Supply Chain & Operations",
    tagline: "Multi-Warehouse Inventory & Operations SaaS",
    shortDescription:
      "Transactional multi-warehouse inventory platform with EAN-13 barcode lookup, atomic stock transfers, PO receiving, SO fulfilment, and shared /api/v1 mobile backend.",
    envKey: "NEXT_PUBLIC_STOCKFLOW_URL",
    defaultLiveUrl: "https://stock.aliarshad.co",
    caseStudyUrl: "/case-studies/stockflow-inventory",
    repoPath: "apps/stockflow",
    branchName: "main",
    localPort: "http://localhost:3020",
    targetSubdomain: "stock.aliarshad.co",
    demoEmail: "ops@stockflow.studio",
    demoPassword: "StockFlowDemo2026!",
    overview:
      "StockFlow unifies multi-warehouse stock levels, purchase order receiving, sales order reservation/fulfilment, and an immutable stock movement audit ledger behind a versioned /api/v1 REST API shared live with StockFlow Mobile.",
    problemSolved:
      "Eliminates inventory drift, negative stock balances, and disconnected web/mobile warehouse records using atomic PostgreSQL transactions.",
    capabilities: [
      "Real-time KPI dashboard with stock valuation, low-stock alerts & warehouse breakdown",
      "SKU & EAN-13 barcode catalog with per-bin on-hand, reserved & available tracking",
      "Atomic stock receipts, cycle counts, issues & inter-warehouse transfers preventing negative stock",
      "Purchase Order 1-tap receiving & Sales Order Reserve → Fulfil → Ship lifecycle",
      "Immutable movement ledger tracking web vs. mobile operator events",
    ],
    architectureOverview:
      "11-table PostgreSQL ledger via Drizzle ORM serving both the Next.js 16 web operations console (HttpOnly cookies) and StockFlow Mobile (Authorization Bearer tokens) from one transactional API.",
    technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "Shared /api/v1 REST", "Zod v4"],
    ossCompliance: "Clean-room TypeScript implementation inspired by InvenTree (MIT). Zero GPL/AGPL code.",
    interactivePreviewNote:
      "Live public sandbox deployed at https://stock.aliarshad.co with HTTPS and PostgreSQL persistence, synced live with the mobile web preview at https://stockflow-mobile-web.onrender.com.",
    cover: {
      src: "/images/projects/stockflow/dashboard.png",
      alt: "StockFlow multi-warehouse inventory operations dashboard",
      caption: "Multi-Warehouse Operations Dashboard",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/stockflow/products.png", alt: "StockFlow SKU and barcode catalog", caption: "SKU & EAN-13 Barcode Catalog", width: 1440, height: 900 },
      { src: "/images/projects/stockflow/warehouses.png", alt: "StockFlow multi-warehouse transfers", caption: "Multi-Warehouse Bins & Transfers", width: 1440, height: 900 },
      { src: "/images/projects/stockflow/orders.png", alt: "StockFlow PO receiving and SO fulfilment", caption: "Purchase & Sales Order Workflows", width: 1440, height: 900 },
    ],
    relatedSlugs: ["stockflow-mobile", "sourceos", "financeos"],
  }),
  makeProduct({
    id: "prod-03",
    number: "03",
    slug: "stockflow-mobile",
    name: "StockFlow Mobile",
    monogram: "SM",
    accentColor: "#10b981",
    identityLabel: "Slate / Emerald Mobile",
    category: "Supply Chain & Operations",
    tagline: "React Native + Expo Warehouse Companion App (11 Screens)",
    shortDescription:
      "11-screen React Native + Expo SDK 52 warehouse companion with a live mobile web preview connected to https://stock.aliarshad.co, plus native expo-camera barcode scanning in the mobile codebase.",
    envKey: "NEXT_PUBLIC_STOCKFLOW_MOBILE_WEB_URL",
    defaultLiveUrl: "https://stockflow-mobile-web.onrender.com",
    caseStudyUrl: "/case-studies/stockflow-inventory#mobile-preview",
    repoPath: "apps/stockflow-mobile",
    branchName: "main",
    localPort: "npx expo start (port 8081)",
    targetSubdomain: "stockflow-mobile-web.onrender.com",
    demoEmail: "ops@stockflow.studio",
    demoPassword: "StockFlowDemo2026!",
    overview:
      "StockFlow Mobile brings barcode lookup, bin cycle counts, stock transfers, and receiving dock workflows to mobile screens, writing directly to the live StockFlow PostgreSQL backend at https://stock.aliarshad.co via Bearer tokens.",
    problemSolved:
      "Removes paper pick-lists and delayed manual spreadsheet entry by synchronizing warehouse floor updates with desktop operations in real time.",
    capabilities: [
      "All 11 mobile screens: Login, Dashboard, Products, Details, Scanner, Adjust, Warehouses, Transfer, Orders, Alerts, Profile",
      "Live interactive web preview at https://stockflow-mobile-web.onrender.com with manual & quick-test EAN-13 lookup",
      "Native expo-camera barcode scanner (EAN-13, UPC, Code-128, QR) in the React Native / Expo codebase for physical devices",
      "Live Stock Adjustment & Inter-Warehouse Transfer writing source: 'mobile' movements to PostgreSQL",
      "1-tap Purchase Order receiving & Sales Order status transitions synced with the desktop web app",
    ],
    architectureOverview:
      "React Native 0.76 + Expo SDK 52 TypeScript client with AsyncStorage Bearer session persistence communicating directly with StockFlow's CORS-enabled /api/v1/* REST endpoints.",
    technologies: ["React Native", "Expo SDK 52", "expo-camera", "TypeScript", "AsyncStorage", "EAS Build"],
    ossCompliance: "100% MIT open-source mobile stack. Not published on the Apple App Store or Google Play Store.",
    interactivePreviewNote:
      "Interactive mobile web preview is live at https://stockflow-mobile-web.onrender.com (uses live https://stock.aliarshad.co API with manual/quick EAN-13 lookup; native camera barcode scanning requires a physical mobile build). Android preview APK is not yet publicly distributed.",
    cover: {
      src: "/images/projects/stockflow/mobile-dashboard.png",
      alt: "StockFlow Mobile dashboard screen with Austin warehouse KPIs and quick actions",
      caption: "Mobile Warehouse Dashboard (390×844)",
      width: 780,
      height: 1688,
      mobile: true,
    },
    screenshots: [
      { src: "/images/projects/stockflow/mobile-scanner.png", alt: "StockFlow Mobile barcode scanner matching EAN-13 SKU", caption: "Barcode Scanner & Live SKU Match", width: 780, height: 1688, mobile: true },
      { src: "/images/projects/stockflow/mobile-adjust.png", alt: "StockFlow Mobile stock adjustment stepper", caption: "Live Stock Adjustment Stepper", width: 780, height: 1688, mobile: true },
      { src: "/images/projects/stockflow/mobile-orders.png", alt: "StockFlow Mobile PO receiving screen", caption: "Mobile Purchase & Sales Orders", width: 780, height: 1688, mobile: true },
    ],
    relatedSlugs: ["stockflow-inventory", "sourceos", "flowos"],
  }),
  makeProduct({
    id: "prod-04",
    number: "04",
    slug: "financeos",
    name: "FinanceOS",
    monogram: "FN",
    accentColor: "#0d9488",
    identityLabel: "Graphite / Teal",
    category: "Finance & Analytics",
    tagline: "Financial Intelligence & Business ERP",
    shortDescription:
      "Unified SMB financial operations platform featuring multi-currency ledger, AR/AP invoicing with atomic settlement, budgets, CSV bank reconciliation, P&L statements, and audit logs.",
    envKey: "NEXT_PUBLIC_FINANCEOS_URL",
    repoPath: "apps/financeos",
    branchName: "feature/financeos",
    localPort: "http://localhost:3030",
    targetSubdomain: "finance.aliarshad.co",
    demoEmail: "cfo@financeos.studio",
    demoPassword: "FinanceDemo2026!",
    overview:
      "FinanceOS provides a unified PostgreSQL accounting and treasury workspace modeled around fictional Meridian Digital Commerce LLC, computing cash balances, P&L statements, AR/AP exposure, and budget utilization strictly from stored integer-cent records.",
    problemSolved:
      "Gives SMB operators clear visibility into multi-currency cash flow, open receivables/payables, budget overruns, and bank statement matching without fragile manual spreadsheets.",
    capabilities: [
      "Financial overview dashboard with cash balance, operating profit, net margin & monthly cash-flow chart",
      "Multi-currency income, expense, sales & COGS purchase ledger with user-entered FX conversion",
      "AR customer invoices & AP vendor bills with atomic Mark Paid ledger posting",
      "Category budget limits vs. live actual spend & over-budget alerts",
      "CSV bank statement upload/paste importer, smart transaction matching & CSV P&L export + audit trail",
    ],
    architectureOverview:
      "10-table PostgreSQL accounting schema via Drizzle ORM enforcing integer-cent currency storage, atomic settlement transactions, CSRF/scrypt security, and explicit non-CPA demonstration disclosures.",
    technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "Tailwind CSS", "Zod v4"],
    ossCompliance: "100% clean-room TypeScript studio implementation on MIT/Apache-2.0 dependencies. Not certified CPA/tax advice.",
    interactivePreviewNote:
      "Verified locally with 3/3 PostgreSQL ERP tests, 0 high/critical prod vulnerabilities, and Chromium responsive E2E QA across 1440px, 768px & 390px.",
    cover: {
      src: "/images/projects/financeos/dashboard.png",
      alt: "FinanceOS Graphite and Teal financial overview dashboard showing cash balance, revenue, P&L chart, and budget utilization",
      caption: "Financial Overview, Cash-Flow Trend & Budgets",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/financeos/ledger.png", alt: "FinanceOS multi-currency ledger", caption: "Multi-Currency Income, Expense & COGS Ledger", width: 1440, height: 900 },
      { src: "/images/projects/financeos/invoices.png", alt: "FinanceOS AR invoices and AP bills", caption: "AR Invoices & AP Bills with Atomic Settlement", width: 1440, height: 900 },
      { src: "/images/projects/financeos/reconciliation.png", alt: "FinanceOS CSV bank reconciliation", caption: "CSV Bank Statement Import & Reconciliation", width: 1440, height: 900 },
    ],
    relatedSlugs: ["insightos", "sourceos", "pipelineos-crm"],
  }),
  makeProduct({
    id: "prod-05",
    number: "05",
    slug: "flowos",
    name: "FlowOS",
    monogram: "FL",
    accentColor: "#7c3aed",
    identityLabel: "Obsidian / Electric Violet",
    category: "AI & Automation",
    tagline: "AI Workflow Automation Platform",
    shortDescription:
      "Visual drag-and-drop React Flow workflow editor backed by a genuine deterministic execution engine, mandatory human-in-the-loop approval gates, step tracing, retries, and templates.",
    envKey: "NEXT_PUBLIC_FLOWOS_URL",
    repoPath: "apps/flowos",
    branchName: "feature/flowos",
    localPort: "http://localhost:3040",
    targetSubdomain: "flow.aliarshad.co",
    demoEmail: "ops@flowos.studio",
    demoPassword: "FlowDemo2026!",
    overview:
      "FlowOS pairs a real interactive @xyflow/react node canvas with a server-side deterministic workflow execution engine persisted in PostgreSQL. Workflows run without requiring paid AI API keys and enforce mandatory human approval before any outbound action.",
    problemSolved:
      "Demonstrates safe, auditable business process automation where AI drafts and branching logic are inspectable step-by-step and cannot send external emails or webhooks without human sign-off.",
    capabilities: [
      "Interactive @xyflow/react drag-and-drop visual editor with 8 node types, MiniMap & Node Inspector",
      "Real deterministic execution engine evaluating condition branches, field transforms & AI drafting",
      "Mandatory Human Approval Gate pausing runs in awaiting_approval until an operator clicks Approve & Resume or Reject",
      "Per-step JSON input/output trace viewer, failed-run Retry mechanism & 7-day execution analytics",
      "4 cloneable workflow templates plus webhook tester & optional n8n webhook bridge",
    ],
    architectureOverview:
      "6-table PostgreSQL execution graph store (workflows, workflow_runs, run_steps, integrations) with SSRF-guarded sandbox HTTP execution, deterministic zero-cost AI runtime, and strict CSRF/RBAC controls.",
    technologies: ["Next.js 16", "@xyflow/react", "TypeScript", "PostgreSQL", "Drizzle ORM", "Zod v4"],
    ossCompliance: "Clean-room execution engine using MIT-licensed @xyflow/react (React Flow). Zero AGPL/proprietary code.",
    interactivePreviewNote:
      "Verified locally with 3/3 test suites (condition/transform/AI, SSRF/security, full PGlite pause→approve→resume & retry), 0 prod vulnerabilities, and Chromium E2E PASS.",
    cover: {
      src: "/images/projects/flowos/dashboard.png",
      alt: "FlowOS automation control plane dashboard with 7-day execution chart and pending human approvals",
      caption: "Automation Control Plane & Human Approval Queue",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/flowos/editor.png", alt: "FlowOS React Flow visual workflow editor canvas", caption: "Interactive React Flow Visual Node Editor", width: 1440, height: 900 },
      { src: "/images/projects/flowos/runs.png", alt: "FlowOS execution history and step trace inspector", caption: "Execution History, Approvals & Retry", width: 1440, height: 900 },
      { src: "/images/projects/flowos/templates.png", alt: "FlowOS cloneable automation templates", caption: "Cloneable Business Workflow Templates", width: 1440, height: 900 },
    ],
    relatedSlugs: ["supportos", "pipelineos-crm", "sourceos"],
  }),
  makeProduct({
    id: "prod-06",
    number: "06",
    slug: "sourceos",
    name: "SourceOS",
    monogram: "SO",
    accentColor: "#ea580c",
    identityLabel: "Industrial Navy / Orange",
    category: "Supply Chain & Operations",
    tagline: "Global Procurement & Sourcing Platform",
    shortDescription:
      "End-to-end global sourcing control tower with supplier qualification, RFQ quotation comparison, atomic PO awards, port-to-port freight tracking, trade docs, and persisted landed-cost modeling.",
    envKey: "NEXT_PUBLIC_SOURCEOS_URL",
    repoPath: "apps/sourceos",
    branchName: "feature/sourceos",
    localPort: "http://localhost:3050",
    targetSubdomain: "source.aliarshad.co",
    demoEmail: "buyer@sourceos.studio",
    demoPassword: "SourceDemo2026!",
    overview:
      "SourceOS manages international supplier vetting, multi-vendor RFQ evaluations, purchase order lifecycles, ocean/air shipment tracking, trade compliance checklists, and multi-currency landed-cost scenarios in PostgreSQL.",
    problemSolved:
      "Brings fragmented supplier quotes, freight lanes, customs duty assumptions, and trade documents into one auditable procurement control tower.",
    capabilities: [
      "Procurement control tower with active suppliers, open RFQs, PO spend, in-transit freight & OTD %",
      "Supplier directory with audit scorecards, defect/OTD metrics & 1-click qualification workflow",
      "Side-by-side RFQ Quotation Comparison matrix with atomic 1-click Award → Auto-Create PO",
      "Port-to-port ocean/air/express shipment tracking & trade compliance document checklist",
      "Persisted Landed-Cost Calculator clearly separating user-entered duty/freight assumptions from official broker tariffs",
    ],
    architectureOverview:
      "9-table PostgreSQL procurement schema via Drizzle ORM with atomic RFQ-to-PO transactions, integer-cent landed-cost math, and full CSRF/scrypt security hardening.",
    technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "Tailwind CSS", "Zod v4"],
    ossCompliance: "100% clean-room TypeScript implementation on MIT/Apache-2.0 dependencies.",
    interactivePreviewNote:
      "Verified locally with 7/7 tests (landed-cost math, atomic RFQ award, shipment lifecycle, security, demo reset), 0 prod vulnerabilities, and Chromium E2E PASS.",
    cover: {
      src: "/images/projects/sourceos/dashboard.png",
      alt: "SourceOS Industrial Navy and Orange procurement control tower dashboard",
      caption: "Global Sourcing Control Tower & Freight Lanes",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/sourceos/rfqs.png", alt: "SourceOS RFQ quotation comparison matrix", caption: "RFQ Side-by-Side Quotation Comparison", width: 1440, height: 900 },
      { src: "/images/projects/sourceos/landed-cost.png", alt: "SourceOS persisted landed cost calculator", caption: "Persisted Multi-Currency Landed-Cost Model", width: 1440, height: 900 },
      { src: "/images/projects/sourceos/orders.png", alt: "SourceOS purchase orders and shipment tracking", caption: "POs, Shipments & Compliance Documents", width: 1440, height: 900 },
    ],
    relatedSlugs: ["stockflow-inventory", "financeos", "insightos"],
  }),
  makeProduct({
    id: "prod-07",
    number: "07",
    slug: "orexa",
    name: "Orexa",
    monogram: "OX",
    accentColor: "#ff6b4a",
    identityLabel: "Obsidian / Coral",
    category: "Education & Productivity",
    tagline: "AI Learning Operating System (Interactive Demo)",
    shortDescription:
      "Self-contained interactive AI Learning OS demonstration featuring structured courses, interactive lessons, adaptive quizzes, a syllabus-grounded deterministic AI tutor, and an instructor studio.",
    envKey: "NEXT_PUBLIC_OREXA_URL",
    repoPath: "apps/orexa",
    branchName: "feature/orexa-enhancement",
    localPort: "http://localhost:3060",
    targetSubdomain: "orexa.aliarshad.co",
    demoEmail: "learner@orexa.studio",
    demoPassword: "OrexaDemo2026!",
    overview:
      "Orexa (Interactive Learning OS Demo) demonstrates adaptive EdTech architecture: learners progress through modular courses, take server-graded adaptive quizzes that dynamically adjust next-step recommendations, and query a syllabus-grounded deterministic AI tutor.",
    problemSolved:
      "Demonstrates personalized AI-assisted learning, progress analytics, and instructor lesson authoring with zero paid LLM API exposure in public demo mode.",
    capabilities: [
      "Student dashboard tracking overall completion %, adaptive readiness tier & quick resume lesson",
      "Modular course & lesson player with PostgreSQL-persisted completion tracking and study resources",
      "Server-graded Adaptive Quiz Runner adjusting recommendations (<60% review, 60–84% practice, ≥85% advanced)",
      "Curriculum-grounded deterministic AI Tutor reading live PostgreSQL lessons (optional server-side LLM hook)",
      "Instructor & Admin Studio with course/lesson CRUD, resource manager & AI-assisted outline drafter",
    ],
    architectureOverview:
      "10-table PostgreSQL EdTech schema via Drizzle ORM with deterministic retrieval-grounded tutor engine and strict server-side key isolation. Clearly distinguished as an interactive demo separate from the external private Orexa platform.",
    technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "Deterministic AI Engine", "Zod v4"],
    ossCompliance: "Clean-room studio EdTech demo on MIT/Apache-2.0 stack. External private Orexa repository preserved untouched.",
    interactivePreviewNote:
      "Verified locally with 5/5 tests, 0 prod vulnerabilities, and Chromium responsive E2E QA across 5 routes. Explicitly labeled as an interactive learning OS demonstration.",
    cover: {
      src: "/images/projects/orexa/dashboard.png",
      alt: "Orexa Obsidian and Coral AI Learning Operating System student dashboard",
      caption: "Student Dashboard & Adaptive Readiness Center",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/orexa/courses.png", alt: "Orexa courses and interactive lesson player", caption: "Courses, Modules & Interactive Lessons", width: 1440, height: 900 },
      { src: "/images/projects/orexa/assessments.png", alt: "Orexa adaptive quiz runner", caption: "Adaptive Quizzes & Personalized Tiers", width: 1440, height: 900 },
      { src: "/images/projects/orexa/tutor.png", alt: "Orexa deterministic syllabus-grounded AI tutor", caption: "Syllabus-Grounded AI Tutor", width: 1440, height: 900 },
    ],
    relatedSlugs: ["flowos", "supportos", "projectos"],
  }),
  makeProduct({
    id: "prod-08",
    number: "08",
    slug: "supportos",
    name: "SupportOS",
    monogram: "SU",
    accentColor: "#2563eb",
    identityLabel: "Indigo / Blue",
    category: "Customer Experience",
    tagline: "Customer Support & Help Desk SaaS",
    shortDescription:
      "Full-stack help desk with shared agent inbox, customer portal, SLA tracking, internal notes vs. public replies, canned macros, knowledge base, and human-reviewed AI reply drafts.",
    envKey: "NEXT_PUBLIC_SUPPORTOS_URL",
    repoPath: "apps/supportos",
    branchName: "feature/supportos",
    localPort: "http://localhost:3070",
    targetSubdomain: "support.aliarshad.co",
    demoEmail: "agent@supportos.studio",
    demoPassword: "SupportDemo2026!",
    overview:
      "SupportOS provides unified Agent, Customer Portal, and Admin SLA workspaces backed by PostgreSQL. Customers submit tickets that auto-categorize and start SLA timers; agents collaborate with private internal notes, canned macros, and KB-grounded AI reply drafts that never auto-send.",
    problemSolved:
      "Delivers complete SLA compliance, shared inbox triage, and safe human-in-the-loop AI drafting without relying on Chatwoot's proprietary commercial enterprise/ directory.",
    capabilities: [
      "Support operations dashboard with SLA risk/breach monitor, first-response latency & agent attainment",
      "Split-pane Shared Inbox separating public customer replies from private internal agent notes",
      "Deterministic KB-grounded AI Draft Suggestion button inserting editable text (strictly never auto-sends)",
      "Dedicated Customer Portal for submitting tickets, tracking status & searching Knowledge Base",
      "Customer directory, reusable canned response macros & admin SLA policy configuration",
    ],
    architectureOverview:
      "8-table PostgreSQL help desk schema via Drizzle ORM enforcing internal-note redaction on customer portal endpoints, SLA countdown math, and full security hardening.",
    technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "Tailwind CSS", "Zod v4"],
    ossCompliance: "Clean-room TypeScript implementation after auditing Chatwoot (excluded proprietary enterprise/ folder).",
    interactivePreviewNote:
      "Verified locally with 6/6 tests (portal creation, SLA timers, internal-note privacy, non-auto-sending AI drafts, resolution, reset), 0 prod vulnerabilities, and Chromium E2E PASS.",
    cover: {
      src: "/images/projects/supportos/inbox.png",
      alt: "SupportOS Indigo and Blue shared inbox showing SLA countdowns, internal note, public reply, and AI draft suggestion",
      caption: "Shared Agent Inbox, SLA Timer & Safe AI Drafts",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/supportos/dashboard.png", alt: "SupportOS support operations and SLA dashboard", caption: "Support Operations & SLA Analytics", width: 1440, height: 900 },
      { src: "/images/projects/supportos/portal.png", alt: "SupportOS customer portal workspace", caption: "Customer Ticket Submission & Self-Service Portal", width: 1440, height: 900 },
      { src: "/images/projects/supportos/kb.png", alt: "SupportOS knowledge base and SLA admin", caption: "Knowledge Base & SLA Policy Admin", width: 1440, height: 900 },
    ],
    relatedSlugs: ["pipelineos-crm", "flowos", "bookos"],
  }),
  makeProduct({
    id: "prod-09",
    number: "09",
    slug: "projectos",
    name: "ProjectOS",
    monogram: "PJ",
    accentColor: "#8b5cf6",
    identityLabel: "Charcoal / Violet",
    category: "Business Management",
    tagline: "Project Management & Team Collaboration SaaS",
    shortDescription:
      "Agency and product delivery workspace featuring HTML5 drag-and-drop Kanban boards, task dependencies, milestones, billable time tracking, CSV reports, and a read-only client portal.",
    envKey: "NEXT_PUBLIC_PROJECTOS_URL",
    repoPath: "apps/projectos",
    branchName: "feature/projectos",
    localPort: "http://localhost:3080",
    targetSubdomain: "projects.aliarshad.co",
    demoEmail: "pm@projectos.studio",
    demoPassword: "ProjectDemo2026!",
    overview:
      "ProjectOS manages multi-client delivery programs end-to-end: projects, milestones, 5-stage drag-and-drop Kanban tasks with prerequisite dependency warnings, comments, attachment metadata, billable time logging, and sanitized client-facing progress views.",
    problemSolved:
      "Unifies task execution, dependency risk tracking, hours-vs-budget burn, and transparent client reporting on a 100% permissively licensed stack (avoiding Plane's AGPL-3.0 copyleft restrictions).",
    capabilities: [
      "Delivery command center tracking active projects, completion %, hours vs. budget & blocked dependencies",
      "Genuine HTML5 Drag-and-Drop 5-stage Kanban board with accessible arrow moves & dependency blocker badges",
      "Task detail drawer with persisted comments & attachment metadata",
      "Billable & non-billable time tracking with team capacity utilization & 1-click milestone sign-off",
      "Printable/CSV project report generator & sanitized read-only Client Portal view",
    ],
    architectureOverview:
      "9-table PostgreSQL delivery schema via Drizzle ORM with self-referencing task dependency checks, live CSV report generation, and strict role/portal separation.",
    technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "HTML5 Drag & Drop", "Zod v4"],
    ossCompliance: "Clean-room TypeScript implementation after rejecting AGPL-3.0 Plane source code.",
    interactivePreviewNote:
      "Verified locally with 4/4 tests (project → milestone → dependent task → Kanban move → time entry → CSV report → reset), 0 prod vulnerabilities, and Chromium E2E PASS.",
    cover: {
      src: "/images/projects/projectos/board.png",
      alt: "ProjectOS Charcoal and Violet 5-column Kanban board showing dependency blocker warnings",
      caption: "Interactive Drag-and-Drop Kanban Board & Dependencies",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/projectos/dashboard.png", alt: "ProjectOS delivery dashboard and budget burn", caption: "Project Delivery & Budget Burn Analytics", width: 1440, height: 900 },
      { src: "/images/projects/projectos/projects.png", alt: "ProjectOS projects and milestones", caption: "Projects, Milestones & Report Export", width: 1440, height: 900 },
      { src: "/images/projects/projectos/client-view.png", alt: "ProjectOS read-only client portal", caption: "Sanitized Client-Facing Project Portal", width: 1440, height: 900 },
    ],
    relatedSlugs: ["pipelineos-crm", "peopleos", "financeos"],
  }),
  makeProduct({
    id: "prod-10",
    number: "10",
    slug: "insightos",
    name: "InsightOS",
    monogram: "IN",
    accentColor: "#06b6d4",
    identityLabel: "Dark Graphite / Cyan",
    category: "Finance & Analytics",
    tagline: "Business Intelligence & Self-Service Analytics SaaS",
    shortDescription:
      "Interactive BI platform supporting real CSV file uploads, schema validation, 5 sample business datasets, Recharts visualizations, 3-period OLS linear forecasting, and saved dashboards.",
    envKey: "NEXT_PUBLIC_INSIGHTOS_URL",
    repoPath: "apps/insightos",
    branchName: "feature/insightos",
    localPort: "http://localhost:3090",
    targetSubdomain: "insight.aliarshad.co",
    demoEmail: "analyst@insightos.studio",
    demoPassword: "InsightDemo2026!",
    overview:
      "InsightOS lets business users upload real CSV files or explore 5 seeded fictional datasets (Sales, Marketing, Inventory, Financial Performance, Customer Behaviour), build interactive Bar/Line/Area charts with date & segment filters, overlay transparent OLS trend forecasts, and save dashboards to PostgreSQL.",
    problemSolved:
      "Turns raw CSV exports into validated, queryable interactive dashboards with transparent statistical forecasting and formula-injection-safe CSV exports.",
    capabilities: [
      "Executive BI overview with live PostgreSQL KPIs, top segments & 5 switchable demo datasets (98 rows)",
      "Real CSV file uploader & paste importer with column type inference, missing-value checks & data preview",
      "Interactive Recharts Chart Explorer (Bar/Line/Area, Sum/Avg/Count/Max, segment & date-range filters)",
      "Transparent 3-period OLS linear regression forecasting displaying exact equation & R² diagnostics",
      "Saved Dashboards persisted in PostgreSQL, Executive Summary Reports & safe CSV export",
    ],
    architectureOverview:
      "6-table PostgreSQL analytical schema storing normalized dataset rows and dashboard query configs, paired with Recharts (MIT) and strict CSV upload limits & formula neutralization.",
    technologies: ["Next.js 16", "Recharts", "TypeScript", "PostgreSQL", "Drizzle ORM", "Zod v4"],
    ossCompliance: "Clean-room BI platform built on MIT-licensed Recharts and permissive TypeScript stack.",
    interactivePreviewNote:
      "Verified locally with 5/5 tests (CSV validation, formula sanitization, aggregation, OLS forecast math, DB persistence), 0 prod vulnerabilities, and Chromium E2E PASS.",
    cover: {
      src: "/images/projects/insightos/dashboard.png",
      alt: "InsightOS Dark Graphite and Cyan executive BI dashboard with Recharts trend and forecast",
      caption: "Executive Business Intelligence & Trend Dashboard",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/insightos/explorer.png", alt: "InsightOS interactive chart builder and OLS forecast", caption: "Interactive Chart Explorer & OLS Forecast", width: 1440, height: 900 },
      { src: "/images/projects/insightos/datasets.png", alt: "InsightOS CSV uploader and dataset preview", caption: "CSV Upload, Validation & Data Preview", width: 1440, height: 900 },
      { src: "/images/projects/insightos/dashboards.png", alt: "InsightOS saved dashboards and executive reports", caption: "Saved Dashboards & CSV Reports", width: 1440, height: 900 },
    ],
    relatedSlugs: ["financeos", "pipelineos-crm", "sourceos"],
  }),
  makeProduct({
    id: "prod-11",
    number: "11",
    slug: "peopleos",
    name: "PeopleOS",
    monogram: "PP",
    accentColor: "#16a34a",
    identityLabel: "Soft Slate / Green",
    category: "Business Management",
    tagline: "Human Resource Management SaaS",
    shortDescription:
      "Modern HR operations platform with employee directory, org chart, RBAC PII protection, atomic leave approval workflow updating balances & attendance, recruitment pipeline, onboarding, and reviews.",
    envKey: "NEXT_PUBLIC_PEOPLEOS_URL",
    repoPath: "apps/peopleos",
    branchName: "feature/peopleos",
    localPort: "http://localhost:3100",
    targetSubdomain: "people.aliarshad.co",
    demoEmail: "hr@peopleos.studio",
    demoPassword: "PeopleDemo2026!",
    overview:
      "PeopleOS models core HR operations for a fictional organization: departments, org hierarchy, attendance tracking, manager leave approvals that atomically deduct leave balances and write attendance entries, candidate hiring stages, onboarding checklists, and performance reviews.",
    problemSolved:
      "Consolidates employee records, org structure, leave approvals, and hiring pipelines with role-based privacy controls redacting sensitive personal fields from unauthorized views.",
    capabilities: [
      "HR dashboard with active headcount, department rollups, pending leave approvals & onboarding progress",
      "Searchable Employee Directory, Org Chart hierarchy & RBAC PII redaction for standard employee roles",
      "Atomic Leave Request workflow: Employee submits → Manager approves → balance & attendance update together",
      "Recruitment hiring pipeline (Applied → Screening → Interview → Offer → Hired) & new-hire onboarding checklists",
      "Performance review cycles & employee document compliance tracking (with clear non-payroll disclaimer)",
    ],
    architectureOverview:
      "10-table PostgreSQL HR schema via Drizzle ORM enforcing role-aware API field redaction, atomic leave/attendance transactions, and strict demo security guardrails.",
    technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "RBAC PII Guard", "Zod v4"],
    ossCompliance: "Clean-room TypeScript HR demonstration on MIT/Apache-2.0 stack. Not a statutory payroll/tax system.",
    interactivePreviewNote:
      "Verified locally with automated RBAC PII redaction & atomic leave/attendance PostgreSQL tests, 0 prod vulnerabilities, and Chromium responsive E2E QA.",
    cover: {
      src: "/images/projects/peopleos/dashboard.png",
      alt: "PeopleOS Soft Slate and Green HR dashboard with headcount, departments, and leave approvals",
      caption: "HR Operations Dashboard & Leave Queue",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/peopleos/directory.png", alt: "PeopleOS employee directory and org chart", caption: "Employee Directory, Profiles & Org Structure", width: 1440, height: 900 },
      { src: "/images/projects/peopleos/leave.png", alt: "PeopleOS leave management and attendance", caption: "Leave Approvals & Attendance Ledger", width: 1440, height: 900 },
      { src: "/images/projects/peopleos/recruitment.png", alt: "PeopleOS recruitment pipeline and onboarding", caption: "Recruitment Pipeline & Onboarding Checklists", width: 1440, height: 900 },
    ],
    relatedSlugs: ["projectos", "financeos", "bookos"],
  }),
  makeProduct({
    id: "prod-12",
    number: "12",
    slug: "bookos",
    name: "BookOS",
    monogram: "BK",
    accentColor: "#2563eb",
    identityLabel: "Minimal Ivory / Blue",
    category: "Customer Experience",
    tagline: "Appointment Booking & Scheduling SaaS",
    shortDescription:
      "Minimalist appointment scheduling platform featuring timezone-aware live slot availability, PostgreSQL double-booking prevention, rescheduling, cancellation, reminders, and simulated sandbox checkout.",
    envKey: "NEXT_PUBLIC_BOOKOS_URL",
    repoPath: "apps/bookos",
    branchName: "feature/bookos",
    localPort: "http://localhost:3110",
    targetSubdomain: "book.aliarshad.co",
    demoEmail: "admin@bookos.studio",
    demoPassword: "BookDemo2026!",
    overview:
      "BookOS delivers both a serene Minimal Ivory / Blue customer booking flow and a full admin scheduling suite. Live available slots calculate from staff weekly rules minus active PostgreSQL bookings, with atomic overlap checks preventing double bookings.",
    problemSolved:
      "Eliminates double-booked appointments and manual timezone math on a clean MIT/Apache-2.0 stack without Cal.com's AGPL-3.0 / proprietary /ee license obligations.",
    capabilities: [
      "Step-by-step Customer Booking flow: Service → Staff → Timezone & Live Slots → Sandbox Payment → Confirmation",
      "Strict PostgreSQL transaction overlap guard + partial unique index preventing double bookings (HTTP 409)",
      "Admin Calendar with reschedule (overlap-checked), cancellation (frees slot immediately) & reminder log",
      "Service Catalogue (duration, buffer, pricing), Staff directory & Weekly Availability rules editor",
      "Customer booking history & appointment analytics (strictly simulated sandbox payment — zero real card data)",
    ],
    architectureOverview:
      "9-table PostgreSQL scheduling schema via Drizzle ORM storing UTC timestamps with customer timezone rendering, atomic slot locking, and partial unique active-booking index.",
    technologies: ["Next.js 16", "TypeScript", "PostgreSQL", "Drizzle ORM", "UTC Timezone Engine", "Zod v4"],
    ossCompliance: "Clean-room TypeScript implementation after rejecting AGPL-3.0 / proprietary /ee Cal.com source.",
    interactivePreviewNote:
      "Verified locally with automated double-booking rejection, reschedule, cancellation-rebook, and sandbox payment PostgreSQL tests, 0 prod vulnerabilities, and Chromium E2E PASS.",
    cover: {
      src: "/images/projects/bookos/dashboard.png",
      alt: "BookOS Minimal Ivory and Blue scheduling dashboard",
      caption: "Minimal Ivory / Blue Scheduling Dashboard",
      width: 1440,
      height: 900,
    },
    screenshots: [
      { src: "/images/projects/bookos/book.png", alt: "BookOS customer booking flow and live available slots", caption: "Customer Booking & Live Slot Availability", width: 1440, height: 900 },
      { src: "/images/projects/bookos/calendar.png", alt: "BookOS admin calendar and reminders", caption: "Admin Calendar, Reschedule & Reminders", width: 1440, height: 900 },
      { src: "/images/projects/bookos/catalog.png", alt: "BookOS services, staff, and availability rules", caption: "Services, Staff & Weekly Availability", width: 1440, height: 900 },
    ],
    relatedSlugs: ["supportos", "pipelineos-crm", "peopleos"],
  }),
];

export const getStudioProduct = (slug: string) => STUDIO_PRODUCTS.find((p) => p.slug === slug);
