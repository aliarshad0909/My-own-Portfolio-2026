/**
 * Tier-1 City Pilot research & differentiated local content.
 *
 * Governance rules:
 *  - Every factual local claim cites a primary institutional/government source
 *    with `checkedDate` and a 6-month `reviewBy` freshness date.
 *  - Zero fabricated local offices, local employees, or unverified local clients.
 *  - Pilot cities render as `PublicNoIndex` for owner review and stay excluded
 *    from `sitemap.xml` until the owner approves the city list & local signal.
 */

export type CitySource = {
  label: string;
  publisher: string;
  url: string;
  checkedDate: string;
  reviewBy: string;
};

export type CityFocusBlock = {
  heading: string;
  summary: string;
  points: string[];
};

export type CityPilotGuide = {
  stateSlug: string;
  citySlug: string;
  headline: string;
  audience: string;
  timeZoneOverlap: string;
  primaryQuestionAnswered: string;
  remoteDisclosure: string;
  localFocus: CityFocusBlock[];
  recommendedServices: { label: string; href: string; reason: string }[];
  relatedProjectSlugs: string[];
  relatedInsightSlugs: string[];
  sources: CitySource[];
};

export const CITY_PILOTS: CityPilotGuide[] = [
  {
    stateSlug: "texas",
    citySlug: "austin",
    headline: "Remote Web Engineering, SaaS & AI Automation for Austin, TX Teams",
    audience:
      "Fast-scaling B2B SaaS founders, hardware/semiconductor supply-chain teams, and product-led businesses across the Austin–Round Rock–San Marcos metro.",
    timeZoneOverlap:
      "Central Time (CT) — live kickoff calls, weekly sprint demos, and Slack/async hand-offs scheduled during standard Austin morning and midday hours.",
    primaryQuestionAnswered:
      "How can a lean Austin software or hardware-adjacent business ship production Next.js applications, CRM/operations tooling, and sharp launch visuals without hiring a multi-vendor local agency?",
    remoteDisclosure:
      "Ali Arshad Personal Studio works remotely with Austin businesses. I do not maintain a physical Austin office, local W-2 staff, or imply existing Austin clients on this page.",
    localFocus: [
      {
        heading: "Austin's startup & high-tech operating reality",
        summary:
          "Regional economic tracking from Opportunity Austin and the Federal Reserve Bank of Dallas highlights Austin's high concentration of software, semiconductor, and professional services firms alongside rapid metro population growth.",
        points: [
          "High local engineering salaries make full-time hires expensive when a seed or Series A team mainly needs a focused web app, customer portal, or internal CRM built quickly.",
          "Product launches in crowded B2B SaaS and hardware categories often stall because web engineering, product visualization, and marketing automation sit with disconnected freelancers.",
        ],
      },
      {
        heading: "Where one studio adds practical leverage",
        summary:
          "Combining Next.js/PostgreSQL product engineering with n8n automation and creative launch assets compresses hand-off time.",
        points: [
          "Custom web apps & B2B SaaS MVPs modeled on clean, MIT-permissive architectures (inspect the live PipelineOS CRM demo at crm.aliarshad.co).",
          "Inbound lead-qualification and support triage pipelines built in n8n with explicit human escalation gates.",
          "Product launch visuals, motion graphics, and Blender 3D renders aligned with the actual software UI.",
        ],
      },
      {
        heading: "Practical remote working cadence with Central Time teams",
        summary:
          "Async written specs paired with live Central Time milestone walkthroughs keep projects predictable across Austin's Downtown, Domain, and Round Rock tech corridors without commute overhead.",
        points: [
          "Written scope and fixed milestone reviews before code or visuals start.",
          "Preview URLs and recorded walkthroughs delivered so distributed Austin teams can review on their own schedule.",
        ],
      },
    ],
    recommendedServices: [
      {
        label: "Web & Software Development",
        href: "/services/web-development",
        reason: "Next.js, TypeScript, and PostgreSQL web applications and customer portals.",
      },
      {
        label: "AI Agents & Workflow Automation",
        href: "/services/ai-agents",
        reason: "Scoped support and lead-routing agents that integrate cleanly with B2B CRMs.",
      },
      {
        label: "Creative Production & 3D",
        href: "/services/creative-production",
        reason: "Product visualization, motion graphics, and launch video assets.",
      },
    ],
    relatedProjectSlugs: ["pipelineos-crm", "inbound-lead-qualification-workflow"],
    relatedInsightSlugs: [
      "building-pipelineos-mit-clean-crm",
      "practical-ai-agents-human-handoff-architecture",
    ],
    sources: [
      {
        label: "Austin Economy & Regional Market Indicators",
        publisher: "Federal Reserve Bank of Dallas",
        url: "https://www.dallasfed.org/",
        checkedDate: "2026-11-23",
        reviewBy: "2027-05-23",
      },
      {
        label: "Austin Metro Business & Talent Overview",
        publisher: "Opportunity Austin",
        url: "https://www.opportunityaustin.com/",
        checkedDate: "2026-11-23",
        reviewBy: "2027-05-23",
      },
      {
        label: "City of Austin Official Municipal Portal",
        publisher: "City of Austin",
        url: "https://www.austintexas.gov/",
        checkedDate: "2026-11-23",
        reviewBy: "2027-05-23",
      },
    ],
  },
  {
    stateSlug: "illinois",
    citySlug: "chicago",
    headline: "Operations Software, Data Dashboards & Automation for Chicago, IL Businesses",
    audience:
      "Mid-market distribution, logistics, advanced manufacturing, food/CPG, and financial/B2B service operators across Chicagoland.",
    timeZoneOverlap:
      "Central Time (CT) — live discovery sessions and milestone reviews scheduled cleanly during standard Chicago business hours.",
    primaryQuestionAnswered:
      "How can Chicagoland logistics, manufacturing, and mid-market teams replace fragile spreadsheets with reliable inventory software, executive analytics, and automated workflows?",
    remoteDisclosure:
      "Ali Arshad Personal Studio serves Chicago clients remotely as an independent studio. There is no physical Chicago office and no implied local client roster.",
    localFocus: [
      {
        heading: "Chicagoland's diversified industrial & logistics backbone",
        summary:
          "Regional economic data compiled by World Business Chicago and the Illinois Economic Development Corporation highlights Chicagoland's unique balance across freight/logistics (O'Hare, Class I rail corridors, Will County warehousing), advanced manufacturing, food processing, and financial services — with no single sector dominating the economy.",
        points: [
          "Multi-warehouse distributors and mid-market manufacturers frequently run critical stock counts, supplier quotes, and order statuses across disconnected ERP exports and spreadsheets.",
          "Leadership teams in operations and finance need dependable visibility into margins, inventory turns, and fulfillment bottlenecks rather than cosmetic marketing sites.",
        ],
      },
      {
        heading: "Software, analytics & supply-chain fit",
        summary:
          "Because this studio pairs a BBA in Supply Chain Management with full-stack PostgreSQL engineering, operational builds start from real unit-cost, bin-balance, and fulfillment rules.",
        points: [
          "Multi-warehouse inventory and order-fulfillment platforms preventing negative stock balances (test the live StockFlow demo at stock.aliarshad.co).",
          "Executive KPI and margin dashboards turning raw CSV/API feeds into decision-ready reporting (see Northwind Analytics).",
          "Supplier comparison, landed-cost modeling, and n8n document/order routing automations.",
        ],
      },
      {
        heading: "Practical remote delivery for multi-site Midwest teams",
        summary:
          "Whether operations span downtown Chicago offices and suburban distribution hubs in DuPage, Lake, or Will County, staged preview builds and mobile-ready web tools keep floor and office teams aligned.",
        points: [
          "Clear data-migration and schema specifications reviewed before production rollout.",
          "Maintainable TypeScript/PostgreSQL codebases with clean hand-off documentation.",
        ],
      },
    ],
    recommendedServices: [
      {
        label: "Business Dashboards & Analytics",
        href: "/services/business-dashboards",
        reason: "Operational KPIs, margin tracking, and executive reporting dashboards.",
      },
      {
        label: "Web & Software Development",
        href: "/services/web-development",
        reason: "Custom internal tools, inventory platforms, and client portals.",
      },
      {
        label: "Global Sourcing & Supply Chain",
        href: "/services/global-sourcing",
        reason: "Landed-cost analysis, supplier comparison, and procurement workflows.",
      },
    ],
    relatedProjectSlugs: ["stockflow-inventory", "northwind-analytics-dashboard"],
    relatedInsightSlugs: [
      "preventing-negative-inventory-postgres-transactions",
      "building-pipelineos-mit-clean-crm",
    ],
    sources: [
      {
        label: "Chicago Metropolitan Economy & Key Industries",
        publisher: "World Business Chicago",
        url: "https://worldbusinesschicago.com/",
        checkedDate: "2026-11-23",
        reviewBy: "2027-05-23",
      },
      {
        label: "Illinois Transportation, Manufacturing & Corporate Economic Profile",
        publisher: "Illinois Economic Development Corporation",
        url: "https://www.illinoisedc.org/",
        checkedDate: "2026-11-23",
        reviewBy: "2027-05-23",
      },
    ],
  },
  {
    stateSlug: "washington",
    citySlug: "seattle",
    headline: "AI Workflow Automation, E-Commerce & Product Engineering for Seattle, WA Teams",
    audience:
      "E-commerce brands, cloud/AI product teams, and Puget Sound trade/operations businesses in Seattle, Bellevue, and Tacoma.",
    timeZoneOverlap:
      "Pacific Time (PT) — structured async previews paired with scheduled morning Pacific Time review calls.",
    primaryQuestionAnswered:
      "How can Seattle e-commerce, SaaS, and trade-oriented teams ship practical AI support/sales workflows and custom storefronts with high engineering rigor and clear UX?",
    remoteDisclosure:
      "Ali Arshad Personal Studio serves Seattle and Pacific Northwest clients remotely. I do not maintain a Seattle office or claim local Seattle clients on this page.",
    localFocus: [
      {
        heading: "Seattle's cloud, e-commerce & Pacific trade ecosystem",
        summary:
          "Economic profiles from the City of Seattle, Greater Seattle Partners, and Washington State Commerce highlight the metro's dual strength in cloud/AI engineering and global e-commerce alongside Pacific Rim maritime and aerospace supply chains.",
        points: [
          "E-commerce and retail-tech teams in the Puget Sound region face intense expectations around storefront speed, clean checkout logic, and automated post-purchase support.",
          "Technical buyers in Seattle scrutinize architecture, security, and maintainability — generic templates and fragile no-code hacks rarely pass review.",
        ],
      },
      {
        heading: "High-fit studio capabilities for Puget Sound businesses",
        summary:
          "Clean TypeScript engineering paired with practical AI workflows and visual product communication.",
        points: [
          "Custom Next.js e-commerce storefronts and inventory/order integrations (see Tessera Clayworks and live StockFlow).",
          "Scoped AI support agents and n8n workflow automation with schema validation and explicit human hand-offs.",
          "Blender 3D product renders and motion assets built for fast Core Web Vitals.",
        ],
      },
      {
        heading: "Async-first workflow tuned for Pacific Time",
        summary:
          "Written RFCs, live staging URLs, and automated test suites ensure progress continues smoothly across time zones with crisp morning PT check-ins when needed.",
        points: [
          "Every build ships with automated validation, clean Git history, and documented environment configuration.",
          "Transparent distinction between solo studio execution and vetted independent collaborators when extra capacity is needed.",
        ],
      },
    ],
    recommendedServices: [
      {
        label: "n8n Workflow Automation",
        href: "/services/n8n-automation",
        reason: "Reliable API orchestration across e-commerce, CRM, and support stacks.",
      },
      {
        label: "E-Commerce Development",
        href: "/services/ecommerce-development",
        reason: "Fast custom storefronts connected cleanly to inventory and fulfillment.",
      },
      {
        label: "AI Agents & Assistants",
        href: "/services/ai-agents",
        reason: "Policy-grounded support and qualification agents with human escalation.",
      },
    ],
    relatedProjectSlugs: ["tessera-clayworks-storefront", "tideline-support-agent"],
    relatedInsightSlugs: [
      "practical-ai-agents-human-handoff-architecture",
      "designing-motion-and-3d-without-hurting-web-performance",
    ],
    sources: [
      {
        label: "Greater Seattle Industry Sectors — ICT, Aerospace & Maritime",
        publisher: "Greater Seattle Partners",
        url: "https://greater-seattle.com/",
        checkedDate: "2026-11-23",
        reviewBy: "2027-05-23",
      },
      {
        label: "City of Seattle Economic Development & Trade Context",
        publisher: "City of Seattle",
        url: "https://www.seattle.gov/",
        checkedDate: "2026-11-23",
        reviewBy: "2027-05-23",
      },
      {
        label: "Washington State Key Industry Sectors",
        publisher: "Washington State Department of Commerce",
        url: "https://choosewashingtonstate.com/",
        checkedDate: "2026-11-23",
        reviewBy: "2027-05-23",
      },
    ],
  },
];

export const getCityPilot = (stateSlug: string, citySlug: string): CityPilotGuide | undefined =>
  CITY_PILOTS.find((c) => c.stateSlug === stateSlug && c.citySlug === citySlug);
