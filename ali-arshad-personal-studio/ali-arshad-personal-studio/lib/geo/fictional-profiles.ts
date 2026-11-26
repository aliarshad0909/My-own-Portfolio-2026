/**
 * Three transparently fictional demo customer profiles created solely to
 * illustrate how Ali Arshad Personal Studio services and demos could apply to
 * different US business models and locations.
 *
 * STRICT HONESTY RULES:
 *  - Every profile, scenario page, and team member is explicitly marked
 *    FICTIONAL DEMO SCENARIO / NOT A REAL CLIENT and AI-Generated Fictional
 *    Illustration / Not a Real Person.
 *  - Zero fake reviews, zero client quotes, zero real street addresses, zero
 *    claims that Ali performed work for these organizations.
 *  - Map coordinates place synthetic markers on the studio's original 4-region
 *    US schematic map (viewBox 0 0 708 492 from us-remote-regions-map.svg).
 */

export type FictionalMapMarker = {
  id: string;
  /** X coordinate inside the original 708×492 US regional schematic map frame. */
  x: number;
  /** Y coordinate inside the original 708×492 US regional schematic map frame. */
  y: number;
  region: "West" | "Midwest" | "South" | "Northeast";
  shortLabel: string;
  markerKind:
    | "Simulated Flagship Store"
    | "Simulated Warehouse"
    | "Simulated Satellite Store"
    | "Simulated Distribution Yard"
    | "Simulated Remote Hub (No Office)"
    | "Simulated Clinic Location";
  syntheticLocation: string;
  description: string;
};

export type FictionalTeamMember = {
  id: string;
  fictionalName: string;
  role: string;
  department: string;
  /** Fictional member id this role reports to (null for scenario lead). */
  reportsTo: string | null;
  simulatedRegion: string;
  portraitSrc: string;
  portraitAlt: string;
  portraitDisclosure: "AI-Generated Fictional Illustration — Not a Real Person";
  howTheyUseSystem: string;
};

export type FictionalCustomerProfile = {
  id: "alder-loom" | "beaconfield-supply" | "northstar-cloud" | "cedarbrook-dental";
  slug:
    | "alder-loom-home-goods"
    | "beaconfield-mechanical-supply"
    | "northstar-cloud-ops"
    | "cedarbrook-dental-wellness";
  fictionalName: string;
  disclosureBadge: "Fictional Demo Scenario — Not a Real Client";
  operatingModel:
    | "Simulated Multi-Store Retail + Warehouse"
    | "Simulated Regional B2B Distribution Yards"
    | "Simulated 100% Remote Software Company"
    | "Simulated Multi-Clinic Appointment Practice";
  hasPhysicalStorefrontInScenario: boolean;
  industry: string;
  sampleProblem: string;
  illustrativeApproach: string;
  scenarioOverview: string[];
  workflowWalkthrough: string[];
  /** Real studio project slugs (resolved live from lib/projects so real status badges always match). */
  relatedProjectSlugs: string[];
  /** Relevant published studio service pages. */
  relatedServices: { title: string; href: string; note: string }[];
  /** Legacy concise paired links preserved for location cards. */
  pairedExamples: {
    title: string;
    href: string;
    buildLabel: "Live Demo" | "Locally Tested Demo" | "Built Prototype" | "Consultation Service";
  }[];
  /** Service hub slugs where this fictional profile naturally fits. */
  fitServiceSlugs: string[];
  /** Synthetic markers plotted onto the original 4-region US schematic map. */
  mapMarkers: FictionalMapMarker[];
  /** Kept for compatibility with existing test assertions & compact captions. */
  mapPin: {
    xPct: number;
    yPct: number;
    syntheticLabel: string;
    approximateCoordsLabel: string;
    caption: string;
  };
  /** Fictional organizational hierarchy showing roles & imagined workflow usage. */
  teamHierarchy: FictionalTeamMember[];
};

const PORTRAIT_DISCLOSURE = "AI-Generated Fictional Illustration — Not a Real Person" as const;

export const FICTIONAL_DEMO_PROFILES: FictionalCustomerProfile[] = [
  {
    id: "alder-loom",
    slug: "alder-loom-home-goods",
    fictionalName: "Alder & Loom Home Goods",
    disclosureBadge: "Fictional Demo Scenario — Not a Real Client",
    operatingModel: "Simulated Multi-Store Retail + Warehouse",
    hasPhysicalStorefrontInScenario: true,
    industry: "DTC & Multi-Store Home Goods Retail",
    sampleProblem:
      "In this fictional retail scenario, a three-store ceramic and textile merchant struggles with online orders overselling showroom stock, manual spreadsheet transfers between locations, and unclear landed cost on imported seasonal goods.",
    illustrativeApproach:
      "Connect a custom Next.js storefront to an atomic multi-warehouse inventory ledger and standardized landed-cost comparison sheets — delivered remotely without requiring an on-site agency.",
    scenarioOverview: [
      "Alder & Loom Home Goods is a completely fictional multi-location retail organization invented to demonstrate how ecommerce storefronts, multi-warehouse inventory software, and supplier landed-cost analysis work together.",
      "In this imagined operating model, the merchant runs two regional showrooms and one central fulfillment warehouse in the US West region while selling ceramics, woven textiles, and seasonal tableware nationwide online.",
      "Because storefront stock counts and showroom registers live in disconnected spreadsheets, peak weekend sales repeatedly oversell limited-batch items and force manual backorder apologies."
    ],
    workflowWalkthrough: [
      "Online shoppers browse a fast Next.js storefront reading real-time stock quantities from a shared PostgreSQL inventory ledger.",
      "Store associates scan showroom replenishments and warehouse shipments from mobile devices using EAN-13 barcodes so transfers stay atomic.",
      "Before seasonal import orders are placed, the operations lead scores factory quotes side by side with duty, freight, and insurance included."
    ],
    relatedProjectSlugs: ["stockflow-inventory", "stockflow-mobile-companion", "tessera-clayworks-storefront", "lantern-sourcing-platform"],
    relatedServices: [
      { title: "Ecommerce Development", href: "/services/ecommerce-development", note: "Custom Next.js storefronts connected to inventory rules." },
      { title: "Custom Inventory & Purchasing Software", href: "/services/business-dashboards/inventory-software", note: "Atomic multi-location stock ledgers and transfers." },
      { title: "Global Sourcing & Landed-Cost Analysis", href: "/services/global-sourcing/landed-cost-analysis", note: "Weighted factory quote comparison and landed-cost discipline." },
    ],
    pairedExamples: [
      { title: "StockFlow Inventory SaaS", href: "/case-studies/stockflow-inventory", buildLabel: "Live Demo" },
      { title: "Tessera Clayworks Storefront", href: "/case-studies/tessera-clayworks-storefront", buildLabel: "Locally Tested Demo" },
      { title: "Lantern Sourcing Platform", href: "/case-studies/lantern-sourcing-platform", buildLabel: "Locally Tested Demo" },
    ],
    fitServiceSlugs: ["ecommerce-development", "global-sourcing", "branding", "creative-production"],
    mapMarkers: [
      {
        id: "alder-flagship",
        x: 112,
        y: 222,
        region: "West",
        shortLabel: "M1 · Simulated Flagship",
        markerKind: "Simulated Flagship Store",
        syntheticLocation: "West Region — Simulated Coastal Showroom (Fictional)",
        description: "Synthetic illustrative marker representing a fictional retail showroom where showroom inventory syncs to online availability. Not a real store or address.",
      },
      {
        id: "alder-warehouse",
        x: 164,
        y: 292,
        region: "West",
        shortLabel: "M2 · Simulated Warehouse",
        markerKind: "Simulated Warehouse",
        syntheticLocation: "West Region — Simulated Central Fulfillment Hub (Fictional)",
        description: "Synthetic illustrative marker representing a fictional warehouse receiving overseas cartons and dispatching store transfers. Not a real facility or address.",
      },
      {
        id: "alder-satellite",
        x: 102,
        y: 162,
        region: "West",
        shortLabel: "M3 · Simulated Satellite",
        markerKind: "Simulated Satellite Store",
        syntheticLocation: "West Region — Simulated Pacific Northwest Showroom (Fictional)",
        description: "Synthetic illustrative marker representing a fictional second showroom sharing live replenishment transfers with the central hub. Not a real location.",
      },
    ],
    mapPin: {
      xPct: 24,
      yPct: 54,
      syntheticLabel: "Synthetic Retail Hub Pin",
      approximateCoordsLabel: "Synthetic marker (West region · illustrative only)",
      caption:
        "Illustrative synthetic markers on the studio's regional US map for a fictional 3-location retail scenario — not a real business address or client.",
    },
    teamHierarchy: [
      {
        id: "alder-claire",
        fictionalName: "Claire Bennett (Fictional)",
        role: "Founder & Operations Director",
        department: "Executive & Buying",
        reportsTo: null,
        simulatedRegion: "West Region (Simulated)",
        portraitSrc: "/images/services/scenario-home-goods.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional retail founder named Claire Bennett",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Reviews unit landed-cost sheets before approving overseas purchase orders and checks weekly margin and low-stock alerts across all simulated locations.",
      },
      {
        id: "alder-devon",
        fictionalName: "Devon Park (Fictional)",
        role: "Ecommerce & Merchandising Lead",
        department: "Digital Storefront",
        reportsTo: "alder-claire",
        simulatedRegion: "West Region (Simulated)",
        portraitSrc: "/images/services/scenario-home-goods.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional ecommerce lead named Devon Park",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Manages seasonal product collections, storefront pricing updates, and real-time online stock rules to prevent overselling limited-batch SKUs.",
      },
      {
        id: "alder-priya",
        fictionalName: "Priya Nair (Fictional)",
        role: "Warehouse & Fulfillment Coordinator",
        department: "Logistics & Inventory",
        reportsTo: "alder-claire",
        simulatedRegion: "West Region (Simulated)",
        portraitSrc: "/images/services/scenario-home-goods.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional warehouse coordinator named Priya Nair",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Uses the mobile barcode companion on the warehouse floor to receive purchase orders, adjust damaged counts, and log showroom replenishment transfers.",
      },
    ],
  },
  {
    id: "beaconfield-supply",
    slug: "beaconfield-mechanical-supply",
    fictionalName: "Beaconfield Mechanical Supply",
    disclosureBadge: "Fictional Demo Scenario — Not a Real Client",
    operatingModel: "Simulated Regional B2B Distribution Yards",
    hasPhysicalStorefrontInScenario: true,
    industry: "Regional B2B Industrial Supply & Distribution",
    sampleProblem:
      "In this fictional B2B distribution scenario, inbound RFQ emails wait unanswered in shared inboxes across two regional supply yards while managers assemble weekly margin and reorder sheets manually every Friday.",
    illustrativeApproach:
      "Combine a custom PostgreSQL B2B CRM, a self-hosted n8n lead-qualification pipeline with tested validation rules, and a single-source executive revenue dashboard.",
    scenarioOverview: [
      "Beaconfield Mechanical Supply is a completely fictional industrial distributor created to illustrate how B2B pipeline tracking, self-hosted n8n workflow automation, and executive KPI dashboards fit together.",
      "In this imagined operating model, two regional supply yards in the Midwest and South handle recurring contractor RFQs for valves, fasteners, and HVAC assemblies.",
      "Without structured lead scoring and unified margin telemetry, high-value bid requests sit unprioritized in shared inboxes while managers reconcile invoice and quote totals by hand."
    ],
    workflowWalkthrough: [
      "Inbound RFQ web forms and emails enter a tested 15-node n8n workflow that validates fields, checks 30-day duplicates, scores urgency 0–100, and routes urgent quotes to the sales desk.",
      "Sales managers convert qualified leads inside a custom PostgreSQL CRM with 6-stage Kanban visibility and zero double-entry.",
      "Leadership inspects live branch margin, quote win-rate, and aging backlog on a single-source analytics dashboard instead of Friday spreadsheets."
    ],
    relatedProjectSlugs: ["pipelineos-crm", "inbound-lead-qualification-workflow", "northwind-analytics-dashboard", "meridian-inventory-operations"],
    relatedServices: [
      { title: "Custom CRM & B2B Pipeline Software", href: "/services/web-development/custom-crm-development", note: "Tailored PostgreSQL CRM workflows without bloated seat fees." },
      { title: "n8n Workflow & Lead Qualification Automation", href: "/services/n8n-automation/lead-qualification", note: "Self-hostable workflows with tested JavaScript rules and human approvals." },
      { title: "Business Dashboards & Analytics", href: "/services/business-dashboards", note: "Single-source KPI visibility replacing manual weekly sheets." },
    ],
    pairedExamples: [
      { title: "PipelineOS CRM", href: "/case-studies/pipelineos-crm", buildLabel: "Live Demo" },
      { title: "Inbound Lead Qualification n8n Workflow", href: "/case-studies/inbound-lead-qualification-workflow", buildLabel: "Locally Tested Demo" },
      { title: "Northwind Analytics Dashboard", href: "/case-studies/northwind-analytics-dashboard", buildLabel: "Locally Tested Demo" },
    ],
    fitServiceSlugs: ["business-dashboards", "n8n-automation", "web-development"],
    mapMarkers: [
      {
        id: "beacon-midwest-yard",
        x: 374,
        y: 162,
        region: "Midwest",
        shortLabel: "M1 · Simulated Midwest Yard",
        markerKind: "Simulated Distribution Yard",
        syntheticLocation: "Midwest Region — Simulated Regional Supply Yard (Fictional)",
        description: "Synthetic illustrative marker representing a fictional industrial distribution yard managing commercial RFQs and stock dispatch. Not a real business or address.",
      },
      {
        id: "beacon-south-yard",
        x: 386,
        y: 332,
        region: "South",
        shortLabel: "M2 · Simulated South Yard",
        markerKind: "Simulated Distribution Yard",
        syntheticLocation: "South Region — Simulated Secondary Supply Yard (Fictional)",
        description: "Synthetic illustrative marker representing a fictional secondary B2B supply yard synced to the same CRM and analytics stack. Not a real facility or address.",
      },
    ],
    mapPin: {
      xPct: 56,
      yPct: 48,
      syntheticLabel: "Synthetic Distribution Pin",
      approximateCoordsLabel: "Synthetic markers (Midwest & South · illustrative only)",
      caption:
        "Illustrative synthetic markers on the studio's regional US map representing a fictional B2B supply business — not a real client or address.",
    },
    teamHierarchy: [
      {
        id: "beacon-marcus",
        fictionalName: "Marcus Hale (Fictional)",
        role: "VP of Operations",
        department: "Executive Operations",
        reportsTo: null,
        simulatedRegion: "Midwest Region (Simulated)",
        portraitSrc: "/images/services/sourcing-warehouse-packing.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional operations VP named Marcus Hale",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Monitors cross-yard gross margin, quote turnaround time, and recurring account revenue from the executive dashboard every morning.",
      },
      {
        id: "beacon-elena",
        fictionalName: "Elena Morales (Fictional)",
        role: "Sales Desk & RFQ Manager",
        department: "Commercial Sales",
        reportsTo: "beacon-marcus",
        simulatedRegion: "South Region (Simulated)",
        portraitSrc: "/images/services/sourcing-warehouse-packing.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional sales desk manager named Elena Morales",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Works directly inside the custom CRM Kanban board, reviewing n8n-scored inbound RFQs and approving drafted customer follow-ups.",
      },
      {
        id: "beacon-tomas",
        fictionalName: "Tomas Kowalski (Fictional)",
        role: "Regional Yard & Inventory Supervisor",
        department: "Warehouse Operations",
        reportsTo: "beacon-marcus",
        simulatedRegion: "Midwest Region (Simulated)",
        portraitSrc: "/images/services/sourcing-warehouse-packing.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional yard supervisor named Tomas Kowalski",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Tracks append-only stock adjustments, verifies PO receipt accuracy against vendor bills, and flags low safety-stock parts early.",
      },
    ],
  },
  {
    id: "northstar-cloud",
    slug: "northstar-cloud-ops",
    fictionalName: "Northstar Cloud Ops",
    disclosureBadge: "Fictional Demo Scenario — Not a Real Client",
    operatingModel: "Simulated 100% Remote Software Company",
    hasPhysicalStorefrontInScenario: false,
    industry: "Remote-Only B2B Software & Operations Tooling",
    sampleProblem:
      "In this fictional remote-only SaaS scenario (no physical stores or offices), a distributed 18-person product team faces repetitive policy/docs support tickets and wants grounded self-serve Q&A plus occasional batch AI model evaluation without full-time ML hires.",
    illustrativeApproach:
      "Deploy a policy-grounded BM25 retrieval support agent with human escalation, a deterministic voice/chat qualification flow, and consultation-scoped RTX GPU evaluation windows.",
    scenarioOverview: [
      "Northstar Cloud Ops is a completely fictional 100% remote B2B software startup with zero physical offices or storefronts, created to demonstrate grounded AI support, safe agent evaluation, and remote product engineering.",
      "In this imagined operating model, distributed teammates across US time zones manage growing documentation support volume and want trustworthy, citation-backed self-serve answers that never hallucinate billing or SLA exceptions.",
      "Before shipping prompt or retrieval updates, engineers run regression benchmarks and inspect token cost allocation across customer workflows."
    ],
    workflowWalkthrough: [
      "Customer questions run through a BM25 lexical retrieval engine that quotes verified docs verbatim and escalates cleanly to humans whenever confidence drops below a tuned threshold.",
      "After-hours prospective buyers complete a structured slot-filling intake flow that posts a clean brief straight to product sales.",
      "Platform engineers run automated prompt/retrieval evaluation regressions and consultation-scoped GPU batch checks before releasing model changes."
    ],
    relatedProjectSlugs: ["tideline-support-agent", "kestrel-voice-sales-agent", "agent-eval-harness", "llm-finops-meter"],
    relatedServices: [
      { title: "AI Agent Development", href: "/services/ai-agents", note: "Grounded support, sales intake, and retrieval assistants with escalation guardrails." },
      { title: "Knowledge-Base & RAG Assistants", href: "/services/ai-agents/rag", note: "Citation-backed answers with deterministic abstention floors." },
      { title: "RTX GPU Compute Consultation", href: "/services/gpu-compute", note: "Consultation-led burst compute for evaluation and inference testing." },
    ],
    pairedExamples: [
      { title: "Tideline Knowledge-Base Support Agent", href: "/case-studies/tideline-support-agent", buildLabel: "Locally Tested Demo" },
      { title: "Kestrel Voice Qualification Agent", href: "/case-studies/kestrel-voice-sales-agent", buildLabel: "Locally Tested Demo" },
      { title: "RTX GPU Compute Consultation", href: "/services/gpu-compute", buildLabel: "Consultation Service" },
    ],
    fitServiceSlugs: ["ai-agents", "web-development", "gpu-compute"],
    mapMarkers: [
      {
        id: "northstar-ne",
        x: 576,
        y: 162,
        region: "Northeast",
        shortLabel: "R1 · Remote Product (No Office)",
        markerKind: "Simulated Remote Hub (No Office)",
        syntheticLocation: "Northeast Region — Simulated Remote Teammate Zone (Zero Physical Office)",
        description: "Synthetic illustrative marker showing a simulated remote product operations lead working asynchronously with US East overlap. No physical office exists.",
      },
      {
        id: "northstar-west",
        x: 138,
        y: 196,
        region: "West",
        shortLabel: "R2 · Remote Platform (No Office)",
        markerKind: "Simulated Remote Hub (No Office)",
        syntheticLocation: "West Region — Simulated Remote Engineering Zone (Zero Physical Office)",
        description: "Synthetic illustrative marker showing a simulated distributed engineering lead collaborating across Pacific time. No physical office exists.",
      },
      {
        id: "northstar-south",
        x: 422,
        y: 318,
        region: "South",
        shortLabel: "R3 · Remote Support (No Office)",
        markerKind: "Simulated Remote Hub (No Office)",
        syntheticLocation: "South Region — Simulated Remote Support Zone (Zero Physical Office)",
        description: "Synthetic illustrative marker showing a simulated remote customer support lead reviewing escalated AI tickets. No physical office exists.",
      },
    ],
    mapPin: {
      xPct: 76,
      yPct: 38,
      syntheticLabel: "100% Remote Distributed Team",
      approximateCoordsLabel: "Synthetic remote markers (zero physical office or storefront)",
      caption:
        "Illustrative synthetic markers on the studio's regional US map for a fictional 100% remote software business — not a real company or office location.",
    },
    teamHierarchy: [
      {
        id: "northstar-hannah",
        fictionalName: "Hannah Cho (Fictional)",
        role: "Head of Product Operations",
        department: "Product & Operations",
        reportsTo: null,
        simulatedRegion: "Northeast Region (Simulated Remote)",
        portraitSrc: "/images/services/gpu-workstation-console.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional product ops leader named Hannah Cho",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Defines support escalation boundaries, reviews weekly deflected-vs-escalated ticket trends, and signs off on AI token budget ceilings.",
      },
      {
        id: "northstar-samir",
        fictionalName: "Samir Patel (Fictional)",
        role: "Staff Platform Engineer",
        department: "Core Engineering",
        reportsTo: "northstar-hannah",
        simulatedRegion: "West Region (Simulated Remote)",
        portraitSrc: "/images/services/gpu-workstation-console.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional platform engineer named Samir Patel",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Owns API integrations, least-privilege MCP tool policies, and repository deployment pipelines connecting docs and billing data safely.",
      },
      {
        id: "northstar-naomi",
        fictionalName: "Naomi Brooks (Fictional)",
        role: "Customer Support & Knowledge Lead",
        department: "Customer Support",
        reportsTo: "northstar-hannah",
        simulatedRegion: "South Region (Simulated Remote)",
        portraitSrc: "/images/services/gpu-workstation-console.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional support lead named Naomi Brooks",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Maintains verified help-center articles, handles human-escalated conversations with full context, and flags missing policy documentation.",
      },
      {
        id: "northstar-liam",
        fictionalName: "Liam O'Connor (Fictional)",
        role: "Applied AI & Evaluation Engineer",
        department: "AI Reliability",
        reportsTo: "northstar-samir",
        simulatedRegion: "Midwest Region (Simulated Remote)",
        portraitSrc: "/images/services/gpu-workstation-console.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional AI evaluation engineer named Liam O'Connor",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Runs automated golden-set retrieval benchmarks, audits citation grounding before releases, and coordinates consultation-scoped GPU evaluation bursts.",
      },
    ],
  },
  {
    id: "cedarbrook-dental",
    slug: "cedarbrook-dental-wellness",
    fictionalName: "Cedarbrook Dental & Wellness Group",
    disclosureBadge: "Fictional Demo Scenario — Not a Real Client",
    operatingModel: "Simulated Multi-Clinic Appointment Practice",
    hasPhysicalStorefrontInScenario: true,
    industry: "Multi-Clinic Healthcare & Appointment Services",
    sampleProblem:
      "In this fictional two-clinic practice scenario, front-desk staff field repetitive insurance and preparation phone calls all morning while manual appointment reschedules leave open chair gaps across providers.",
    illustrativeApproach:
      "Pair a conflict-free multi-provider scheduling workspace, automated n8n pre-visit reminders, and a grounded non-clinical FAQ assistant that escalates all clinical questions straight to staff.",
    scenarioOverview: [
      "Cedarbrook Dental & Wellness Group is a completely invented multi-clinic wellness practice created to demonstrate how appointment scheduling software, automated reminder workflows, and strictly bounded FAQ assistants support service businesses.",
      "In this illustrative scenario, two neighborhood clinics share six providers with different chair durations, buffer times, and intake checklists.",
      "Phone-only scheduling creates missed bookings after hours, while generic chatbots risk giving unsafe advice unless strictly restricted to verified logistics FAQs with human staff escalation.",
    ],
    workflowWalkthrough: [
      "New patients pick time-zone-safe appointment slots in a custom booking workspace enforcing provider durations and buffer rules without double-booking.",
      "An automated n8n intake workflow sends confirmation reminders, collects non-clinical paperwork checklists, and flags unfilled cancellation slots for waitlisted patients.",
      "A grounded logistics FAQ assistant answers hours, parking, and prep questions verbatim from clinic policies and immediately hands clinical questions to front-desk staff.",
    ],
    relatedProjectSlugs: [
      "bookos-appointment-scheduler",
      "tideline-support-agent",
      "inbound-lead-qualification-workflow",
      "northwind-analytics-dashboard",
    ],
    relatedServices: [
      { title: "Web & Application Development", href: "/services/web-development", note: "Conflict-free custom scheduling portals and staff operations consoles." },
      { title: "AI Customer Support Agents", href: "/services/ai-agents/support", note: "Policy-grounded logistics FAQ handling with strict human escalation boundaries." },
      { title: "n8n Workflow Automation", href: "/services/n8n-automation", note: "Self-hostable appointment reminders, intake checklists, and waitlist alerts." },
    ],
    pairedExamples: [
      { title: "BookOS Appointment Scheduler", href: "/work/bookos-appointment-scheduler", buildLabel: "Built Prototype" },
      { title: "Tideline Support Agent", href: "/case-studies/tideline-support-agent", buildLabel: "Locally Tested Demo" },
      { title: "Northwind Analytics Dashboard", href: "/case-studies/northwind-analytics-dashboard", buildLabel: "Locally Tested Demo" },
    ],
    fitServiceSlugs: ["web-development", "ai-agents", "n8n-automation", "business-dashboards"],
    mapMarkers: [
      {
        id: "cedarbrook-ne-clinic",
        x: 562,
        y: 174,
        region: "Northeast",
        shortLabel: "C1 · Simulated Clinic North",
        markerKind: "Simulated Clinic Location",
        syntheticLocation: "Northeast Region — Simulated Primary Practice Clinic (Fictional)",
        description: "Synthetic illustrative marker representing a fictional primary appointment clinic running multi-provider scheduling and automated intake reminders. Not a real clinic or address.",
      },
      {
        id: "cedarbrook-south-clinic",
        x: 472,
        y: 306,
        region: "South",
        shortLabel: "C2 · Simulated Clinic South",
        markerKind: "Simulated Clinic Location",
        syntheticLocation: "South Region — Simulated Second Practice Clinic (Fictional)",
        description: "Synthetic illustrative marker representing a fictional sister clinic sharing one unified provider booking calendar and utilization board. Not a real clinic or address.",
      },
    ],
    mapPin: {
      xPct: 68,
      yPct: 44,
      syntheticLabel: "Synthetic Multi-Clinic Markers",
      approximateCoordsLabel: "Synthetic markers (Northeast & South · illustrative only)",
      caption:
        "Illustrative synthetic markers on the studio's regional US map for a fictional two-clinic appointment practice — not a real healthcare provider or address.",
    },
    teamHierarchy: [
      {
        id: "cedarbrook-maya",
        fictionalName: "Dr. Maya Chen (Fictional)",
        role: "Clinical Director & Partner",
        department: "Clinical Leadership",
        reportsTo: null,
        simulatedRegion: "Northeast Region (Simulated)",
        portraitSrc: "/images/services/scenario-clinic-desk.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional clinical director named Dr. Maya Chen",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Approves clinic policy FAQ boundaries so automated responses stay strictly non-clinical and reviews weekly provider chair utilization metrics.",
      },
      {
        id: "cedarbrook-david",
        fictionalName: "David Okafor (Fictional)",
        role: "Practice Operations Manager",
        department: "Practice Operations",
        reportsTo: "cedarbrook-maya",
        simulatedRegion: "Northeast Region (Simulated)",
        portraitSrc: "/images/services/scenario-clinic-desk.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional practice operations manager named David Okafor",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Configures service durations, buffer rules, and automated n8n reminder cadences across both simulated clinic calendars.",
      },
      {
        id: "cedarbrook-sofia",
        fictionalName: "Sofia Alvarez (Fictional)",
        role: "Patient Intake & Scheduling Coordinator",
        department: "Front Desk & Intake",
        reportsTo: "cedarbrook-david",
        simulatedRegion: "South Region (Simulated)",
        portraitSrc: "/images/services/scenario-clinic-desk.jpg",
        portraitAlt: "AI-generated stylized editorial illustration of a fictional patient coordinator named Sofia Alvarez",
        portraitDisclosure: PORTRAIT_DISCLOSURE,
        howTheyUseSystem:
          "Handles escalated patient inquiries directly with full policy context and fills same-day cancellations from the live booking dashboard.",
      },
    ],
  },
];

export function getFictionalProfileBySlug(slug: string): FictionalCustomerProfile | undefined {
  return FICTIONAL_DEMO_PROFILES.find((p) => p.slug === slug);
}

export function allFictionalProfileSlugs(): string[] {
  return FICTIONAL_DEMO_PROFILES.map((p) => p.slug);
}

/**
 * Select ONLY the 1–2 fictional profiles that genuinely align with a given
 * location's matched service hubs, avoiding repetitive forced placement.
 */
export function selectFictionalProfilesForServices(serviceHrefs: string[], max = 2): FictionalCustomerProfile[] {
  const slugs = serviceHrefs.map((h) => h.replace(/^\/services\//, "").split("/")[0]);
  const scored = FICTIONAL_DEMO_PROFILES.map((p) => ({
    profile: p,
    score: p.fitServiceSlugs.filter((s) => slugs.includes(s)).length,
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return (scored.length > 0 ? scored.map((s) => s.profile) : [FICTIONAL_DEMO_PROFILES[1]]).slice(0, max);
}
