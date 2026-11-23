/**
 * NORTHEAST state local content. Real, cited, remote-framed. Filled by research.
 * Keys are state slugs (see lib/geo/states.ts). Omit a state until it has a
 * genuine local signal and at least one real source; never fabricate.
 */
import type { StateLocalContent } from "@/lib/geo/local-content-types";

export const NORTHEAST_LOCAL: Record<string, StateLocalContent> = {
  connecticut: {
    angle: "One of the most finance- and insurance-weighted economies in the country.",
    context: [
      {
        text: "Connecticut is unusually finance-heavy: finance and insurance generate about 12.4% of state GDP, and financial services support roughly 238,203 jobs, or 13% of state employment.",
        sources: [0],
      },
      {
        text: "Insurance is the core of that cluster, employing 55,946 people directly, about 2.2% of the state's workforce, which the industry reports as the highest insurance employment concentration of any state.",
        sources: [0],
      },
      {
        text: "Alongside the large carriers, small businesses make up 99.4% of Connecticut firms and employ 726,097 people (48.1% of the workforce), concentrated in health care, accommodation and food service, manufacturing, retail, and professional and technical services.",
        sources: [1],
      },
      {
        text: "A remote studio fits this economy by building the quieter software layer around regulated finance and insurance work rather than the regulated systems themselves.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Insurance, brokerage and finance teams run on reporting; a remotely built dashboard can consolidate policy, claims or portfolio data into one current view.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Document-heavy back-office steps common to carriers and brokers, intake, triage, renewals follow-up, are a natural fit for carefully scoped automation delivered remotely.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "The state's many small professional-services firms need fast, maintainable sites and internal tools, all of which can be built and supported entirely remotely.",
      },
    ],
    sources: [
      {
        title: "Report: Financial Services Sector Faces Competitive Pressures",
        url: "https://www.cbia.com/?p=173838",
        publisher: "Connecticut Business & Industry Association (CBIA)",
        accessed: "2026-11-23",
      },
      {
        title: "Connecticut 2025 Small Business Profile",
        url: "https://advocacy.sba.gov/wp-content/uploads/2025/06/Connecticut_2025-State-Profile.pdf",
        publisher: "U.S. Small Business Administration, Office of Advocacy",
        accessed: "2026-11-23",
      },
    ],
  },

  maine: {
    angle: "A small-business and tourism economy spread across a rural state.",
    context: [
      {
        text: "Maine's economy is overwhelmingly small-business driven: 160,215 small businesses make up 99.2% of all firms and employ 290,518 people, or 54.5% of the state's workforce.",
        sources: [0],
      },
      {
        text: "Those firms cluster in health care and social assistance, accommodation and food service, retail, construction, and manufacturing, the five largest small-business employers.",
        sources: [0],
      },
      {
        text: "The Census Bureau counts 43,345 employer establishments in a state of about 1.41 million residents, so most economic activity runs through many small operators rather than a few large ones.",
        sources: [1],
      },
      {
        text: "That profile suits remote delivery: lean sites, booking and online selling can be built and maintained for owner-run businesses without any on-site presence.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Hospitality, retail and trades businesses need clear, fast sites and simple booking or quoting tools, which a remote studio can ship and maintain.",
      },
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Specialty retailers and makers can reach customers well beyond Maine with a well-built store, set up and supported remotely.",
      },
      {
        service: "Brand & growth",
        href: "/services/branding",
        text: "Small, seasonal businesses benefit from a consistent brand and a site that converts off-season traffic into bookings and orders.",
      },
    ],
    sources: [
      {
        title: "Maine 2025 Small Business Profile",
        url: "https://advocacy.sba.gov/wp-content/uploads/2025/06/Maine_2025-State-Profile.pdf",
        publisher: "U.S. Small Business Administration, Office of Advocacy",
        accessed: "2026-11-23",
      },
      {
        title: "QuickFacts: Maine",
        url: "https://www.census.gov/quickfacts/ME",
        publisher: "U.S. Census Bureau",
        accessed: "2026-11-23",
      },
    ],
  },

  massachusetts: {
    angle: "The country's second-largest life-sciences hub, anchored by research universities.",
    context: [
      {
        text: "Massachusetts anchors the US life-sciences industry: biopharma employed 113,503 people in 2025, and the state draws the highest NIH funding per capita in the nation at $477.",
        sources: [0],
      },
      {
        text: "Life sciences are roughly 6% of state GDP and 4% of employment, about three to four times the national shares, with average wages near $210,000, the highest among the leading life-science states.",
        sources: [1],
      },
      {
        text: "Research universities underpin it: Harvard ranks second nationally in life-sciences R&D, and Massachusetts-headquartered companies raised $3.45 billion in biopharma venture capital in the first half of 2026.",
        sources: [1, 0],
      },
      {
        text: "A remote studio supports this ecosystem through the software and data tooling around research and operations, never the regulated clinical or laboratory systems themselves.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Research groups, startups and service providers need internal tools, data-entry apps and credible sites, which can be built and iterated remotely.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Data-intensive teams benefit from dashboards that pull study, pipeline or operational metrics into one reviewable place.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Literature triage, document handling and reporting workflows are common in research-heavy organisations and suit scoped, remotely delivered automation.",
      },
    ],
    sources: [
      {
        title: "2026 Industry Snapshot",
        url: "https://www.massbio.org/industry-snapshot/",
        publisher: "MassBio (Massachusetts Biotechnology Council)",
        accessed: "2026-11-23",
      },
      {
        title: "Life Sciences Fact Pack 2025",
        url: "https://www.mhtc.org/wp-content/uploads/2026/02/Life-Sciences-MHTC-Factpack-2025.pdf",
        publisher: "Massachusetts High Technology Council",
        accessed: "2026-11-23",
      },
    ],
  },

  "new-hampshire": {
    angle: "A small-business base split between tourism and durable specialty manufacturing.",
    context: [
      {
        text: "Small businesses account for 99.0% of New Hampshire's firms and employ 309,420 people, just over half (50.3%) of the state's workforce.",
        sources: [0],
      },
      {
        text: "Health care and social assistance, accommodation and food service, and manufacturing are the three largest small-business employers, reflecting both the tourism economy and a durable specialty-manufacturing base.",
        sources: [0],
      },
      {
        text: "The Census Bureau counts 39,298 employer establishments in a state of about 1.42 million residents.",
        sources: [1],
      },
      {
        text: "This mix of visitor-facing and production businesses maps cleanly onto remote work: storefronts and booking for one, internal and ordering tools for the other.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Hospitality and manufacturing firms alike need maintainable sites and lightweight internal tools that a remote studio can deliver end to end.",
      },
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Manufacturers and retailers can sell directly to a national market through a store built and supported remotely.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Small producers and operators can connect quoting, orders and notifications across their existing tools without hiring in-house.",
      },
    ],
    sources: [
      {
        title: "New Hampshire 2025 Small Business Profile",
        url: "https://advocacy.sba.gov/wp-content/uploads/2025/06/New_Hampshire_2025-State-Profile.pdf",
        publisher: "U.S. Small Business Administration, Office of Advocacy",
        accessed: "2026-11-23",
      },
      {
        title: "QuickFacts: New Hampshire",
        url: "https://www.census.gov/quickfacts/NH",
        publisher: "U.S. Census Bureau",
        accessed: "2026-11-23",
      },
    ],
  },

  "new-jersey": {
    angle: "Pharma and life sciences layered on top of one of the nation's busiest logistics corridors.",
    context: [
      {
        text: "New Jersey is a pharmaceutical and life-sciences stronghold: by Choose New Jersey's account it is home to 13 of the world's top 20 pharma companies and the highest concentration of scientists and engineers per square mile in the US.",
        sources: [0],
      },
      {
        text: "It is also a logistics hub, with what the state describes as the second-largest seaport in the nation and extensive distribution operations serving the New York metro region.",
        sources: [0],
      },
      {
        text: "Beneath those large employers, small businesses span the economy, with health care, accommodation and food service, and professional, scientific and technical services as the top small-business employers.",
        sources: [1],
      },
      {
        text: "A remote studio fits best at the edges of this economy, the dashboards, sites and workflow tooling around logistics and professional-services operators.",
      },
    ],
    serviceFit: [
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "Distribution and import-reliant businesses can get help structuring supplier and logistics workflows, coordinated remotely.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Logistics and operations teams benefit from dashboards that bring order, inventory and fulfilment data into one view.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Repetitive back-office and coordination tasks common to distribution and professional-services firms suit scoped, remotely built automation.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "The state's dense base of small professional firms needs dependable sites and internal tools that can be delivered without an on-site team.",
      },
    ],
    sources: [
      {
        title: "What Are New Jersey's Major Industries?",
        url: "https://www.choosenj.com/?p=21927",
        publisher: "Choose New Jersey",
        accessed: "2026-11-23",
      },
      {
        title: "New Jersey 2025 Small Business Profile",
        url: "https://advocacy.sba.gov/wp-content/uploads/2025/06/New_Jersey_2025-State-Profile.pdf",
        publisher: "U.S. Small Business Administration, Office of Advocacy",
        accessed: "2026-11-23",
      },
    ],
  },

  "new-york": {
    angle: "A service-driven economy led by finance, professional services and media.",
    context: [
      {
        text: "New York's economy is overwhelmingly service-driven, service sectors account for 85.5% of its roughly 9.7 million jobs, and finance and insurance stand out at 5.5% of employment, with average pay above $300,000, more than double the national figure.",
        sources: [0],
      },
      {
        text: "The securities industry is heavily concentrated here: New York State had about 213,000 securities jobs in December 2024, most of them in New York City, and the industry generated roughly $19.4 billion in state tax revenue (about 19% of the total) in fiscal year 2024.",
        sources: [1],
      },
      {
        text: "Beyond finance, the state leans on professional, scientific and technical services (720,857 jobs), information and media (285,410 jobs, above the national share), and health care, its single largest sector at nearly 1.95 million jobs.",
        sources: [0],
      },
      {
        text: "A remote studio fits the long tail of this economy, the sites, internal tools and reporting that finance, media and professional-services firms need around their core platforms.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Finance, media and professional-services firms need polished sites and internal tools, which can be designed and built remotely.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Finance-adjacent teams benefit from dashboards that consolidate performance, client or portfolio reporting into one current view.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Document review, research and reporting steps that fill professional-services work suit carefully scoped automation delivered remotely.",
      },
    ],
    sources: [
      {
        title: "New York State's Economy by Industry Sector (2026)",
        url: "https://www.osc.ny.gov/files/local-government/publications/pdf/2026-industries-nys.pdf",
        publisher: "Office of the New York State Comptroller",
        accessed: "2026-11-23",
      },
      {
        title: "The Street, The City and The State 2025",
        url: "https://sifma.org/wp-content/uploads/2025/02/The-Street-The-City-The-State-2025-SIFMA.pdf",
        publisher: "SIFMA (Securities Industry and Financial Markets Association)",
        accessed: "2026-11-23",
      },
    ],
  },

  pennsylvania: {
    angle: "A broad economy led by health care and education, with deep manufacturing and logistics.",
    context: [
      {
        text: "Pennsylvania's largest employment sector is education and health services, at about 1.43 million jobs, followed by trade, transportation and utilities (1.13 million) and professional and business services (837,400).",
        sources: [0],
      },
      {
        text: "Manufacturing remains a major pillar at roughly 559,000 jobs, and transportation and warehousing employs about 351,000, a logistics base serving the Mid-Atlantic corridor.",
        sources: [0, 1],
      },
      {
        text: "Health care and social assistance alone accounts for close to a fifth of state employment, underscoring how service and care sectors now anchor the economy.",
        sources: [1],
      },
      {
        text: "A remote studio supports this spread through operational software, dashboards, sites and workflow tooling, for healthcare, manufacturing and logistics businesses.",
      },
    ],
    serviceFit: [
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "Distribution and warehousing operators can get help structuring supplier and logistics workflows, coordinated entirely remotely.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Manufacturers and care providers benefit from dashboards that pull production, scheduling or operational data into one place.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Healthcare and manufacturing firms need maintainable sites and internal tools that a remote studio can deliver and support.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Operations-heavy businesses can connect orders, scheduling and notifications across existing tools without new headcount.",
      },
    ],
    sources: [
      {
        title: "Pennsylvania Economy at a Glance",
        url: "https://www.bls.gov/eag/eag.pa.htm",
        publisher: "U.S. Bureau of Labor Statistics",
        accessed: "2026-11-23",
      },
      {
        title: "Pennsylvania Profile",
        url: "https://www.pa.gov/content/dam/copapwp-pagov/en/dli/documents/cwia/products/pa%20profile.pdf",
        publisher: "Pennsylvania Department of Labor & Industry, Center for Workforce Information & Analysis",
        accessed: "2026-11-23",
      },
    ],
  },

  "rhode-island": {
    angle: "A compact, coast-defined economy spanning marine trades, design and life sciences.",
    context: [
      {
        text: "Rhode Island's identity is built on its coast: the state promotes a $5.3 billion ocean economy along nearly 400 miles of coastline, spanning marine trades, defense and ocean sciences.",
        sources: [0],
      },
      {
        text: "It also has deep design and custom-manufacturing roots, notably jewelry and textiles, and a life-sciences base that has drawn more than $1.83 billion in NIH awards over the past decade.",
        sources: [0],
      },
      {
        text: "It is a compact market of about 1.11 million residents and 29,510 employer establishments, so most activity runs through small, locally run firms.",
        sources: [1],
      },
      {
        text: "That design-forward, small-firm profile suits remote delivery of brand, storefront and ecommerce work that reaches customers far beyond the state.",
      },
    ],
    serviceFit: [
      {
        service: "Brand & growth",
        href: "/services/branding",
        text: "A design-oriented economy rewards a strong, coherent brand and a site built to carry it, which can be delivered remotely.",
      },
      {
        service: "Creative production",
        href: "/services/creative-production",
        text: "Design, jewelry and textile makers need high-quality visuals and product content to sell credibly online.",
      },
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Makers and specialty manufacturers can reach a national market through a well-built store, set up and supported remotely.",
      },
    ],
    sources: [
      {
        title: "Leading Industries",
        url: "https://eoc.ri.gov/why-rhode-island/leading-industries",
        publisher: "Rhode Island Executive Office of Commerce",
        accessed: "2026-11-23",
      },
      {
        title: "QuickFacts: Rhode Island",
        url: "https://www.census.gov/quickfacts/RI",
        publisher: "U.S. Census Bureau",
        accessed: "2026-11-23",
      },
    ],
  },

  vermont: {
    angle: "One of the most small-business-dependent economies in the country.",
    context: [
      {
        text: "Vermont leans heavily on small firms: they make up 99.0% of all businesses and employ 157,959 people, 62.1% of the state's workforce, among the highest small-business employment shares in the nation.",
        sources: [0],
      },
      {
        text: "Health care, accommodation and food service, retail, manufacturing and construction lead small-business employment, a mix reflecting the state's tourism draw and its specialty-manufacturing and food producers.",
        sources: [0],
      },
      {
        text: "It is a small market overall, about 648,000 residents and roughly 20,868 employer establishments, so nearly all businesses are owner-scale operators.",
        sources: [1],
      },
      {
        text: "That profile is well suited to remote delivery of sites, online stores and automation for producers who sell well beyond Vermont.",
      },
    ],
    serviceFit: [
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Specialty food and goods producers can reach a national audience through a store built and maintained remotely.",
      },
      {
        service: "Brand & growth",
        href: "/services/branding",
        text: "Small producers benefit from a distinctive brand and a site that turns interest into orders year-round.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Owner-run businesses need clear, maintainable sites and simple internal tools a remote studio can deliver end to end.",
      },
    ],
    sources: [
      {
        title: "Vermont 2025 Small Business Profile",
        url: "https://advocacy.sba.gov/wp-content/uploads/2025/06/Vermont_2025-State-Profile.pdf",
        publisher: "U.S. Small Business Administration, Office of Advocacy",
        accessed: "2026-11-23",
      },
      {
        title: "QuickFacts: Vermont",
        url: "https://www.census.gov/quickfacts/VT",
        publisher: "U.S. Census Bureau",
        accessed: "2026-11-23",
      },
    ],
  },
};
