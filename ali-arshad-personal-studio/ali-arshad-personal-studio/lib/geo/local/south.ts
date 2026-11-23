/**
 * SOUTH state local content. Real, cited, remote-framed. Filled by research.
 * Keys are state slugs (see lib/geo/states.ts). Omit a state until it has a
 * genuine local signal and at least one real source; never fabricate.
 */
import type { StateLocalContent } from "@/lib/geo/local-content-types";

export const SOUTH_LOCAL: Record<string, StateLocalContent> = {
  alabama: {
    angle:
      "A manufacturing state, autos in the centre and south, aerospace and defence in the north, where remote software can modernise supplier and plant operations.",
    context: [
      {
        text: "Alabama ranks among the top five US states for auto production, with Mercedes-Benz, Honda, Hyundai and the Mazda-Toyota joint venture together assembling roughly a million vehicles a year, a sector that employs about 54,000 people.",
        sources: [0],
      },
      {
        text: "Aerospace and defence form the state's other industrial pillar, supporting an estimated 72,274 jobs across 127 facilities and some $35 billion in annual economic output.",
        sources: [1],
      },
      {
        text: "For the tier-one and tier-two suppliers that sit under these OEMs and primes, an independent remote studio can build the internal tools, dashboards and automations that keep production, quoting and compliance moving, delivered online from outside the US, with no local office implied.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Manufacturing suppliers often run production, inventory and quality data across disconnected spreadsheets; a custom dashboard gives plant and supply-chain managers a single, live view.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Supplier quoting, RFQ handling and compliance paperwork are repetitive and error-prone, and agents can draft, route and track them to free up engineering time.",
      },
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "Automotive and aerospace tiers depend on multi-country component flows, and remote tooling can track suppliers, lead times and landed cost in one place.",
      },
    ],
    sources: [
      {
        title: "Automotive",
        url: "https://www.madeinalabama.com/industries/industry/automotive/",
        publisher: "Alabama Department of Commerce (Made in Alabama)",
        accessed: "2026-11-23",
      },
      {
        title: "Aerospace & Defense Industry: Alabama State Data",
        url: "https://www.aia-aerospace.org/industry-impact/state-data/alabama/",
        publisher: "Aerospace Industries Association",
        accessed: "2026-11-23",
      },
    ],
  },

  arkansas: {
    angle:
      "Headquarters state for Walmart, Tyson and J.B. Hunt, a retail, food-processing and logistics economy where remote systems work keeps distribution moving.",
    context: [
      {
        text: "Seven of the world's ten largest food and beverage companies have Arkansas plants, Tyson Foods is headquartered in Springdale, and the state hosts more than 6,800 transportation, logistics and distribution companies, including Fortune 500 carrier J.B. Hunt.",
        sources: [0],
      },
      {
        text: "Aerospace and defence is the state's leading export by revenue across more than 150 facilities, and Mississippi County is described as the nation's largest steel-producing county.",
        sources: [0],
      },
      {
        text: "The consumer-brand and distribution businesses that orbit these giants rarely need a bespoke ERP, but they do need storefronts and back-office automation that scale; a remote studio can build and run those online for firms that sell nationally.",
      },
    ],
    serviceFit: [
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Food, retail and consumer-goods suppliers increasingly sell direct, and a fast, well-structured store with clean catalogue and fulfilment integrations is often the gap.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Distribution and logistics operators juggle orders, carriers and inventory across systems, and workflow automation stitches those steps together without manual re-keying.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Shippers and food processors sit on operational data they cannot see clearly; a dashboard turns order, route and throughput data into decisions.",
      },
    ],
    sources: [
      {
        title: "Key Industries",
        url: "https://www.arkansasedc.com/why-arkansas/key-industries",
        publisher: "Arkansas Economic Development Commission",
        accessed: "2026-11-23",
      },
    ],
  },

  delaware: {
    angle:
      "The incorporation capital of America, home to two-thirds of the Fortune 500 on paper, layered over a chemicals and financial-services legacy.",
    context: [
      {
        text: "Delaware is the legal home of American business: 66.7% of Fortune 500 companies are incorporated there, 81.4% of US-based IPOs in 2024 chose it, and more than 2.1 million active business entities sat on its register at the end of 2024.",
        sources: [0],
      },
      {
        text: "Beyond the corporate registry, the state's working economy rests on business and financial services, a long chemicals legacy and advanced manufacturing and logistics.",
        sources: [1],
      },
      {
        text: "The sheer volume of entities formed here, holding companies, startups and fund vehicles, means a steady stream of small, newly-incorporated businesses that need a credible web presence and financial tooling, which a remote studio can deliver without any physical footprint.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "New entities and holding companies need professional sites and light internal apps quickly, and remote build-and-ship work fits that pace without local overhead.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Financial-services and fund operations live and die by reporting, and a tailored dashboard consolidates positions, fees and KPIs into one view.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Filing calendars, document assembly and routine compliance checks are well-suited to agents that draft and track them under human review.",
      },
    ],
    sources: [
      {
        title: "Division of Corporations 2024 Annual Report",
        url: "https://corp.delaware.gov/stats/2024-annual-report/",
        publisher: "Delaware Division of Corporations",
        accessed: "2026-11-23",
      },
      {
        title: "Key Industries",
        url: "https://www.choosedelaware.com/key-industries/",
        publisher: "Delaware Prosperity Partnership (Choose Delaware)",
        accessed: "2026-11-23",
      },
    ],
  },

  florida: {
    angle:
      "A tourism and trade economy, record visitor numbers and the US gateway to Latin America, full of consumer-facing and export-oriented small businesses.",
    context: [
      {
        text: "Florida drew a record 142.9 million visitors in 2024, the highest annual visitation in its history.",
        sources: [0],
      },
      {
        text: "It is equally a trade gateway, moving about $205 billion in two-way merchandise trade through 16 deepwater seaports and 21 commercial airports, home to more than 55,000 exporting companies, 94% of them small or mid-sized, and accounting for nearly a third of all US trade with Latin America and the Caribbean (excluding Mexico).",
        sources: [1],
      },
      {
        text: "That mix, hospitality brands selling to visitors and thousands of small exporters selling abroad, is exactly where remote ecommerce, content and sourcing work pays off, and none of it requires a presence in the state.",
      },
    ],
    serviceFit: [
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Tourism and consumer brands need storefronts that convert and handle seasonal spikes, and a well-built store with solid payments and fulfilment is often the difference.",
      },
      {
        service: "Creative production",
        href: "/services/creative-production",
        text: "Hospitality and destination businesses compete on imagery and storytelling, and remote creative production supplies the photography-grade visuals and video they run on.",
      },
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "With tens of thousands of small exporters and importers, firms need help managing suppliers and landed cost, which remote tooling and sourcing support can provide.",
      },
    ],
    sources: [
      {
        title:
          "Record Broken Again: Florida Announces Highest Tourism Numbers in State History in 2024",
        url: "https://www.flgov.com/eog/news/press/2025/record-broken-again-florida-announces-highest-tourism-numbers-state-history-2024",
        publisher: "Executive Office of the Governor of Florida",
        accessed: "2026-11-23",
      },
      {
        title: "Florida International Business Fast Facts",
        url: "https://selectflorida.org/international-business-fast-facts",
        publisher: "SelectFlorida",
        accessed: "2026-11-23",
      },
    ],
  },

  georgia: {
    angle:
      "The Southeast's logistics and film hub, with a fast-growing fintech cluster around Atlanta and a large agribusiness base.",
    context: [
      {
        text: "Aerospace is Georgia's number-one export, and the state positions itself as a Southeastern logistics hub of ports, rail and warehousing.",
        sources: [0],
      },
      {
        text: "Its technology sector includes more than 260 fintech companies, film has an established production base with experienced crews and incentives, and agribusiness spans 9.9 million acres of farmland and over 1,000 food-processing facilities.",
        sources: [0],
      },
      {
        text: "A fintech cluster plus a creative economy is a natural fit for remote software and production work: payment-adjacent firms need robust internal tooling, and media-heavy businesses need a steady supply of produced assets.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Logistics operators and fintechs generate dense transactional data, and a purpose-built dashboard surfaces throughput, exceptions and unit economics in real time.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Payments and back-office processes carry heavy repetitive workflows, reconciliation, onboarding, support triage, that agents can handle under human oversight.",
      },
      {
        service: "Creative production",
        href: "/services/creative-production",
        text: "A film-and-media economy runs on content, and remote creative production can supply video and visual assets to brands and studios on demand.",
      },
    ],
    sources: [
      {
        title: "Industries",
        url: "https://georgia.org/industries",
        publisher: "Georgia Department of Economic Development",
        accessed: "2026-11-23",
      },
    ],
  },

  kentucky: {
    angle:
      "An automotive, logistics and spirits state where aerospace products are, perhaps surprisingly, the top export.",
    context: [
      {
        text: "Kentucky's economy centres on automotive manufacturing, it has built cars since the Model T was first produced there in 1913, alongside distribution and logistics, primary metals, chemicals and food and beverage, which includes its signature bourbon.",
        sources: [0],
      },
      {
        text: "Aerospace products are the state's single top export.",
        sources: [0],
      },
      {
        text: "Manufacturing plants and distribution operations of this scale run on scheduling, inventory and order data that is often trapped in legacy systems; a remote studio can layer modern dashboards and automation over them without touching the plant floor.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Auto plants and distribution centres need live visibility into throughput, stock and SLAs, and a tailored dashboard consolidates that from existing systems.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Distribution and logistics flows involve many handoffs between tools, and workflow automation removes the manual re-entry between them.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Consumer and B2B producers often need internal apps or customer portals that off-the-shelf software cannot cover, built and maintained remotely.",
      },
    ],
    sources: [
      {
        title: "Existing Industries: Major Industries",
        url: "https://newkentuckyhome.ky.gov/Existing_Industries/Major_Industries",
        publisher: "Kentucky Cabinet for Economic Development",
        accessed: "2026-11-23",
      },
    ],
  },

  louisiana: {
    angle:
      "An energy and petrochemical economy on the Mississippi River, with a billion-dollar film and digital-media sector alongside it.",
    context: [
      {
        text: "Louisiana's economy is anchored in energy and in process industries, nearly 500 petrochemical facilities that turn raw materials into feedstocks for manufacturing.",
        sources: [0],
      },
      {
        text: "Agribusiness covers roughly 30,000 farms across about 8 million acres, military-related spending has nearly $10 billion in annual economic impact, and film, digital media and live performance form a billion-dollar entertainment industry.",
        sources: [0],
      },
      {
        text: "Heavy-industry operators need operational reporting and back-office automation, while the entertainment sector needs produced content, both deliverable remotely to firms that would never staff a software team in-house.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Energy and petrochemical operations generate large volumes of process and safety data, and a dashboard makes it legible to managers and compliance teams.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Industrial back-office tasks, procurement, document handling, reporting, are repetitive and rules-based, which suits agents working under human review.",
      },
      {
        service: "Creative production",
        href: "/services/creative-production",
        text: "A billion-dollar film and digital-media sector needs produced visual and video assets, which remote creative production can supply at volume.",
      },
    ],
    sources: [
      {
        title: "Key Industries",
        url: "https://www.opportunitylouisiana.gov/key-industries",
        publisher: "Louisiana Economic Development",
        accessed: "2026-11-23",
      },
    ],
  },

  maryland: {
    angle:
      "A science-and-security economy, life sciences, cybersecurity and aerospace, shaped by proximity to federal research agencies.",
    context: [
      {
        text: "Maryland's economy is built on science and technology: life sciences anchored by major federal research institutions, cybersecurity and IT, aerospace and aviation, and emerging strengths in quantum computing and artificial intelligence.",
        sources: [0],
      },
      {
        text: "Alongside these it lists advanced manufacturing, food and agribusiness, and distribution, warehousing and logistics with next-day access to a large consumer market.",
        sources: [0],
      },
      {
        text: "Research-driven and data-heavy organisations need internal software and reporting more than most, and a remote studio can build those tools for private-sector firms in this ecosystem without implying any federal or on-site work.",
      },
    ],
    serviceFit: [
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Life-sciences and IT firms carry heavy document, intake and research-ops workloads that agents can accelerate while keeping a human in the loop.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Research and tech organisations collect far more data than they can read; a custom dashboard turns study, pipeline or operations data into decisions.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Specialised firms frequently need internal apps and portals that no off-the-shelf product covers, built and maintained remotely.",
      },
    ],
    sources: [
      {
        title: "Industries",
        url: "https://business.maryland.gov/industries",
        publisher: "Maryland Department of Commerce",
        accessed: "2026-11-23",
      },
    ],
  },

  mississippi: {
    angle:
      "A manufacturing and agriculture state, furniture, auto parts, poultry and catfish, with Gulf-coast shipbuilding and NASA rocket testing.",
    context: [
      {
        text: "Manufacturing is one of Mississippi's largest sectors, producing upholstered furniture, automotive parts, lumber and wood products and processed foods, with a major shipbuilding operation at Pascagoula.",
        sources: [0],
      },
      {
        text: "Agriculture leans on livestock, poultry and catfish aquaculture, the state is a leading producer of broiler chickens, while NASA's John C. Stennis Space Center is one of the country's primary rocket-testing facilities.",
        sources: [0],
      },
      {
        text: "Furniture and food producers here increasingly sell beyond their region, and a remote studio can give them the storefronts, supply-chain tooling and internal software to compete nationally.",
      },
    ],
    serviceFit: [
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Furniture and consumer-goods makers moving into direct sales need stores that handle large catalogues, freight shipping and configurable products.",
      },
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "Manufacturers depend on reliable component and material flows, and remote tooling can track suppliers, lead times and cost in one place.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Producers often need internal apps or B2B portals tailored to how they actually operate, built and run remotely.",
      },
    ],
    sources: [
      {
        title: "Mississippi: Economy",
        url: "https://www.britannica.com/place/Mississippi-state/Economy",
        publisher: "Encyclopaedia Britannica",
        accessed: "2026-11-23",
      },
    ],
  },

  "north-carolina": {
    angle:
      "Biotech in the Research Triangle, banking in Charlotte, a research-and-finance economy with deep textiles and IT strength.",
    context: [
      {
        text: "North Carolina pairs a biotechnology and pharmaceuticals cluster, home to the largest research park in the US and firms such as Novo Nordisk, Merck and FUJIFILM Diosynth, with the nation's third-largest financial centre, anchored by Bank of America and Wells Fargo.",
        sources: [0],
      },
      {
        text: "It also hosts aerospace and defence (HondaJet, GE Aviation), the second-fastest-growing IT industry in the country, and the largest textile-mill industry in the US.",
        sources: [0],
      },
      {
        text: "Finance, life sciences and IT all run on custom internal software and reporting, and the state's consumer and textile brands are prime ecommerce candidates, all of which a remote studio can serve.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Research, fintech and B2B firms regularly need internal apps and customer portals beyond what packaged software offers, built and maintained remotely.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Financial-services and biotech operations are data-dense, and a tailored dashboard consolidates pipeline, portfolio or study metrics into one view.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Finance and research back-offices carry repetitive document and reconciliation work that agents can handle under human review.",
      },
    ],
    sources: [
      {
        title: "Key Industries in North Carolina",
        url: "https://www.commerce.nc.gov/business/key-industries-north-carolina",
        publisher: "North Carolina Department of Commerce",
        accessed: "2026-11-23",
      },
    ],
  },

  oklahoma: {
    angle:
      "The self-styled aerospace MRO capital of the world and a century-old energy state now adding large data centres.",
    context: [
      {
        text: "Oklahoma brands itself the maintenance, repair and overhaul (MRO) capital of the world, home to the largest Department of Defense MRO facility and the largest commercial-airline MRO, alongside more than a century of traditional energy production.",
        sources: [0],
      },
      {
        text: "Agribusiness ranks the state first nationally in rye and fifth in beef, and its IT and data-centre base includes what the state describes as Google's second-largest data centre.",
        sources: [0],
      },
      {
        text: "MRO and energy operations hinge on scheduling, parts and compliance data, which a remote studio can bring together in dashboards and automations without ever setting foot on site.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "MRO and energy operators need visibility into schedules, parts inventory and work orders, and a dashboard consolidates that from existing systems.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Maintenance planning, parts ordering and compliance paperwork are rules-heavy and repetitive, which agents can draft and track under supervision.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Field, shop and back-office systems rarely talk to each other, and workflow automation removes the manual handoffs between them.",
      },
    ],
    sources: [
      {
        title: "Industry Sectors",
        url: "https://www.okcommerce.gov/doing-business/business-relocation-expansion/industry-sectors/",
        publisher: "Oklahoma Department of Commerce",
        accessed: "2026-11-23",
      },
    ],
  },

  "south-carolina": {
    angle:
      "An export-manufacturing state, BMW, Mercedes vans and tires, that leads the US in finished-vehicle and tire exports.",
    context: [
      {
        text: "South Carolina's automotive industry has an economic impact of more than $27 billion; BMW has built cars in the Upstate since 1994, and Mercedes-Benz produces its eSprinter van near Charleston.",
        sources: [0],
      },
      {
        text: "The state leads the US in completed passenger-vehicle exports and ranks first in tire production and exports, accounting for nearly a third of the national market.",
        sources: [0],
      },
      {
        text: "An export-heavy manufacturing base needs tight supply-chain and operations tooling, and a remote studio can build the dashboards and automations that keep multi-country parts and shipping flows legible.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Auto and tire plants run on production, quality and export data that a tailored dashboard can bring into one live view for managers.",
      },
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "Export manufacturers depend on inbound components and outbound logistics across borders, which remote tooling can track end to end.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Export documentation, supplier quoting and compliance checks are repetitive and rules-based, well-suited to agents under human review.",
      },
    ],
    sources: [
      {
        title: "Automotive Industry",
        url: "https://www.sccommerce.com/automotive-industry",
        publisher: "South Carolina Department of Commerce",
        accessed: "2026-11-23",
      },
    ],
  },

  tennessee: {
    angle:
      "A logistics, automotive and healthcare powerhouse, and the country's number-one state for music-industry jobs.",
    context: [
      {
        text: "Tennessee ranks second in the US for distribution and logistics employment, served by the busiest cargo airport in the Western Hemisphere, and first in the Southeast for automotive and EV-manufacturing jobs across four vehicle OEMs.",
        sources: [0],
      },
      {
        text: "It ranks first in the Southeast for medical-equipment and supplies exports, more than $4.5 billion in 2024, and first nationally for music-industry employment.",
        sources: [0],
      },
      {
        text: "Logistics and healthcare both run on data and repeatable workflows, while the music and entertainment sector runs on content, a spread that maps cleanly onto remote dashboards, automation and production.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Distribution and healthcare operations generate dense operational data, and a purpose-built dashboard surfaces throughput, exceptions and KPIs in real time.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Logistics flows involve many systems and handoffs, and workflow automation removes the manual re-entry between orders, carriers and inventory.",
      },
      {
        service: "Creative production",
        href: "/services/creative-production",
        text: "A number-one music economy and growing film base need produced audio-visual and brand content, which remote creative production can supply.",
      },
    ],
    sources: [
      {
        title: "Industries",
        url: "https://tnecd.com/industries/",
        publisher: "Tennessee Department of Economic and Community Development",
        accessed: "2026-11-23",
      },
    ],
  },

  texas: {
    angle:
      "The US energy leader, with vast advanced-manufacturing, technology and logistics corridors across its metros.",
    context: [
      {
        text: "Texas is the leading US producer of oil, gas, wind and utility-scale solar energy.",
        sources: [0],
      },
      {
        text: "Its target economy spans advanced manufacturing, aerospace, automotive, semiconductors and heavy machinery, information technology and AI, petroleum refining and chemicals, life sciences, and transportation and logistics.",
        sources: [0],
      },
      {
        text: "The breadth is the point: energy and industrial operators need operational tooling, tech and manufacturing firms need custom software, and the state's enormous base of traders and shippers needs supply-chain visibility, all deliverable remotely.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Tech, energy and manufacturing firms routinely need custom internal apps and customer portals that packaged software cannot cover, built and maintained remotely.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Energy and industrial operations are data-rich, and a tailored dashboard turns production, logistics and cost data into operational decisions.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Large back-offices in refining, logistics and services carry repetitive document and reporting work that agents can accelerate under human oversight.",
      },
      {
        service: "Global sourcing & supply chain",
        href: "/services/global-sourcing",
        text: "With major ports and trade corridors, firms need to manage cross-border suppliers and landed cost, which remote tooling and sourcing support can provide.",
      },
    ],
    sources: [
      {
        title: "Target Industries",
        url: "https://gov.texas.gov/business/page/target-industries",
        publisher:
          "Office of the Texas Governor, Economic Development & Tourism",
        accessed: "2026-11-23",
      },
    ],
  },

  virginia: {
    angle:
      "A cloud, AI-infrastructure and aerospace/defence economy, a tech-and-security base with deep data-centre capacity.",
    context: [
      {
        text: "Virginia's key industries include cloud and AI infrastructure, aerospace and defence, with the ability to research, test and launch in one place, and tech and cyber.",
        sources: [0],
      },
      {
        text: "They also span supply-chain management backed by port infrastructure, an energy supply chain tied to offshore wind, life sciences, and advanced-materials and food-and-beverage manufacturing.",
        sources: [0],
      },
      {
        text: "A cloud-and-cyber economy is unusually ready for AI-driven tooling, and its supply-chain and manufacturing firms need the dashboards and automation a remote studio can build for the private sector.",
      },
    ],
    serviceFit: [
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "A tech- and data-led economy is well-placed to adopt agents for document handling, support and operations, kept under human review.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Supply-chain and infrastructure operators need live visibility into flows and capacity, which a tailored dashboard consolidates from existing systems.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Tech and logistics operations chain many tools together, and workflow automation removes the manual steps between them.",
      },
    ],
    sources: [
      {
        title: "Key Industries",
        url: "https://vedp.org/key-industries",
        publisher: "Virginia Economic Development Partnership",
        accessed: "2026-11-23",
      },
    ],
  },

  "west-virginia": {
    angle:
      "An energy and chemicals/polymers state leaning into data centres and federal-facing IT.",
    context: [
      {
        text: "West Virginia's economy rests on a strong energy profile and on chemicals and polymers, with companies drawing on existing industrial parks and abundant natural-gas supplies.",
        sources: [0],
      },
      {
        text: "The state also courts aerospace parts and aircraft maintenance, automotive component makers, metals, and a growing technology and data-centre base pitched partly at federal agencies.",
        sources: [0],
      },
      {
        text: "Industrial and energy operators here need operational reporting and automation more than bespoke platforms, and a remote studio can deliver that software online for private firms without any on-site role.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Energy and chemicals operations generate large volumes of process data, and a dashboard makes it legible to managers and compliance teams.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Industrial and services firms often need internal apps or portals tailored to their operations, built and maintained remotely.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Procurement, reporting and document handling are repetitive and rules-based, which suits agents working under human review.",
      },
    ],
    sources: [
      {
        title: "Thriving Industries",
        url: "https://westvirginia.gov/thriving-industries",
        publisher: "West Virginia Division of Economic Development",
        accessed: "2026-11-23",
      },
    ],
  },

  "washington-d-c": {
    angle:
      "A federal-driven economy of professional services, international institutions and nearly nineteen million annual tourists.",
    context: [
      {
        text: "The federal government accounts for roughly a quarter of District employment, and federal procurement, $33.8 billion in FY2023, flows overwhelmingly to professional and business services, which took 79.5% of that spending.",
        sources: [0],
      },
      {
        text: "The District's own target sectors include technology and innovation, hospitality and tourism (18.8 million tourists), international business, more than 180 embassies and foreign missions plus the World Bank and IMF, and higher education and healthcare.",
        sources: [1],
      },
      {
        text: "A professional-services and knowledge economy spends heavily on software, reporting and automation, and a remote studio can serve its private firms, nonprofits and associations without implying any public-sector or in-person work.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Associations, nonprofits and professional-services firms need internal apps, member portals and sites that packaged tools cannot fully cover, built remotely.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Professional and business services run on document-heavy, repeatable processes that agents can draft and route under human review.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Research, policy and services organisations collect more data than they can read, and a tailored dashboard turns it into decisions.",
      },
    ],
    sources: [
      {
        title: "The Importance of Federal Contracting to the District's Economy",
        url: "https://ora-cfo.dc.gov/blog/importance-federal-contracting-districts-economy",
        publisher: "DC Office of Revenue Analysis (Office of the Chief Financial Officer)",
        accessed: "2026-11-23",
      },
      {
        title: "Sectors",
        url: "https://dmped.dc.gov/page/sectors",
        publisher:
          "DC Office of the Deputy Mayor for Planning and Economic Development",
        accessed: "2026-11-23",
      },
    ],
  },
};
