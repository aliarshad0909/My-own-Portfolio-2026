/**
 * Local content for the 8 rendered state × service scaffolds.
 *
 * DATA ONLY: does not change publication state or indexability. Keyed by
 * "<serviceSlug>:<stateSlug>". Real, cited, remote-framed content only.
 */
import type { ServiceAreaLocalContent } from "@/lib/geo/local-content-types";

export const SERVICE_AREA_LOCAL: Record<string, ServiceAreaLocalContent> = {
  "web-development:texas": {
    angle: "Texas runs on small businesses, and most of them still need modern web and software to compete.",
    context: [
      {
        text: "Texas is home to roughly 3.5 million small businesses, about 99.8% of all businesses in the state, and they employ some 5.1 million people, 44.4% of the Texas workforce.",
        sources: [0],
      },
      {
        text: "The wider economy reached about $2.9 trillion in 2025, and over the year to September Texas added 154,300 jobs, the most of any state.",
        sources: [1],
      },
      {
        text: "For an independent studio working remotely, that breadth is the opportunity: a large, dispersed base of operators, from Austin and Dallas software firms to Gulf Coast logistics and energy-services companies, that need fast, maintainable marketing sites, customer portals and internal tools without the overhead of a full agency. Delivery is remote; the fit is the sheer volume of businesses still running on dated or templated web stacks.",
      },
    ],
    sources: [
      {
        title: "Texas 2025 Small Business Profile",
        url: "https://advocacy.sba.gov/wp-content/uploads/2025/06/Texas_2025-State-Profile.pdf",
        publisher: "U.S. Small Business Administration, Office of Advocacy",
        accessed: "2026-11-23",
      },
      {
        title: "Texas Economic Snapshot",
        url: "https://gov.texas.gov/business/page/texas-economic-snapshot",
        publisher: "Office of the Governor of Texas",
        accessed: "2026-11-23",
      },
    ],
  },

  "web-development:california": {
    angle: "California's economy is a software economy, which is exactly what a web and software studio is built for.",
    context: [
      {
        text: "In California the information sector is about 15% of GDP and professional services about 17%, together roughly a third of state output, and both driven mainly by technology.",
        sources: [0],
      },
      {
        text: "The number of California businesses with paid employees has grown more than 52% since 2005, and about 2.2 million Californians work for themselves as owners, contractors or gig workers.",
        sources: [0],
      },
      {
        text: "That concentration shows up in capital too: through mid-2025, California startups raised more than $110 billion, close to two-thirds of all US venture funding.",
        sources: [1],
      },
      {
        text: "A remote studio fits this market by building the layer most of these companies actually need day to day: product marketing sites, customer dashboards, internal tooling and the web front ends around their software. No local presence is implied, the work is the custom engineering a template can't cover, delivered remotely for a market that expects it.",
      },
    ],
    sources: [
      {
        title: "California's Economy",
        url: "https://www.ppic.org/publication/californias-economy/",
        publisher: "Public Policy Institute of California (PPIC)",
        accessed: "2026-11-23",
      },
      {
        title: "California Leads US Startup Funding in 2025",
        url: "https://news.crunchbase.com/venture/california-leads-startup-funding-2025-data",
        publisher: "Crunchbase News",
        accessed: "2026-11-23",
      },
    ],
  },

  "n8n-automation:new-york": {
    angle: "In New York, every manual workflow is expensive, which is what makes automation pay for itself.",
    context: [
      {
        text: "Average annual pay across all New York State jobs was $95,152 in 2024, nearly 26% above the US average of $75,590, with finance and insurance accounting for almost half of that gap.",
        sources: [0],
      },
      {
        text: "In New York City the average private-sector wage reached about $117,000 in 2023, finance-and-insurance roles averaged $362,000, and the city counted a record 286,600 business establishments.",
        sources: [1],
      },
      {
        text: "n8n workflow automation earns its keep fastest where labour is dear and processes are repetitive, reconciliations, client onboarding, reporting and data handoffs across finance, media and professional-services firms. An independent studio can design and host these workflows remotely, so a New York team reclaims expensive hours without adding headcount.",
      },
    ],
    sources: [
      {
        title: "DiNapoli: Service-Providing Industry Sectors Dominate the State's 21st Century Economy",
        url: "https://www.osc.ny.gov/press/releases/2026/03/dinapoli-service-providing-industry-sectors-dominate-states-21st-century-economy",
        publisher: "Office of the New York State Comptroller",
        accessed: "2026-11-23",
      },
      {
        title: "State of the New York City Economy 2024",
        url: "https://edc.nyc/sites/default/files/2025-01/NYCEDC-State-of-the-NYC-Economy-2024-1.pdf",
        publisher: "New York City Economic Development Corporation (NYCEDC)",
        accessed: "2026-11-23",
      },
    ],
  },

  "ai-agents:california": {
    angle: "California is where AI is being built, and where businesses are quickest to put agents to work.",
    context: [
      {
        text: "Through July 2025, California startups raised more than $110 billion, close to two-thirds of all US venture funding, a share the data attributes largely to the AI boom.",
        sources: [0],
      },
      {
        text: "That momentum sits on top of a tech-driven economy whose information sector is about 15% of GDP and professional services about 17%.",
        sources: [1],
      },
      {
        text: "The result is unusually high appetite for AI agents: startups and support teams facing large inbound volumes want agents that triage tickets, answer from a knowledge base and automate back-office steps. A remote studio can scope, build and integrate these agents into existing stacks for California teams, no local office, just delivery into a market already primed to adopt.",
      },
    ],
    sources: [
      {
        title: "California Leads US Startup Funding in 2025",
        url: "https://news.crunchbase.com/venture/california-leads-startup-funding-2025-data",
        publisher: "Crunchbase News",
        accessed: "2026-11-23",
      },
      {
        title: "California's Economy",
        url: "https://www.ppic.org/publication/californias-economy/",
        publisher: "Public Policy Institute of California (PPIC)",
        accessed: "2026-11-23",
      },
    ],
  },

  "ecommerce-development:florida": {
    angle: "Florida pairs a fast-growing merchant base with a huge visitor audience and a direct line to Latin America, ideal ground for ecommerce.",
    context: [
      {
        text: "Florida recorded 667,031 new business applications in 2023, third-highest per capita of any state, including 127,895 in Miami-Dade alone.",
        sources: [0],
      },
      {
        text: "The state drew a record 142.9 million visitors in 2024, among them 12.2 million international travellers.",
        sources: [1],
      },
      {
        text: "Florida is also a trade gateway: over 55,000 exporting companies, about a fifth of all US exporters, and nearly a third of US trade with Latin America and the Caribbean excluding Mexico, with Miami International Airport first in the nation for international freight.",
        sources: [2],
      },
      {
        text: "For ecommerce that means real demand for storefronts built to sell beyond a single market, multi-currency checkout, English and Spanish catalogues and cross-border shipping flows for DTC brands reaching both tourists and Latin-American buyers. An independent studio delivers these builds remotely; the local fit is Florida's merchant growth and its outward-facing trade.",
      },
    ],
    sources: [
      {
        title: "New Business Applications: A State-by-State View (Florida)",
        url: "https://www.uschamber.com/small-business/new-business-applications-a-state-by-state-view?state=fl",
        publisher: "U.S. Chamber of Commerce (U.S. Census Bureau Business Formation Statistics)",
        accessed: "2026-11-23",
      },
      {
        title: "Record Broken Again: Florida Announces Highest Tourism Numbers in State History for 2024",
        url: "https://www.flgov.com/eog/news/press/2025/record-broken-again-florida-announces-highest-tourism-numbers-state-history-2024",
        publisher: "Executive Office of the Governor of Florida",
        accessed: "2026-11-23",
      },
      {
        title: "Florida International Business Fast Facts",
        url: "https://selectflorida.org/wp-content/uploads/Florida-International-Business-Fast-Facts.pdf",
        publisher: "SelectFlorida",
        accessed: "2026-11-23",
      },
    ],
  },

  "business-dashboards:illinois": {
    angle: "Illinois moves goods, money and food at national scale, and that generates data worth putting on a dashboard.",
    context: [
      {
        text: "Illinois has over $1 trillion in GDP and is home to 32 Fortune 500 companies; its transportation, warehousing and wholesale trade accounts for 12.5% of state output versus 9.4% nationally, and about a quarter of all US freight moves through Chicago's rail corridors.",
        sources: [0, 1],
      },
      {
        text: "Logistics employs some 310,857 people in the state, advanced manufacturing 193,232 and food, agribusiness and CPG 177,289; financial services make up 7.3% of Chicago's workforce against 5.8% nationally, in a city long described as the capital of futures trading.",
        sources: [0, 1],
      },
      {
        text: "Operations at that scale throw off exactly the kind of fragmented data, across logistics, production, inventory and finance, that benefits from a single analytics dashboard. A remote studio can consolidate those feeds into clear operational and financial views for Illinois teams, built and maintained without a local office.",
      },
    ],
    sources: [
      {
        title: "Illinois 2024 Economic Growth Plan",
        url: "https://dceo.illinois.gov/content/dam/soi/en/web/dceo/aboutdceo/reportsrequiredbystatute/ilinois-2024-economic-growth-plan.pdf",
        publisher: "Illinois Department of Commerce & Economic Opportunity (DCEO)",
        accessed: "2026-11-23",
      },
      {
        title: "State of Illinois Economic Forecast 2025",
        url: "https://cgfa.ilga.gov/Upload/2025StateofILEconomicForecast.pdf",
        publisher: "Commission on Government Forecasting and Accountability, Illinois General Assembly",
        accessed: "2026-11-23",
      },
    ],
  },

  "branding:new-york": {
    angle: "New York is the United States' advertising capital, the most crowded, highest-benchmark market a brand can enter.",
    context: [
      {
        text: "As of the city comptroller's 2017 benchmarking, New York City held 22.1% of all US advertising employment, about 47,600 jobs, at an average advertising wage of $135,334, well above the citywide all-industry average of $89,766.",
        sources: [0],
      },
      {
        text: "The city has since reached a record 286,600 business establishments, with roughly 24,600 new businesses formed in 2023.",
        sources: [1],
      },
      {
        text: "That density sets a high bar: consumer brands compete for attention against the best-resourced agencies in the country. An independent studio works this market remotely on brand and growth, identity, positioning and the assets a brand needs to stand out, as a lean alternative for companies that want agency-grade thinking without agency overhead.",
      },
    ],
    sources: [
      {
        title: "The Creative Economy",
        url: "https://comptroller.nyc.gov/reports/the-creative-economy/",
        publisher: "Office of the New York City Comptroller",
        accessed: "2026-11-23",
      },
      {
        title: "State of the New York City Economy 2024",
        url: "https://edc.nyc/sites/default/files/2025-01/NYCEDC-State-of-the-NYC-Economy-2024-1.pdf",
        publisher: "New York City Economic Development Corporation (NYCEDC)",
        accessed: "2026-11-23",
      },
    ],
  },

  "creative-production:california": {
    angle: "California is the centre of gravity for content, which is where creative-production demand concentrates.",
    context: [
      {
        text: "California was home to about 180,000 creative-economy jobs in 2025, roughly one in four of all such jobs in the United States.",
        sources: [0],
      },
      {
        text: "It sits within a tech-driven economy whose information sector alone is about 15% of state GDP.",
        sources: [1],
      },
      {
        text: "Beyond Hollywood, that ecosystem feeds a constant appetite for product and marketing content, video, launch assets and DTC creative, from the state's brands and startups. An independent studio can deliver this production remotely, plugging into California teams' content pipelines without implying any on-the-ground presence.",
      },
    ],
    sources: [
      {
        title: "Creative Economy",
        url: "https://business.ca.gov/industries/creative-economy/",
        publisher: "California Governor's Office of Business and Economic Development (GO-Biz)",
        accessed: "2026-11-23",
      },
      {
        title: "California's Economy",
        url: "https://www.ppic.org/publication/californias-economy/",
        publisher: "Public Policy Institute of California (PPIC)",
        accessed: "2026-11-23",
      },
    ],
  },
};

export const getServiceAreaLocal = (serviceSlug: string, stateSlug: string): ServiceAreaLocalContent | undefined =>
  SERVICE_AREA_LOCAL[`${serviceSlug}:${stateSlug}`];
