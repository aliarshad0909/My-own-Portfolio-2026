/**
 * Cited local economic & business-service content for the EXACT 12 pilot cities
 * defined in `lib/geo/cities.ts`.
 *
 * Governance rules:
 *  - DATA ONLY: does NOT change `publicationState` on any city in `lib/geo/cities.ts`.
 *    All 12 cities remain `NeedsEvidence` (preview-only, noindex, excluded from
 *    production and `sitemap.xml`) until real local signals and editorial review exist.
 *  - Uses ONLY the 12 registered cities (no silently invented cities).
 *  - Business service framing only — zero tourism, lifestyle, or city-guide filler.
 *  - Every factual local claim cites an exact institutional report or data page
 *    (never a generic domain homepage) with inline indices (`sources: [0]`) and
 *    ISO `accessed` dates. Unverified point-in-time numeric claims are excluded.
 *  - Zero fabricated offices, local staff, local clients, or results.
 */

import type { LocalSource, ServiceFit, SourcedParagraph } from "@/lib/geo/local-content-types";
import type { FaqItem } from "@/lib/structured-data";

export type CityLocalContent = {
  /** Keyed as "<stateSlug>/<citySlug>". */
  key: string;
  headline: string;
  angle: string;
  audience: string;
  timeZoneOverlap: string;
  context: SourcedParagraph[];
  serviceFit: ServiceFit[];
  recommendedProjectSlugs: string[];
  faqs: FaqItem[];
  sources: LocalSource[];
};

const CITY_RECORDS: CityLocalContent[] = [
  {
    key: "texas/austin",
    headline: "Remote Web Engineering, SaaS & Automation for Austin, TX Teams",
    angle:
      "Austin's dense technology, professional-services, and advanced-manufacturing labor market rewards lean teams that ship custom web software, CRMs, and AI workflows without agency bloat.",
    audience:
      "B2B SaaS founders, hardware/supply-chain operators, and product-led teams across the Austin metro.",
    timeZoneOverlap:
      "Central Time (CT) — live discovery calls, sprint walkthroughs, and async written reviews align cleanly with Austin morning and midday hours.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics Economy at a Glance tables and Federal Reserve Bank of Dallas Austin Economic Indicators track sustained metropolitan payroll activity across professional and business services, information technology, trade and transportation, and manufacturing.",
        sources: [0, 1],
      },
      {
        text: "Because local engineering talent in the Austin metro remains competitive across software and hardware employers, smaller product teams regularly seek accountable senior execution without expanding full-time payroll prematurely.",
        sources: [0, 1],
      },
      {
        text: "Working remotely as an independent studio lets Austin founders consolidate Next.js application builds, CRM tooling, n8n workflow automation, and consultation-scoped RTX GPU evaluation runs under one technical point of contact, with no physical Austin office claimed or needed.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Build Next.js applications, B2B customer portals, and maintainable internal tooling with automated test coverage.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Deploy scoped support and inbound qualification agents wired cleanly into existing CRMs with human hand-off.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Scope consultation-led RTX compute windows for AI inference benchmarks, model tests, or Blender Cycles product renders.",
      },
    ],
    recommendedProjectSlugs: ["pipelineos-crm", "inbound-lead-qualification-workflow", "tideline-support-agent"],
    faqs: [
      {
        q: "Do you have a physical office or local staff in Austin?",
        a: "No. Ali Arshad Personal Studio operates remotely and works directly with Austin teams via scheduled Central Time calls, written specs, and staging preview URLs.",
      },
      {
        q: "Which demonstration builds are most relevant for Austin B2B SaaS teams?",
        a: "PipelineOS CRM (live PostgreSQL SaaS demonstration at crm.aliarshad.co), the 15-node n8n inbound lead-qualification workflow, and the Tideline knowledge-base support agent.",
      },
    ],
    sources: [
      {
        title: "Austin-Round Rock-San Marcos, TX Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.tx_austin_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Austin Economic Indicators",
        url: "https://www.dallasfed.org/research/indicators/aus",
        publisher: "Federal Reserve Bank of Dallas",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "texas/dallas",
    headline: "Business Dashboards, Internal Software & Automation for Dallas–Fort Worth",
    angle:
      "Corporate operations, financial services, and regional distribution across Dallas–Fort Worth create steady demand for single-source executive dashboards and dependable operational software.",
    audience:
      "Mid-market distribution, finance, corporate operations, and B2B service operators across Dallas–Fort Worth.",
    timeZoneOverlap:
      "Central Time (CT) — kickoff sessions and staged milestone demos fit standard Dallas business hours.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics metropolitan payroll data and Federal Reserve Bank of Dallas DFW Economic Indicators highlight Dallas–Fort Worth's broad employment base across trade, transportation, utilities, professional and business services, financial activities, and manufacturing.",
        sources: [0, 1],
      },
      {
        text: "Dallas Regional Chamber economic development tracking likewise emphasizes corporate operations, finance, and regional logistics corridors where multi-site teams depend on timely operational reporting.",
        sources: [1, 2],
      },
      {
        text: "For DFW operators managing inventory, revenue reporting, or multi-branch workflows across spreadsheets, a remote studio can deliver unified React/PostgreSQL dashboards and n8n data pipelines without agency overhead.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Unify revenue, operations, and multi-warehouse inventory figures from one auditable source of truth.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Replace brittle spreadsheets with custom internal web applications, CRMs, and client portals.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Automate repetitive CRM updates, reporting roll-ups, and cross-system notifications with explicit error handling.",
      },
    ],
    recommendedProjectSlugs: ["stockflow-inventory", "northwind-analytics-dashboard", "pipelineos-crm"],
    faqs: [
      {
        q: "Are you based in Dallas–Fort Worth?",
        a: "No. All software, dashboard, and automation engagements are delivered remotely with Central Time call overlap and clear written milestones.",
      },
      {
        q: "Can we inspect working analytics and operations software before scoping?",
        a: "Yes — StockFlow (live multi-warehouse inventory SaaS at stock.aliarshad.co) and Northwind (revenue analytics over 7,146 generated orders) are open for inspection.",
      },
    ],
    sources: [
      {
        title: "Dallas-Fort Worth-Arlington, TX Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.tx_dallas_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Dallas–Fort Worth Economic Indicators",
        url: "https://www.dallasfed.org/research/indicators/dfw",
        publisher: "Federal Reserve Bank of Dallas",
        accessed: "2026-11-24",
      },
      {
        title: "Prosperity & Economic Development Priorities",
        url: "https://www.dallaschamber.org/priorities/prosperity-economic-development/",
        publisher: "Dallas Regional Chamber",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "florida/miami",
    headline: "Ecommerce Engineering, Sourcing Tooling & Brand Systems for Miami, FL",
    angle:
      "South Florida's international trade corridors, freight infrastructure, and commerce-heavy metro economy favor fast custom storefronts and clean landed-cost tooling.",
    audience:
      "DTC brands, import/export merchants, hospitality operators, and cross-border commerce teams in Miami-Dade.",
    timeZoneOverlap:
      "Eastern Time (ET) — discovery calls, live reviews, and written check-ins run cleanly during Miami morning and early afternoon hours.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics Economy at a Glance tables for the Miami metropolitan area document major employment concentrations in trade, transportation and utilities, professional and business services, financial activities, and leisure and hospitality.",
        sources: [0],
      },
      {
        text: "SelectFlorida's International Business Fast Facts further underscores Florida's international trade gateways and cross-border commercial ties linking South Florida businesses with Latin America, the Caribbean, and global suppliers.",
        sources: [1],
      },
      {
        text: "Delivered remotely, custom storefront engineering, landed-cost and supplier-comparison tooling, and WCAG-verified brand systems help Miami merchants move faster without sacrificing margin clarity.",
      },
    ],
    serviceFit: [
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Build fast custom storefronts with variant logic, integer-cent pricing rules, and inventory enforcement.",
      },
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "Model landed costs across incoterms, duties, and freight and compare international suppliers systematically.",
      },
      {
        service: "Brand & growth",
        href: "/services/branding",
        text: "Deliver cohesive brand systems, accessible design tokens, and email/campaign templates ready for crowded channels.",
      },
    ],
    recommendedProjectSlugs: ["tessera-clayworks-storefront", "lantern-sourcing-platform", "halcyon-brand-system"],
    faqs: [
      {
        q: "Do you operate a Miami office or act as a customs broker?",
        a: "No. This is an independent remote studio. Sourcing support covers supplier research, quote comparison, and landed-cost tooling — legal customs clearance always stays with a licensed broker.",
      },
      {
        q: "Which tools on this site help Miami import and ecommerce teams right away?",
        a: "Try the Landed Cost Calculator, Shipping Cost Calculator, and Profit Margin Calculator in the Calculator Centre before scoping a storefront or sourcing engagement.",
      },
    ],
    sources: [
      {
        title: "Miami-Fort Lauderdale-Pompano Beach, FL Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.fl_miami_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Florida International Business Fast Facts (PDF)",
        url: "https://selectflorida.org/wp-content/uploads/Florida-International-Business-Fast-Facts.pdf",
        publisher: "SelectFlorida",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "new-york/new-york-city",
    headline: "Web Engineering, Automation & Brand Systems for New York City Teams",
    angle:
      "High operating costs and demanding creative benchmarks across the five boroughs make custom web engineering, n8n workflow automation, and sharp brand execution pay back quickly.",
    audience:
      "Professional services, fintech/finance teams, media companies, and consumer brands across New York City.",
    timeZoneOverlap:
      "Eastern Time (ET) — straightforward morning and midday overlap for kickoff calls, demos, and async Slack/email reviews.",
    context: [
      {
        text: "New York City Economic Development Corporation (NYCEDC) reporting and U.S. Bureau of Labor Statistics metro employment tables highlight New York's deep concentration across financial activities, professional and business services, information, and technology.",
        sources: [0, 2],
      },
      {
        text: "At the same time, the Office of the New York City Comptroller's Creative Economy report documents the breadth of the city's advertising, design, media, fashion, and publishing sectors — setting an unusually high bar for digital brand presentation.",
        sources: [1],
      },
      {
        text: "An independent remote studio gives NYC founders and operators senior Next.js engineering, self-hostable n8n automation, brand design systems, and consultation-scoped RTX GPU compute reviews without big-agency retainers.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Ship fast, accessible Next.js marketing sites, client portals, and B2B SaaS tools with clean technical SEO.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Eliminate expensive manual hand-offs across client intake, CRM enrichment, billing notices, and weekly reporting.",
      },
      {
        service: "Brand & growth",
        href: "/services/branding",
        text: "Build documented visual identity systems, measured WCAG contrast palettes, and production-ready web/email assets.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Book consultation-led RTX server runs for AI model evaluation or 3D creative rendering without long cloud commitments.",
      },
    ],
    recommendedProjectSlugs: ["pipelineos-crm", "inbound-lead-qualification-workflow", "halcyon-brand-system"],
    faqs: [
      {
        q: "Are you located in New York City for in-person agency meetings?",
        a: "No. Delivery is 100% remote with Eastern Time call availability, written specifications, and staged staging links.",
      },
      {
        q: "How can an NYC team estimate automation payback before building?",
        a: "Use the Automation ROI Calculator with your team's realistic loaded hourly rate and weekly repetitive hours to check break-even weeks before starting a build.",
      },
    ],
    sources: [
      {
        title: "State of the New York City Economy 2024",
        url: "https://edc.nyc/sites/default/files/2025-01/NYCEDC-State-of-the-NYC-Economy-2024-1.pdf",
        publisher: "New York City Economic Development Corporation (NYCEDC)",
        accessed: "2026-11-24",
      },
      {
        title: "The Creative Economy",
        url: "https://comptroller.nyc.gov/reports/the-creative-economy/",
        publisher: "Office of the New York City Comptroller",
        accessed: "2026-11-24",
      },
      {
        title: "New York-Northern New Jersey-Long Island, NY-NJ-PA Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.ny_newyork_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "california/san-francisco",
    headline: "AI Agents, Product Engineering & RTX Compute for San Francisco Teams",
    angle:
      "San Francisco's technical software and AI startup ecosystem demands auditable agents, fast Next.js product layers, and honest engineering rigor — never superficial chatbot demos.",
    audience:
      "AI startups, developer-tool founders, and technical product teams across San Francisco and the Bay Area.",
    timeZoneOverlap:
      "Pacific Time (PT) — structured async written specs and preview links paired with scheduled morning Pacific Time check-ins.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics Economy at a Glance data for San Francisco–Oakland–Fremont reflects a dense concentration in information, professional and business services, and technology-adjacent industries.",
        sources: [0],
      },
      {
        text: "Research reports published by the Bay Area Council Economic Institute examine ongoing AI, software, and infrastructure shifts across the region — an environment where lean founding teams routinely bring in specialist help for web products, retrieval agents, and evaluation workflows.",
        sources: [1],
      },
      {
        text: "Delivered remotely, this studio builds inspectable AI agents with explicit confidence floors, full-stack Next.js/PostgreSQL web interfaces, and consultation-led RTX GPU compute runs sized honestly to confirmed server capacity.",
      },
    ],
    serviceFit: [
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Engineer grounded retrieval support agents and deterministic voice/chat qualification flows with regression tests.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Ship production Next.js frontends, customer dashboards, and internal ops tools around core AI products.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Evaluate AI inference batches or prototype model tests through a direct technical consultation and custom hourly quote.",
      },
    ],
    recommendedProjectSlugs: ["tideline-support-agent", "kestrel-voice-sales-agent", "pipelineos-crm"],
    faqs: [
      {
        q: "Do you have a San Francisco office or on-site availability?",
        a: "No — this is an independent remote studio. All code, architecture reviews, and compute consultations are handled remotely with scheduled Pacific Time overlap.",
      },
      {
        q: "What makes your AI agent work credible to technical Bay Area buyers?",
        a: "Every demonstration is inspectable and tested: Tideline uses tuned Okapi BM25 retrieval with verbatim policy quoting and 60 automated tests, while Kestrel runs a deterministic slot-filling state machine with 48 tests.",
      },
    ],
    sources: [
      {
        title: "San Francisco-Oakland-Fremont, CA Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.ca_sanfrancisco_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Bay Area Regional Economy & AI Research Reports",
        url: "https://www.bayareaeconomy.org/report/",
        publisher: "Bay Area Council Economic Institute",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "california/los-angeles",
    headline: "Ecommerce, Creative Production & 3D Pipelines for Los Angeles Brands",
    angle:
      "Greater Los Angeles pairs a major creative and entertainment workforce with Pacific trade and logistics infrastructure — a natural match for DTC storefronts, 3D/motion pipelines, and sourcing tools.",
    audience:
      "Direct-to-consumer brands, product companies, media/content teams, and import-driven merchants in Greater Los Angeles.",
    timeZoneOverlap:
      "Pacific Time (PT) — async visual previews, staging URLs, and scheduled morning Pacific Time review sessions.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics metro employment tables and LAEDC Institute for Applied Economics research track Greater Los Angeles across trade, transportation and utilities, information and entertainment media, manufacturing, and professional services.",
        sources: [0, 1],
      },
      {
        text: "California GO-Biz creative-economy documentation reinforces the scale of the state's media, design, and digital-content industries, where consumer brands balance high visual standards with lean production budgets.",
        sources: [1, 2],
      },
      {
        text: "Working remotely, one studio can pair custom Next.js storefronts and supplier landed-cost tooling with reproducible Blender 3D visualization, ffmpeg web-video preparation, and consultation-led RTX GPU rendering.",
      },
    ],
    serviceFit: [
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Ship fast, distinctive storefronts with real variant logic, stock validation, and clean mobile checkout.",
      },
      {
        service: "Creative production",
        href: "/services/creative-production",
        text: "Produce web-optimized video encodes, motion graphics, and scripted Blender 3D product scenes aligned with brand tokens.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Scope dedicated RTX rendering windows for Blender Cycles stills, product turntables, or batch media processing.",
      },
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "Compare overseas suppliers on true landed cost across port freight, volumetric weight, and duties.",
      },
    ],
    recommendedProjectSlugs: ["tessera-clayworks-storefront", "motion-production-pipeline", "blender-product-visualisation"],
    faqs: [
      {
        q: "Are you an on-location studio in Los Angeles?",
        a: "No — all creative production, storefront engineering, and RTX render consultations are delivered remotely. No physical LA office or production stage is implied.",
      },
      {
        q: "Are finished Blender renders or showreels already live on this site?",
        a: "We state status transparently: the reproducible Blender/Python scene system and ffmpeg media pipeline are built and tested, while cleared showreel footage and final Cycles renders remain in preparation.",
      },
    ],
    sources: [
      {
        title: "Los Angeles-Long Beach-Santa Ana, CA Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.ca_losangeles_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Institute for Applied Economics Research & Economic Forecasts",
        url: "https://laedc.org/research/",
        publisher: "Los Angeles County Economic Development Corporation (LAEDC)",
        accessed: "2026-11-24",
      },
      {
        title: "Creative Economy",
        url: "https://business.ca.gov/industries/creative-economy/",
        publisher: "California Governor's Office of Business and Economic Development (GO-Biz)",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "illinois/chicago",
    headline: "Operations Dashboards, Inventory SaaS & Automation for Chicago, IL",
    angle:
      "Chicagoland's diversified freight, advanced manufacturing, food/CPG, and financial backbone relies on clean operational visibility rather than cosmetic brochure sites.",
    audience:
      "Mid-market logistics, warehousing, manufacturing, food/CPG, and financial-operations teams across Chicagoland.",
    timeZoneOverlap:
      "Central Time (CT) — convenient live alignment for morning and midday discovery and sprint reviews.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics Economy at a Glance tables and World Business Chicago key-industry profiles document Chicagoland's balanced economic mix across transportation and logistics, manufacturing, financial services, technology, and corporate headquarters.",
        sources: [0, 1],
      },
      {
        text: "Statewide industry tracking from the Illinois Economic Development Corporation reinforces the scale of regional freight, industrial distribution, and manufacturing operations that generate continuous multi-site inventory and order data.",
        sources: [1, 2],
      },
      {
        text: "Pairing a BBA in Supply Chain Management with full-stack PostgreSQL engineering allows this remote studio to build auditable inventory ledgers, executive KPI dashboards, and automated reporting workflows that replace brittle spreadsheets.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Consolidate revenue, margin, and warehouse KPIs into single-source React dashboards with CSV export.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Build multi-warehouse inventory applications, purchasing portals, and internal business tools.",
      },
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "Structure supplier quote scoring, reorder calculations, and landed-cost comparisons.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Scope dedicated GPU compute runs for industrial/logistics forecasting prototypes or AI document extraction tests.",
      },
    ],
    recommendedProjectSlugs: ["stockflow-inventory", "meridian-inventory-operations", "northwind-analytics-dashboard"],
    faqs: [
      {
        q: "Do you maintain a Chicago office?",
        a: "No. All software, analytics, and supply-chain tooling projects are delivered remotely with Central Time overlap.",
      },
      {
        q: "What live demonstration shows how you prevent inventory drift?",
        a: "Both StockFlow (live multi-warehouse SaaS + mobile companion at stock.aliarshad.co) and Meridian (append-only movement ledger over 1,265 movements) demonstrate auditable balance math.",
      },
    ],
    sources: [
      {
        title: "Chicago-Joliet-Naperville, IL-IN-WI Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.il_chicago_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Key Industries — Explore Chicago Industries",
        url: "https://www.worldbusinesschicago.com/key-industries/",
        publisher: "World Business Chicago",
        accessed: "2026-11-24",
      },
      {
        title: "Illinois Key Industries",
        url: "https://www.illinoisedc.org/key-industries/",
        publisher: "Illinois Economic Development Corporation",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "washington/seattle",
    headline: "n8n Automation, AI Agents & Commerce Engineering for Seattle, WA",
    angle:
      "Greater Seattle's mix of cloud software, aerospace engineering, and Pacific Northwest trade calls for clean, testable automation and web architecture.",
    audience:
      "Cloud/AI product teams, ecommerce brands, and Pacific Northwest trade/operations businesses in Greater Seattle.",
    timeZoneOverlap:
      "Pacific Time (PT) — async written specs, automated test suites, and scheduled morning Pacific Time check-ins.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics Economy at a Glance tables for Seattle–Tacoma–Bellevue show major regional employment across information technology, professional and business services, trade and transportation, and aerospace-linked manufacturing.",
        sources: [0],
      },
      {
        text: "Metropolitan GDP reporting from the U.S. Bureau of Economic Analysis places the Seattle metro among the nation's largest regional economies, pairing high-expectation software buyers with active physical commerce and logistics chains.",
        sources: [0, 1],
      },
      {
        text: "Technical buyers in Seattle scrutinize code quality and maintainability. This remote studio delivers self-hostable n8n automations with unit-tested Code nodes, grounded AI agents, custom Next.js apps, and consultation-led RTX compute windows.",
      },
    ],
    serviceFit: [
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Ship inspectable, self-hostable API orchestration with validation, deduplication, and clean retry handling.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Build policy-grounded support and intake agents with explicit escalation rather than black-box widgets.",
      },
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Engineer fast custom storefronts connected directly to inventory and fulfillment workflows.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Run consultation-scoped AI inference tests or 3D visualization renders on dedicated RTX hardware.",
      },
    ],
    recommendedProjectSlugs: ["inbound-lead-qualification-workflow", "tideline-support-agent", "stockflow-inventory"],
    faqs: [
      {
        q: "Are you based in Seattle or Bellevue?",
        a: "No. All engineering, automation, and compute consultation engagements are delivered remotely with structured async documentation and morning Pacific Time calls.",
      },
      {
        q: "How do you verify n8n workflows before deployment?",
        a: "In our Inbound Lead Qualification demonstration, a 22-test harness extracts and executes the actual JavaScript inside the n8n workflow JSON to prove scoring, validation, and deduplication logic.",
      },
    ],
    sources: [
      {
        title: "Seattle-Tacoma-Bellevue, WA Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.wa_seattle_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Gross Domestic Product by County and Metropolitan Area",
        url: "https://www.bea.gov/data/gdp/gdp-by-county",
        publisher: "U.S. Bureau of Economic Analysis",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "massachusetts/boston",
    headline: "Data Dashboards, Web Apps & Compute Scoping for Boston, MA Teams",
    angle:
      "Greater Boston's concentration of life sciences, education/health systems, and technical research firms values disciplined data interfaces and honest engineering over flashy marketing.",
    audience:
      "Biotech/life-sciences operations teams, university spin-offs, research startups, and B2B technology firms in Greater Boston.",
    timeZoneOverlap:
      "Eastern Time (ET) — smooth morning and midday overlap for technical scoping, reviews, and hand-off calls.",
    context: [
      {
        text: "MassBio's annual Industry Snapshot highlights Massachusetts' position as a leading biopharma and life-sciences cluster centered around Boston and Cambridge, supported by active clinical pipelines and venture investment.",
        sources: [0],
      },
      {
        text: "U.S. Bureau of Labor Statistics Economy at a Glance tables for Boston–Cambridge–Newton similarly document deep employment in education and health services, professional and business services, financial activities, and information.",
        sources: [1],
      },
      {
        text: "For Boston teams working with structured operational data, research portals, or non-regulated evaluation prototypes, a remote studio can build auditable React dashboards, custom web apps, and scoped non-regulated RTX GPU test runs (noting explicitly that certified HIPAA/enterprise compliance is outside scope).",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Deliver accessible, single-source analytical views where charts and underlying data tables never contradict.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Build clean Next.js web applications, research portals, and internal tooling with strict TypeScript boundaries.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Consult on non-regulated AI model testing, evaluation sweeps, or 3D scientific/product visualization rendering.",
      },
    ],
    recommendedProjectSlugs: ["northwind-analytics-dashboard", "pipelineos-crm", "tideline-support-agent"],
    faqs: [
      {
        q: "Do you handle HIPAA-regulated patient data or maintain a Boston office?",
        a: "No. This is an independent remote studio without a Boston office, and certified HIPAA/SOC 2 clinical hosting is outside scope. Engagements focus on non-regulated commercial operations, public-facing web tools, and clearly scoped internal prototypes.",
      },
      {
        q: "How do you ensure accessibility in data-heavy dashboards?",
        a: "In our Northwind Analytics demonstration, every hand-drawn SVG chart ships with a visually hidden semantic data table so screen-reader users get exact figures.",
      },
    ],
    sources: [
      {
        title: "Massachusetts Biopharma Industry Snapshot",
        url: "https://www.massbio.org/industry-reports/industry-snapshot/",
        publisher: "MassBio (Massachusetts Biotechnology Council)",
        accessed: "2026-11-24",
      },
      {
        title: "Boston-Cambridge-Newton, MA-NH Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.ma_boston_mn.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "colorado/denver",
    headline: "Web Applications, Dashboards & Automation for Denver, CO Businesses",
    angle:
      "Metro Denver's Front Range corridor combines Colorado's aerospace sector with software, engineering services, and regional distribution — a strong fit for custom web and data systems.",
    audience:
      "Aerospace/technical suppliers, software startups, engineering operators, and regional distributors along Colorado's Front Range.",
    timeZoneOverlap:
      "Mountain Time (MT) — reliable morning and midday overlap for scoping calls and live milestone walkthroughs.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics Economy at a Glance tables for the Denver metropolitan area document broad employment across professional and business services, trade and transportation, information, financial activities, and manufacturing.",
        sources: [0],
      },
      {
        text: "Colorado Office of Economic Development and International Trade (OEDIT) aerospace profiles highlight the Front Range's major aerospace and technical engineering base, where lean suppliers and operators increasingly rely on bespoke web portals and operational dashboards.",
        sources: [1],
      },
      {
        text: "Delivered remotely with Mountain Time alignment, custom Next.js software, operational dashboards, n8n workflows, and consultation-led RTX compute windows help lean Front Range firms execute without hiring multi-discipline teams.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Build customer portals, supplier apps, and maintainable marketing sites in Next.js and TypeScript.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Surface operations, fleet, and project metrics in fast browser dashboards backed by clean data models.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Connect intake forms, CRMs, spreadsheets, and notifications reliably across distributed teams.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Scope dedicated RTX runs for AI inference testing, simulation prototypes, or 3D engineering visualization.",
      },
    ],
    recommendedProjectSlugs: ["pipelineos-crm", "northwind-analytics-dashboard", "kestrel-voice-sales-agent"],
    faqs: [
      {
        q: "Do you work on-site in Denver or Boulder?",
        a: "No. Engagements are delivered remotely with Mountain Time call overlap, staged preview URLs, and clean repository hand-off.",
      },
      {
        q: "Can we scope an MVP or internal tool range before a call?",
        a: "Yes — the Web Project Estimator and Project Budget Calculator let you model illustrative scope and effort ranges directly in your browser.",
      },
    ],
    sources: [
      {
        title: "Denver-Aurora-Broomfield, CO Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.co_denver_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Aerospace — Key Industries",
        url: "https://choosecolorado.com/key-industries/aerospace/",
        publisher: "Colorado Office of Economic Development & International Trade",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "georgia/atlanta",
    headline: "n8n Automation, Logistics Tooling & Creative Production for Atlanta, GA",
    angle:
      "Metro Atlanta's blend of fintech/technology, Southeast freight logistics, and digital media production maps directly onto workflow automation and visual pipelines.",
    audience:
      "Fintech/B2B service firms, logistics and procurement teams, and media/consumer brands across Metro Atlanta.",
    timeZoneOverlap:
      "Eastern Time (ET) — straightforward morning and midday overlap for Atlanta teams.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics Economy at a Glance tables and Metro Atlanta Chamber key-industry profiles highlight a regional economy anchored by supply chain and logistics, technology and fintech, financial services, and media production.",
        sources: [0, 1],
      },
      {
        text: "Expanding corporate and technology operations across Metro Atlanta add steady demand for back-office workflow integration, customer intake automation, operational dashboards, and brand-consistent creative production.",
        sources: [0, 1],
      },
      {
        text: "As a remote independent studio, we deliver tested n8n workflows, inventory/analytics platforms, ffmpeg/Blender creative pipelines, and consultation-led RTX GPU rendering without pretending to operate a local Atlanta branch.",
      },
    ],
    serviceFit: [
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Automate lead qualification, CRM sync, dispatch notifications, and recurring operational reporting.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Track multi-site logistics, revenue trends, and inventory health from one consistent interface.",
      },
      {
        service: "Creative production",
        href: "/services/creative-production",
        text: "Prepare channel-ready video cuts, motion graphics, and scripted Blender 3D product visuals.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Book consultation-scoped RTX render or batch media/AI runs without paying for idle cloud instances.",
      },
    ],
    recommendedProjectSlugs: ["inbound-lead-qualification-workflow", "stockflow-inventory", "motion-production-pipeline"],
    faqs: [
      {
        q: "Do you have a physical office or film crew in Atlanta?",
        a: "No. Delivery is remote nationwide; creative production focuses on editing, motion graphics, web encoding pipelines, and Blender 3D visualization rather than on-location filming.",
      },
      {
        q: "Which tools help Atlanta operations teams scope automation or logistics software?",
        a: "Start with the Automation ROI Calculator or Inventory Reorder Calculator in the Calculator Centre, then share your workflow goals on a brief discovery call.",
      },
    ],
    sources: [
      {
        title: "Atlanta-Sandy Springs-Marietta, GA Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.ga_atlanta_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Metro Atlanta Key Industries",
        url: "https://metroatlantachamber.com/built-for-business/key-industries/",
        publisher: "Metro Atlanta Chamber",
        accessed: "2026-11-24",
      },
    ],
  },
  {
    key: "arizona/phoenix",
    headline: "Web Software, Operations Tooling & Automation for Phoenix, AZ Teams",
    angle:
      "Greater Phoenix's semiconductor manufacturing build-out, regional logistics corridors, and expanding technical-services base pull in supplier and B2B firms needing modern web software.",
    audience:
      "Advanced-manufacturing suppliers, industrial logistics operators, B2B service firms, and growing tech companies in Greater Phoenix.",
    timeZoneOverlap:
      "Mountain Standard Time (MST, no DST) — clean alignment across Mountain/Pacific working windows with async previews.",
    context: [
      {
        text: "U.S. Bureau of Labor Statistics Economy at a Glance tables for Phoenix–Mesa–Glendale track large regional employment pillars in trade and transportation, professional and business services, financial activities, and manufacturing.",
        sources: [0],
      },
      {
        text: "Arizona Commerce Authority semiconductor industry documentation highlights major fabrication and supplier investments across Greater Phoenix, expanding demand for clean internal portals, inventory tools, and B2B operational visibility.",
        sources: [1],
      },
      {
        text: "Working remotely, this studio helps Phoenix suppliers, distributors, and B2B teams replace manual spreadsheets with custom Next.js portals, operational dashboards, n8n workflows, and consultation-scoped RTX GPU tests.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Build B2B web portals, supplier intake apps, and fast company websites tailored to technical buyers.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Turn inventory, order, and production metrics into clear operational views with zero spreadsheet drift.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Streamline repetitive quote intake, support triage, and document workflows with human escalation.",
      },
      {
        service: "RTX GPU compute rental",
        href: "/services/gpu-compute",
        text: "Evaluate AI inference or 3D industrial/product visualization renders via consultation-led RTX access.",
      },
    ],
    recommendedProjectSlugs: ["meridian-inventory-operations", "stockflow-inventory", "pipelineos-crm"],
    faqs: [
      {
        q: "Are you physically located in Phoenix or Chandler?",
        a: "No. Ali Arshad Personal Studio serves Greater Phoenix businesses remotely with transparent written milestones and no implied local branch.",
      },
      {
        q: "Which live demonstration fits Phoenix manufacturing and distribution suppliers?",
        a: "Inspect StockFlow (multi-warehouse inventory & order operations at stock.aliarshad.co) and Meridian (append-only inventory and purchasing ledger).",
      },
    ],
    sources: [
      {
        title: "Phoenix-Mesa-Glendale, AZ Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.az_phoenix_msa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-24",
      },
      {
        title: "Semiconductor Advantages",
        url: "https://www.azcommerce.com/industries/manufacturing/semiconductor-advantages/",
        publisher: "Arizona Commerce Authority",
        accessed: "2026-11-24",
      },
    ],
  },
];

export const CITY_LOCAL_CONTENT: Record<string, CityLocalContent> = Object.fromEntries(
  CITY_RECORDS.map((c) => [c.key, c]),
);

export const getCityLocalContent = (stateSlug: string, citySlug: string): CityLocalContent | undefined =>
  CITY_LOCAL_CONTENT[`${stateSlug}/${citySlug}`];

export const allCityLocalContent = (): CityLocalContent[] => CITY_RECORDS;
