/**
 * MIDWEST state local content. Real, cited, remote-framed. Filled by research.
 * Keys are state slugs (see lib/geo/states.ts). Omit a state until it has a
 * genuine local signal and at least one real source; never fabricate.
 */
import type { StateLocalContent } from "@/lib/geo/local-content-types";

export const MIDWEST_LOCAL: Record<string, StateLocalContent> = {
  illinois: {
    angle:
      "A Chicago-anchored, export-heavy economy where professional services, logistics and farm commodities all run on data.",
    context: [
      {
        text: "Illinois was the fifth-largest state exporter of goods in 2025, shipping $80.2 billion, with chemicals ($15.5 billion), non-electrical machinery ($12.5 billion) and computer and electronic products ($11.0 billion) as the top categories.",
        sources: [0],
      },
      {
        text: "It was also the third-largest agricultural exporting state in 2024 at $11.1 billion, ranking first in soybean exports ($4.0 billion) and second in corn ($2.1 billion).",
        sources: [0],
      },
      {
        text: "The state's real GDP reached $913.7 billion in 2025, led by professional and business services ($141 billion), ahead of real estate and manufacturing ($106.4 billion).",
        sources: [1],
      },
      {
        text: "That mix of finance, distribution and commodity trade produces a lot of operational data, which is exactly the kind of work a remote studio can support without a local office.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "The professional-services and logistics firms concentrated around Chicago run on custom internal web applications, which I build and modernize remotely for US clients.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Distributors and B2B operators that track commodities and shipments in spreadsheets can get live dashboards instead, delivered entirely online.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Repetitive back-office steps in finance, insurance and logistics are good candidates for AI-assisted automation scoped and shipped remotely.",
      },
    ],
    sources: [
      {
        title: "Illinois: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/illinois",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "Illinois economy and GDP",
        url: "https://usafacts.org/topics/economy/state/illinois",
        publisher: "USAFacts",
        accessed: "2026-11-23",
      },
    ],
  },

  indiana: {
    angle:
      "The most manufacturing-intensive economy in the Midwest, led by chemicals and pharmaceuticals.",
    context: [
      {
        text: "Manufacturing made up 27.3% of Indiana's GDP in the second quarter of 2025, far above the 10.1% national share, making it the most manufacturing-dependent large economy in the region.",
        sources: [1],
      },
      {
        text: "Indiana led the nation in pharmaceutical and medicine manufacturing exports, at $22.4 billion in 2024.",
        sources: [1],
      },
      {
        text: "The state exported a record $68.6 billion of goods in 2025, ranking seventh, with chemicals ($33.3 billion) its largest export category ahead of transportation equipment ($12.8 billion).",
        sources: [0],
      },
      {
        text: "A base that heavy in production and life sciences runs on scheduling, quality and supply data a remote studio can help make legible.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Plant and quality teams drowning in production spreadsheets can get consolidated operations dashboards built and maintained remotely.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Connecting ERP, logistics and supplier systems with n8n flows removes manual re-keying for manufacturers without adding headcount.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Pharma and industrial suppliers often need internal portals and B2B tools, which I design and ship entirely online.",
      },
    ],
    sources: [
      {
        title: "Indiana: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/indiana",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "Indiana's outlook for 2026",
        url: "https://www.ibrc.indiana.edu/ibr/pre/outlook/indiana.html",
        publisher: "Indiana Business Research Center, Indiana University Kelley School of Business",
        accessed: "2026-11-23",
      },
    ],
  },

  iowa: {
    angle:
      "A corn, soybean and pork powerhouse whose economy is built on agriculture and food processing.",
    context: [
      {
        text: "Iowa was the second-largest agricultural exporting state in 2024 at $13.7 billion, ranking first nationally in both pork ($2.9 billion) and corn ($2.4 billion) and second in soybeans ($3.5 billion).",
        sources: [0],
      },
      {
        text: "Food and kindred products ($3.5 billion) and machinery ($3.3 billion) led the state's $16.3 billion in total goods exports in 2025.",
        sources: [0],
      },
      {
        text: "USDA figures value the 2025 corn crop at roughly $11.4 billion and soybeans at about $6.1 billion, underscoring how much of the state's activity flows from the field.",
        sources: [1],
      },
      {
        text: "Farm operations, grain handlers and processors generate steady operational and commodity data that a remote studio can turn into usable tools.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Co-ops, processors and ag businesses tracking yields, inventory and commodity prices can get live dashboards built and updated remotely.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Syncing orders, logistics and grain or livestock records across systems with n8n cuts manual data entry for distributed operations.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Agribusiness and insurance firms needing internal applications and customer portals can have them designed and delivered online.",
      },
    ],
    sources: [
      {
        title: "Iowa: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/iowa",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "2025 State Agriculture Overview: Iowa",
        url: "https://www.nass.usda.gov/Quick_Stats/Ag_Overview/stateOverview.php?state=IOWA",
        publisher: "USDA National Agricultural Statistics Service",
        accessed: "2026-11-23",
      },
    ],
  },

  kansas: {
    angle:
      "The Air Capital of the World, where aerospace manufacturing sits alongside wheat and beef.",
    context: [
      {
        text: "Aerospace contributes about $7 billion to Kansas GDP and $2.3 billion in annual exports, nearly 20% of the state's total, and Kansas ranks third nationally in concentration of aviation workers.",
        sources: [0],
      },
      {
        text: "Wichita, long known as the Air Capital of the World, is home to roughly a third of the general-aviation aircraft built in the United States.",
        sources: [0],
      },
      {
        text: "Transportation equipment ($3.8 billion) led the state's record $14.6 billion in goods exports in 2025, while Kansas ranked second nationally in both beef and veal ($1.4 billion) and wheat ($838 million) exports in 2024.",
        sources: [1],
      },
      {
        text: "Precision manufacturing and large-scale agriculture both lean on data and process tooling that a remote studio can deliver.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Aerospace suppliers and ag operations tracking production, quality and supply chains can get consolidated dashboards built remotely.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Manufacturers and distributors needing internal tools or supplier portals can have them designed and shipped online.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Document-heavy processes common in aerospace and insurance are strong candidates for AI-assisted automation scoped remotely.",
      },
    ],
    sources: [
      {
        title: "Aerospace",
        url: "https://www.kansascommerce.gov/industry/aerospace",
        publisher: "Kansas Department of Commerce",
        accessed: "2026-11-23",
      },
      {
        title: "Kansas: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/kansas",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
    ],
  },

  michigan: {
    angle:
      "The heart of US automotive and mobility, where transportation equipment drives both output and exports.",
    context: [
      {
        text: "Manufacturing was Michigan's largest industry by GDP contribution in 2025 at $100.1 billion, within a total real GDP of $568.9 billion.",
        sources: [1],
      },
      {
        text: "The state exported $60.3 billion of goods in 2025, ranking ninth, with transportation equipment the single largest category at $25.2 billion.",
        sources: [0],
      },
      {
        text: "Some 13,631 companies exported from Michigan in 2024, and about 88% of them were small or medium-sized enterprises.",
        sources: [0],
      },
      {
        text: "A supplier economy that deep depends on throughput, quality and logistics data that a remote studio can help organize and automate.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Tier suppliers and plants tracking throughput, downtime and quality can get live operations dashboards built and maintained remotely.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Quoting, RFQ handling and order processing in the supplier base are strong candidates for AI-assisted automation scoped online.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Connecting ERP, EDI and supplier systems with n8n flows reduces manual re-keying across the many small firms in the supply chain.",
      },
    ],
    sources: [
      {
        title: "Michigan: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/michigan",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "Michigan economy and GDP",
        url: "https://usafacts.org/topics/economy/state/michigan/",
        publisher: "USAFacts",
        accessed: "2026-11-23",
      },
    ],
  },

  minnesota: {
    angle:
      "Medical Alley plus unusual Fortune 500 density: a diversified economy strong in medtech, retail and food.",
    context: [
      {
        text: "Minnesota's life sciences sector spans 7,750 establishments contributing $51.6 billion in GDP and 334,500 jobs, and the state ranks second nationally in medical device manufacturing.",
        sources: [0],
      },
      {
        text: "The broader economy totals $446 billion in GDP with a labor force of 3.1 million, and the state is home to major headquarters including 3M, General Mills, U.S. Bancorp, Target and Best Buy.",
        sources: [1],
      },
      {
        text: "Cargill, headquartered in the state, is the largest privately held company in the country.",
        sources: [1],
      },
      {
        text: "Health-IT, retail and food operations here generate dense data and digital-product needs a remote studio can support.",
      },
    ],
    serviceFit: [
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Medtech and health-IT firms often need internal tools and customer-facing applications, which I build and ship entirely online.",
      },
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Retail and consumer-goods teams tracking sales, inventory and operations can get live dashboards delivered remotely.",
      },
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Consumer and retail brands expanding online storefronts can have them designed and built without any in-person engagement.",
      },
    ],
    sources: [
      {
        title: "Leading Life Sciences",
        url: "https://mn.gov/deed/dobusiness/key-industries/leading-life-sciences/",
        publisher: "Minnesota Department of Employment and Economic Development",
        accessed: "2026-11-23",
      },
      {
        title: "A Robust & Diverse Economy",
        url: "https://mn.gov/deed/dobusiness/why-mn/our-economy/index.jsp",
        publisher: "Minnesota Department of Employment and Economic Development",
        accessed: "2026-11-23",
      },
    ],
  },

  missouri: {
    angle:
      "A central logistics crossroads with manufacturing, agriculture and a notable financial-services cluster.",
    context: [
      {
        text: "Missouri set a record $19.6 billion in goods exports in 2025, led by transportation equipment ($5.7 billion), chemicals ($3.7 billion) and food and kindred products ($1.4 billion).",
        sources: [0],
      },
      {
        text: "It was the tenth-largest agricultural exporting state in 2024 at $5.1 billion, including $1.5 billion in soybeans.",
        sources: [0],
      },
      {
        text: "Manufacturing is close to 13% of the state's $389.9 billion economy, and the largest Fortune 500 companies headquartered there are Centene, Reinsurance Group of America and Emerson Electric, with transportation and logistics and financial and professional services among the state's named target industries.",
        sources: [1],
      },
      {
        text: "Distribution, manufacturing and insurance operations across the state generate workflows and data a remote studio can help streamline.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Logistics, warehousing and distribution operators can get live KPI dashboards for throughput and inventory, built and maintained remotely.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Order, shipment and systems integration across logistics and B2B operations can be automated with n8n without new headcount.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Financial-services and manufacturing firms needing internal applications and portals can have them designed and delivered online.",
      },
    ],
    sources: [
      {
        title: "Missouri: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/missouri",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "Industry Research",
        url: "https://meric.mo.gov/industry-research",
        publisher: "Missouri Economic Research and Information Center",
        accessed: "2026-11-23",
      },
    ],
  },

  nebraska: {
    angle:
      "A cattle, corn and ethanol economy where agriculture touches roughly one in four jobs.",
    context: [
      {
        text: "Nebraska ranked first nationally in beef and veal exports in 2024 and second in both cattle inventory and ethanol production, producing 2.345 billion gallons of ethanol.",
        sources: [1],
      },
      {
        text: "Agriculture accounts for about one in four jobs in the state, and 2023 cash receipts from farm commodities reached $31.26 billion, third nationally and 6.0% of the US total.",
        sources: [1],
      },
      {
        text: "Food and kindred products ($3.0 billion) was the largest category within Nebraska's $7.8 billion of goods exports in 2025.",
        sources: [0],
      },
      {
        text: "Livestock, grain and processing operations run on scheduling, inventory and commodity data a remote studio can help structure.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Feedlots, processors and ag businesses tracking herds, plant output and commodity prices can get live dashboards built remotely.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Automating data flow between ordering, logistics and record-keeping systems with n8n reduces manual entry for distributed operations.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Agribusiness and insurance firms needing internal tools or customer portals can have them designed and shipped online.",
      },
    ],
    sources: [
      {
        title: "Nebraska: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/nebraska",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "Nebraska Agriculture Fact Card",
        url: "https://nda.nebraska.gov/facts.pdf",
        publisher: "Nebraska Department of Agriculture",
        accessed: "2026-11-23",
      },
    ],
  },

  "north-dakota": {
    angle:
      "A Bakken energy and wheat economy where oil and gas is the single largest source of output.",
    context: [
      {
        text: "Mining, quarrying, and oil and gas extraction was North Dakota's largest industry by GDP contribution in 2025 at $10.9 billion, within a total real GDP of $63.6 billion.",
        sources: [1],
      },
      {
        text: "Petroleum and coal products ($3.8 billion) were the largest category within the state's $8.7 billion of goods exports in 2025.",
        sources: [0],
      },
      {
        text: "North Dakota also ranked first nationally in wheat exports in 2024 ($1.0 billion), part of $5.4 billion in agricultural exports.",
        sources: [0],
      },
      {
        text: "Energy field operations and large-scale agriculture both produce operational data a remote studio can help consolidate and automate.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Energy-services and ag operations tracking production, field activity and costs can get consolidated dashboards built remotely.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Connecting field, logistics and back-office systems with n8n flows removes manual re-keying for distributed operations.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Energy and agribusiness firms needing internal applications and portals can have them designed and delivered online.",
      },
    ],
    sources: [
      {
        title: "North Dakota: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/north-dakota",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "North Dakota economy and GDP",
        url: "https://usafacts.org/topics/economy/state/north-dakota",
        publisher: "USAFacts",
        accessed: "2026-11-23",
      },
    ],
  },

  ohio: {
    angle:
      "A diversified manufacturing and logistics economy where transportation equipment leads exports.",
    context: [
      {
        text: "Ohio's GDP totaled $873 billion in 2023, seventh among the states, and manufacturing accounted for 15% of that output versus 10% nationally.",
        sources: [1],
      },
      {
        text: "The state ranked fourth among states in factory output at $131.0 billion in 2021.",
        sources: [1],
      },
      {
        text: "Ohio was the eleventh-largest goods exporter in 2025 at $56.5 billion, with transportation equipment its largest category at $18.8 billion, and goods exports supported an estimated 197,000 jobs in 2023.",
        sources: [0],
      },
      {
        text: "A broad manufacturing and distribution base generates production and logistics data a remote studio can help make actionable.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Manufacturers and distributors tracking throughput, inventory and logistics can get live operations dashboards built and maintained remotely.",
      },
      {
        service: "AI agents & automation",
        href: "/services/ai-agents",
        text: "Quoting, order processing and document handling across the manufacturing base are strong candidates for AI-assisted automation scoped online.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Integrating ERP, logistics and supplier systems with n8n reduces manual data entry without adding headcount.",
      },
    ],
    sources: [
      {
        title: "Ohio: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/ohio",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "Ohio Facts: Gross Domestic Product",
        url: "https://lsc.ohio.gov/assets/organizations/legislative-service-commission/files/current-ohio-facts-gross-domestic-product-september-2024.pdf",
        publisher: "Ohio Legislative Service Commission",
        accessed: "2026-11-23",
      },
    ],
  },

  "south-dakota": {
    angle:
      "An agriculture and food-processing economy running at near-full employment.",
    context: [
      {
        text: "South Dakota was the twelfth-largest agricultural exporting state in 2024 at $4.6 billion, including soybeans ($1.2 billion, eighth nationally), corn ($722 million, sixth) and beef and veal ($362 million, eighth).",
        sources: [0],
      },
      {
        text: "Food and kindred products ($559 million) was the largest category within the state's $1.9 billion of total goods exports in 2025.",
        sources: [0],
      },
      {
        text: "State GDP reached $75.2 billion in 2024, and the unemployment rate was just 1.8% in April 2025, well below the 4.2% national rate.",
        sources: [1],
      },
      {
        text: "A tight labor market makes automation and better internal tooling especially useful, and both can be delivered by a remote studio.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Ag processors and operators tracking production, inventory and commodity data can get live dashboards built and maintained remotely.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "With labor scarce, automating data entry and system syncing with n8n lets small teams do more without hiring.",
      },
      {
        service: "Web & software development",
        href: "/services/web-development",
        text: "Agribusiness and services firms needing internal applications or customer portals can have them designed and shipped online.",
      },
    ],
    sources: [
      {
        title: "South Dakota: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/south-dakota",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "Economic Indicators (June 2025)",
        url: "https://sdgoed.com/wp-content/uploads/2025/06/2025-06_GOED-EconInd.pdf",
        publisher: "South Dakota Governor's Office of Economic Development",
        accessed: "2026-11-23",
      },
    ],
  },

  wisconsin: {
    angle:
      "Industrial machinery manufacturing and America's Dairyland, exporting to much of the world.",
    context: [
      {
        text: "Wisconsin exported $27.2 billion of goods in 2025, with machinery except electrical its largest manufacturing category at $5.1 billion, ahead of transportation equipment at $2.7 billion.",
        sources: [0],
      },
      {
        text: "Its agricultural exports reached $3.8 billion in 2024, with dairy products of $1.1 billion ranking second nationally.",
        sources: [0],
      },
      {
        text: "In 2025 the state shipped $3.99 billion in agricultural, forestry and food products to 148 countries and ranked first in the US for specialty cheese and bovine genetics.",
        sources: [1],
      },
      {
        text: "Machine builders and food processors alike run on production and supply-chain data a remote studio can help structure and automate.",
      },
    ],
    serviceFit: [
      {
        service: "Business dashboards & analytics",
        href: "/services/business-dashboards",
        text: "Machinery makers and food processors tracking production, quality and inventory can get live dashboards built and maintained remotely.",
      },
      {
        service: "n8n workflow automation",
        href: "/services/n8n-automation",
        text: "Automating data flow between ERP, logistics and supplier systems with n8n reduces manual re-keying for manufacturers.",
      },
      {
        service: "Ecommerce development",
        href: "/services/ecommerce-development",
        text: "Food and consumer brands expanding direct-to-consumer sales can have online storefronts designed and built entirely remotely.",
      },
    ],
    sources: [
      {
        title: "Wisconsin: Exports, Jobs, & Foreign Investment",
        url: "https://ustr.gov/countries-regions/united-states-trade-data/wisconsin",
        publisher: "Office of the United States Trade Representative",
        accessed: "2026-11-23",
      },
      {
        title: "Wisconsin Agricultural Export Statistics",
        url: "https://datcp.wi.gov/Pages/AgDevelopment/ExportStatistics.aspx",
        publisher: "Wisconsin Department of Agriculture, Trade and Consumer Protection",
        accessed: "2026-11-23",
      },
    ],
  },
};
