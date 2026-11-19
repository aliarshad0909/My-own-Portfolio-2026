import type { IconName } from "@/components/ui/Icon";
import type { ArchNode } from "@/components/services/InteractiveArchitecture";
import type { WorkflowScenario } from "@/components/services/WorkflowScenarios";
import { MORE_HUB_ENRICHMENT } from "@/lib/seo/service-enrichment-more";

export type HubLayoutVariant =
  | "blueprint"
  | "editorial-split"
  | "guardrail"
  | "showcase-first"
  | "ledger"
  | "system-gallery"
  | "waterfall"
  | "pipeline";

export type HubFact = { label: string; value: string };

export type HubProblem = { quote: string; impact: string };

export type HubDeliverable = {
  icon: IconName;
  title: string;
  detail: string;
  output: string;
};

export type HubIntegrationGroup = {
  category: string;
  items: string[];
  note?: string;
};

export type HubIndustryApp = {
  sector: string;
  title: string;
  detail: string;
  href?: string;
};

export type HubProcessStep = {
  label: string;
  cadence: string;
  detail: string;
  deliverable: string;
};

export type HubDecisionTable = {
  eyebrow: string;
  title: string;
  lead: string;
  columns: [string, string, string];
  rows: [string, string, string][];
};

export type HubToolCallout = {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  cta: string;
};

export type HubRelatedLink = {
  kind: "Service" | "Tool" | "Guide" | "Industry" | "Network";
  title: string;
  description: string;
  href: string;
};

export type ServiceHubEnrichment = {
  layoutVariant: HubLayoutVariant;
  eyebrow: string;
  /** Pre-selected ?service= value matching lib/services.ts title. */
  contactServiceTitle: string;
  heroCta: string;
  heroSecondary?: { label: string; href: string };
  /** Optional hero preview drawn from a real live project in lib/projects.ts. */
  heroPreview?: {
    projectSlug: string;
    caption: string;
    diagram?: boolean;
  };
  /** Optional honest scope / disclaimer notice near the top. */
  scopeNotice?: string;
  facts: HubFact[];
  problemsHeading: string;
  problemsLead: string;
  problems: HubProblem[];
  architecture?: {
    eyebrow: string;
    title: string;
    lead: string;
    nodes: ArchNode[];
    caption: string;
  };
  scenarios?: {
    eyebrow: string;
    title: string;
    lead: string;
    items: WorkflowScenario[];
  };
  deliverablesHeading: string;
  deliverablesLead: string;
  deliverables: HubDeliverable[];
  integrationsHeading: string;
  integrationsLead: string;
  integrations: HubIntegrationGroup[];
  decisionTable?: HubDecisionTable;
  industriesHeading: string;
  industriesLead: string;
  industries: HubIndustryApp[];
  demoHeading?: string;
  demoLead?: string;
  showLeadGallery?: boolean;
  pendingMedia?: { heading: string; lines: string[] };
  showCredentials?: boolean;
  toolCallout?: HubToolCallout;
  processHeading: string;
  processLead: string;
  process: HubProcessStep[];
  relatedLinks: HubRelatedLink[];
  cta: {
    eyebrow: string;
    title: string;
    text: string;
    button: string;
  };
};

export const HUB_ENRICHMENT: Record<string, ServiceHubEnrichment> = {
  "n8n-automation": {
    layoutVariant: "blueprint",
    eyebrow: "AI Automation · n8n",
    contactServiceTitle: "AI Agents & Automation",
    heroCta: "Scope an n8n workflow",
    heroSecondary: { label: "Estimate automation ROI", href: "/tools/automation-roi-calculator" },
    heroPreview: {
      projectSlug: "inbound-lead-qualification-workflow",
      caption: "15-node inbound lead workflow · 22 verified Code-node tests",
      diagram: true,
    },
    facts: [
      { label: "Hosting", value: "Self-hosted or n8n Cloud" },
      { label: "Verification", value: "Unit-tested JS Code nodes" },
      { label: "Guardrails", value: "Human approval on high-stakes sends" },
      { label: "Ownership", value: "Exportable JSON, zero lock-in" },
    ],
    problemsHeading: "Where manual operations quietly bleed time",
    problemsLead:
      "Teams usually come to n8n after spreadsheets, inboxes and per-task SaaS zaps start breaking under real volume.",
    problems: [
      {
        quote: "Our team copies data between forms, sheets and the CRM all day.",
        impact: "Manual re-entry introduces silent typos, duplicate records and hours lost to work a webhook should finish in seconds.",
      },
      {
        quote: "Inbound leads sit untouched until someone checks the inbox.",
        impact: "Slow response times cool off qualified buyers while spam and low-fit inquiries clutter the same queue.",
      },
      {
        quote: "Weekly reporting is stitched together by hand every Monday.",
        impact: "Exporting CSVs from four platforms delays decisions and guarantees numbers drift from one sheet to the next.",
      },
      {
        quote: "We hit Zapier or Make limits as branching and volume grew.",
        impact: "Per-task billing scales aggressively on multi-step logic, and debugging opaque chains without real code testing slows every change.",
      },
    ],
    architecture: {
      eyebrow: "Interactive workflow blueprint",
      title: "How a resilient n8n pipeline handles an inbound lead",
      lead: "Good automation is mostly defensive engineering: validate before storing, deduplicate before alerting, and keep a person in front of outbound messages.",
      nodes: [
        {
          id: "n8n-intake",
          stage: "Stage 01",
          label: "Webhook & Intake",
          subtitle: "POST /inbound-lead",
          icon: "mail",
          kind: "trigger",
          summary: "Captures structured submissions from a website form, landing page, booking tool or CRM webhook and immediately starts a traced execution.",
          inputs: "JSON payload (name, email, company, service, budget, timeline, honeypot field).",
          outputs: "Normalised request envelope passed into validation with execution timestamp.",
          guardrail: "Webhook always returns a clean HTTP status (200 accepted or 422 rejected) so the calling form never hangs.",
        },
        {
          id: "n8n-validate",
          stage: "Stage 02",
          label: "Schema & Spam Gate",
          subtitle: "Code node · strict rules",
          icon: "code",
          kind: "logic",
          summary: "Validates required fields, trims whitespace, checks email shape and filters obvious bot traffic before any downstream API is called.",
          inputs: "Raw intake payload.",
          outputs: "Clean, typed lead object or structured rejection reason.",
          guardrail: "Invalid payloads exit early with HTTP 422 instead of polluting your CRM as zero-score junk records.",
        },
        {
          id: "n8n-dedupe",
          stage: "Stage 03",
          label: "30-Day Deduplication",
          subtitle: "Static data / CRM lookup",
          icon: "layers",
          kind: "logic",
          summary: "Checks whether the same sender submitted within the configured window so repeat clicks or double submissions do not trigger duplicate deals.",
          inputs: "Normalised email address and submission timestamp.",
          outputs: "Flag indicating new inquiry vs repeat contact with prior reference.",
          guardrail: "Duplicates are logged quietly rather than paging sales twice or creating split contact timelines.",
        },
        {
          id: "n8n-score",
          stage: "Stage 04",
          label: "Scoring & Routing",
          subtitle: "Hot · Warm · Cold bands",
          icon: "trending",
          kind: "logic",
          summary: "Scores each valid inquiry from 0 to 100 using transparent, agreed business criteria (scope fit, urgency, completeness) and routes by band.",
          inputs: "Validated, deduplicated lead attributes and configurable score weights.",
          outputs: "Numeric score, band classification and matched routing branch.",
          guardrail: "Cold leads log cleanly without interrupting sales; scoring rules stay readable in versioned JavaScript rather than hidden black-box prompts.",
        },
        {
          id: "n8n-crm",
          stage: "Stage 05",
          label: "CRM Sync & Alerting",
          subtitle: "Retry ×3 · Slack notify",
          icon: "briefcase",
          kind: "integration",
          summary: "Creates or updates the CRM contact and deal, assigns an owner, and sends a concise summary into Slack or email with context attached.",
          inputs: "Qualified lead payload and credential references stored securely in n8n.",
          outputs: "CRM record ID, owner assignment and internal alert message.",
          guardrail: "Automatic retry with backoff on transient API errors; persistent failures route to a dedicated error-logging workflow.",
        },
        {
          id: "n8n-human",
          stage: "Stage 06",
          label: "Draft & Human Sign-Off",
          subtitle: "Nothing auto-sent",
          icon: "users",
          kind: "human",
          summary: "Assembles a tailored follow-up draft from approved building blocks so a person reviews, adjusts tone and clicks send.",
          inputs: "Lead context, matched service track and approved message fragments.",
          outputs: "Ready-to-review draft queued for sales or founder sign-off.",
          guardrail: "High-stakes client communication never leaves unreviewed — automation removes the prep work while people keep the relationship.",
        },
      ],
      caption:
        "Modeled directly on the 15-node Inbound Lead Qualification demonstration in this portfolio (22 unit tests execute the workflow's own Code-node JavaScript). Credentials are always referenced by name, never hardcoded.",
    },
    scenarios: {
      eyebrow: "Practical workflows",
      title: "Four operational bottlenecks n8n removes cleanly",
      lead: "Switch between common engagements to see what changes, which systems connect, and where human judgement stays intact.",
      items: [
        {
          id: "lead-routing",
          category: "Sales Ops",
          label: "Inbound lead qualification",
          summary: "Turn raw website inquiries into validated, deduplicated, scored CRM records with owner alerts and a ready-to-review reply draft.",
          before: [
            "Form emails land in a shared inbox and wait hours for triage.",
            "Someone manually copies contact details into HubSpot or Pipedrive.",
            "Duplicate inquiries create split records and awkward double follow-ups.",
          ],
          after: [
            "Every submission is validated, deduplicated and scored in seconds.",
            "Hot and warm inquiries create CRM deals and notify the owner in Slack.",
            "A structured follow-up draft waits for one-click human approval.",
          ],
          tools: ["n8n", "Webhooks", "HubSpot / Pipedrive", "Slack", "Gmail"],
          humanBoundary: "Sales reviews every drafted reply and decides pricing, discovery calls and edge-case qualification.",
        },
        {
          id: "workspace-reporting",
          category: "Google Workspace",
          label: "Automated weekly reporting",
          summary: "Pull order, pipeline and marketing metrics on a schedule, reconcile totals in code, and publish a clean Google Sheets & Docs digest.",
          before: [
            "Operators export three or four CSVs every Monday morning.",
            "Manual copy-paste breaks formulas and hides period-over-period drift.",
            "Leadership gets stale numbers halfway through the week.",
          ],
          after: [
            "Scheduled n8n runs fetch fresh API data on Sunday night or Monday at 7 AM.",
            "Code nodes reconcile currency, dates and period deltas deterministically.",
            "Formatted tabs update in Google Sheets and a summary lands in Slack or Gmail.",
          ],
          tools: ["n8n", "Google Sheets", "Google Drive", "Gmail", "Stripe / Shopify API"],
          humanBoundary: "Leadership interprets anomalies and strategy; automation only guarantees the numbers arrive on time and reconciled.",
        },
        {
          id: "client-onboarding",
          category: "CRM & Delivery",
          label: "Client onboarding sync",
          summary: "When a proposal is signed or an invoice clears, provision folders, project tasks, welcome checklists and internal kick-off notifications automatically.",
          before: [
            "Signed deals sit waiting while someone remembers to create folders and boards.",
            "Clients receive inconsistent onboarding emails or missing links.",
            "Delivery teams lack context captured during sales.",
          ],
          after: [
            "CRM stage change or Stripe payment triggers a structured onboarding sequence.",
            "Drive folders, starter tasks and internal Slack channels spin up consistently.",
            "A pre-filled welcome email draft queues for the account lead to send.",
          ],
          tools: ["n8n", "CRM Webhooks", "Google Drive", "Notion / Linear", "Stripe"],
          humanBoundary: "The account owner confirms custom contract terms before sending the welcome pack.",
        },
        {
          id: "ops-alerts",
          category: "Operations",
          label: "Exception & inventory alerts",
          summary: "Monitor orders, stock thresholds, failed webhooks or overdue shipments and route actionable alerts only when something actually needs attention.",
          before: [
            "Issues surface only when a customer emails asking where an order is.",
            "Teams manually scan dashboards looking for exceptions.",
            "Alert fatigue from noisy, unfiltered notifications.",
          ],
          after: [
            "Scheduled checks compare live state against explicit business thresholds.",
            "Only genuine exceptions fire, deduplicated with direct links to fix them.",
            "Every failed automation run triggers a separate error workflow with payload context.",
          ],
          tools: ["n8n", "PostgreSQL / Airtable", "Shopify / ERP APIs", "Slack", "Email"],
          humanBoundary: "Operators decide supplier escalations, customer refunds and manual overrides.",
        },
      ],
    },
    deliverablesHeading: "What an n8n engagement actually delivers",
    deliverablesLead:
      "Every workflow is built like production software: scoped upfront, tested against edge cases, documented clearly and handed over for your team to own.",
    deliverables: [
      {
        icon: "layers",
        title: "Process map & edge-case spec",
        detail: "Before placing a single node, we document triggers, branching rules, data ownership and failure cases so we never automate a broken workflow.",
        output: "Deliverable: Written workflow specification & decision map",
      },
      {
        icon: "bot",
        title: "Production n8n workflow build",
        detail: "Clean, modular n8n workflows with named nodes, environment-driven config, retry policies and sub-workflows for reusable logic.",
        output: "Deliverable: Importable, version-controlled n8n JSON",
      },
      {
        icon: "code",
        title: "Tested JavaScript Code nodes",
        detail: "Complex scoring, normalisation and transformation logic is written cleanly and verified against realistic hot, cold and malformed payloads.",
        output: "Deliverable: Test payloads & automated verification harness",
      },
      {
        icon: "globe",
        title: "CRM, Workspace & API wiring",
        detail: "Native nodes and custom HTTP Request integrations across CRMs, Google Workspace, Slack, databases, billing and internal REST APIs.",
        output: "Deliverable: Credential checklist (zero secrets stored in code)",
      },
      {
        icon: "alert",
        title: "Error handling & dead-letter alerts",
        detail: "Dedicated error workflows capture failed executions, log context and alert your team immediately instead of letting jobs fail silently.",
        output: "Deliverable: Global error handler & retry policy",
      },
      {
        icon: "check",
        title: "Documentation & clean hand-off",
        detail: "Plain-English runbooks covering credentials, thresholds, how to pause or adjust rules, and optional ongoing maintenance support.",
        output: "Deliverable: Operator runbook & walkthrough session",
      },
    ],
    integrationsHeading: "Systems & integrations commonly wired with n8n",
    integrationsLead:
      "n8n ships with hundreds of native nodes and talks cleanly to any tool exposing a REST API, webhook or database connection.",
    integrations: [
      {
        category: "CRM & Sales Pipeline",
        items: ["HubSpot", "Pipedrive", "Salesforce", "Airtable", "Cal.com", "Typeform"],
        note: "Two-way contact sync, lead scoring, stage triggers and owner routing.",
      },
      {
        category: "Google Workspace & Comms",
        items: ["Gmail", "Google Sheets", "Google Drive", "Google Docs", "Slack", "Microsoft Teams"],
        note: "Scheduled digests, folder provisioning, email triage and approval notifications.",
      },
      {
        category: "Commerce, Billing & Data",
        items: ["Shopify", "Stripe", "PostgreSQL", "Supabase", "Notion", "Custom REST APIs"],
        note: "Order exception handling, invoice syncing, inventory thresholds and reporting.",
      },
      {
        category: "AI & Execution Runtime",
        items: ["n8n Self-Hosted (Docker)", "n8n Cloud", "OpenAI API", "Anthropic API", "Structured JSON"],
        note: "Deterministic workflows first, with scoped LLM steps only where language processing genuinely helps.",
      },
    ],
    decisionTable: {
      eyebrow: "Honest comparison",
      title: "When n8n is the right tool — and when Zapier is simpler",
      lead: "Choosing the right automation platform avoids rewriting workflows six months later.",
      columns: ["Dimension", "n8n (Self-hosted or Cloud)", "Zapier / Make"],
      rows: [
        ["Pricing at scale", "Billed by workflow execution (or server cost when self-hosted); multi-step loops stay affordable.", "Per-task / per-operation billing rises quickly with branching, loops and high volume."],
        ["Complex logic & code", "First-class JavaScript/Python Code nodes, sub-workflows and clean branching.", "Possible, but harder to version, test and maintain beyond linear zaps."],
        ["Data control & privacy", "Can be self-hosted on your own infrastructure so sensitive payloads stay inside your boundary.", "Always runs on vendor-managed multi-tenant cloud infrastructure."],
        ["Error handling", "Dedicated error workflows, retries with backoff and structured failure logging.", "Basic retries; custom dead-letter handling requires extra steps and tasks."],
        ["When to choose it", "Multi-step business processes, CRM/API logic, AI orchestration, or growing volume.", "Simple 2-step personal zaps where speed of setup matters more than control or unit cost."],
      ],
    },
    industriesHeading: "Where n8n automation pays back fastest",
    industriesLead: "The same core engineering patterns adapt directly to how different teams operate.",
    industries: [
      {
        sector: "Ecommerce & DTC",
        title: "Order exceptions, back-office sync & VIP alerts",
        detail: "Connect storefront orders, inventory thresholds, fulfilment updates and support escalation without fragile plugin chains.",
        href: "/industries/ecommerce",
      },
      {
        sector: "SaaS & Startups",
        title: "Trial qualification, onboarding & usage digests",
        detail: "Enrich sign-ups, route high-intent accounts to founders, sync billing events and automate weekly KPI snapshots.",
        href: "/industries/saas",
      },
      {
        sector: "Logistics & Operations",
        title: "Supplier updates, PO alerts & spreadsheet replacement",
        detail: "Automate purchase-order reminders, shipment milestone tracking and structured operational reporting.",
        href: "/industries/logistics",
      },
      {
        sector: "Service & B2B Teams",
        title: "Intake triage, proposal prep & CRM hygiene",
        detail: "Score inbound requests, deduplicate contacts, create client workspaces and queue human-reviewed follow-ups.",
      },
    ],
    demoHeading: "Verified demonstration: 15-node n8n lead workflow",
    demoLead:
      "Most automation portfolios show a blurred screenshot of boxes on a canvas. This demonstration extracts the workflow's actual Code-node JavaScript and verifies every path with 22 automated tests.",
    toolCallout: {
      eyebrow: "Free planning tool",
      title: "Check the payback before automating anything",
      text: "Plug in your team's weekly manual hours, loaded hourly rate and an honest automation share to estimate weekly savings and payback period in your browser.",
      href: "/tools/automation-roi-calculator",
      cta: "Open Automation ROI Calculator",
    },
    processHeading: "How an n8n engagement runs",
    processLead: "Clear written scope before building, reviewable milestones during implementation, and full ownership at hand-off.",
    process: [
      {
        label: "Process audit",
        cadence: "Days 1–2",
        detail: "We walk through the real workflow end to end — including exceptions, bad inputs and manual overrides — and agree on a plain-language scope.",
        deliverable: "Output: Written workflow spec & fixed scope",
      },
      {
        label: "Architecture & wiring",
        cadence: "Days 3–4",
        detail: "Map every trigger, branch, retry rule, credential scope and human-approval step before building.",
        deliverable: "Output: Node blueprint & credential list",
      },
      {
        label: "Build & verification",
        cadence: "Weeks 1–2",
        detail: "Build the n8n workflow, write and test Code-node logic against realistic edge-case payloads, and wire the error handler.",
        deliverable: "Output: Staging workflow & test evidence",
      },
      {
        label: "Deploy & hand-off",
        cadence: "Launch",
        detail: "Deploy to your self-hosted instance or n8n Cloud, verify live runs together, and hand over exportable JSON plus an operator runbook.",
        deliverable: "Output: Live workflow, runbook & full ownership",
      },
    ],
    relatedLinks: [
      {
        kind: "Tool",
        title: "Automation ROI Calculator",
        description: "Estimate weekly savings, annual return and payback period from your own numbers.",
        href: "/tools/automation-roi-calculator",
      },
      {
        kind: "Guide",
        title: "How to Measure Automation ROI",
        description: "The simple arithmetic and four traps to avoid before automating a process.",
        href: "/resources/automation-roi",
      },
      {
        kind: "Service",
        title: "AI Agent Development",
        description: "Scoped retrieval and qualification agents with confidence floors and human escalation.",
        href: "/services/ai-agents",
      },
      {
        kind: "Service",
        title: "Business Dashboards",
        description: "Operational views that surface the data your automated workflows collect.",
        href: "/services/business-dashboards",
      },
      {
        kind: "Service",
        title: "Web & Application Development",
        description: "Custom Next.js frontends, webhooks and internal tools wired directly to n8n.",
        href: "/services/web-development",
      },
    ],
    cta: {
      eyebrow: "Start an automation project",
      title: "Ready to take a repetitive process off your team's plate?",
      text: "Tell me which tools you use and where manual steps slow things down. I will give you an honest read on whether n8n fits, what to automate first, and what should stay human.",
      button: "Discuss your workflow",
    },
  },
};

export const ALL_HUB_ENRICHMENTS: Record<string, ServiceHubEnrichment> = {
  ...HUB_ENRICHMENT,
  ...MORE_HUB_ENRICHMENT,
};

export const getHubEnrichment = (slug: string): ServiceHubEnrichment | undefined =>
  ALL_HUB_ENRICHMENTS[slug];
