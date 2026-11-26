/**
 * Product Sourcing & Supply Chain Coordination data layer.
 *
 * Truthfulness & privacy governance:
 *  - Presented strictly under Ali Arshad Personal Studio as the accountable
 *    point of contact. No invented sourcing company name, no implied company
 *    ownership, no unverified "10+ years" experience claim.
 *  - Categories grounded in real local repository materials (luggage/bags,
 *    toys/educational items, LED/commercial lighting) are distinguished clearly
 *    from general request-based custom research categories (home appliances,
 *    consumer electronics/accessories, kitchenware/household goods).
 *  - ZERO supplier WhatsApp numbers, private emails, supplier brand names, or
 *    unapproved/outdated spreadsheet quotes are exposed.
 *  - Never claims "lowest MOQ", "best quality", "guaranteed lowest price", or
 *    "guaranteed DDP". Explains Incoterms honestly as route/goods dependent.
 */

import type { IconName } from "@/components/ui/Icon";
import type { FaqItem } from "@/lib/structured-data";

export const PRODUCT_SOURCING_PATH = "/services/product-sourcing";
export const PRODUCT_SOURCING_CONTACT_SERVICE = "Global Sourcing & Supply Chain";

export type SourcingCategory = {
  id: string;
  name: string;
  pathType: "Reference catalog experience" | "Scoped supplier research";
  summary: string;
  typicalChecks: string[];
  caveat: string;
};

export type SourcingWorkflowStep = {
  step: string;
  label: string;
  detail: string;
  gate: "Coordinated directly" | "Requires supplier quote" | "Requires customer approval";
};

export type IncotermRow = {
  term: string;
  fullName: string;
  sellerHandles: string;
  buyerHandles: string;
  practicalNote: string;
};

export type SourcingSectionSlug =
  | "categories"
  | "suppliers"
  | "samples"
  | "quality-inspection"
  | "customization-packaging"
  | "order-fulfillment"
  | "freight-incoterms"
  | "process-faq";

export type SourcingSubpage = {
  slug: SourcingSectionSlug;
  navLabel: string;
  title: string;
  h1: string;
  eyebrow: string;
  lead: string;
  photo: {
    src: string;
    alt: string;
    caption: string;
  };
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  faqs: FaqItem[];
  showCategories?: boolean;
  showIncoterms?: boolean;
};

export const SOURCING_CATEGORIES: SourcingCategory[] = [
  {
    id: "bags-luggage",
    name: "Bags & Luggage",
    pathType: "Reference catalog experience",
    summary:
      "Hard-shell polycarbonate and aluminum-frame travel luggage sets (carry-on through checked sizes), spinner wheel hardware, TSA lock specs, interior linings, and travel bags.",
    typicalChecks: [
      "Shell material & thickness (PC, ABS/PC blend, aluminum frame tolerances)",
      "Spinner wheel noise/load check, telescopic handle play, and zipper/lock smooth action",
      "Nested vs. un-nested master carton dimensions (major driver of volumetric freight cost)",
    ],
    caveat: "Exact unit quotes, MOQs, and available shell molds are requested fresh per inquiry — never assumed from older sheets.",
  },
  {
    id: "toys",
    name: "Toys & Educational Products",
    pathType: "Reference catalog experience",
    summary:
      "Baby/toddler toys, magnetic building blocks, kids' educational learning devices, RC vehicles, water and soft-dart blasters, and gift-ready retail packs.",
    typicalChecks: [
      "Destination safety compliance documentation (e.g., ASTM F963, CPSIA/CPC for US; EN71 for EU) verified before bulk PO",
      "Small-parts, battery compartment screw-lock, and sharp-edge mechanical inspection",
      "Retail color-box artwork, language warnings, and master carton pack quantities",
    ],
    caveat: "Toy import compliance varies strictly by country and age grade; third-party lab testing requirements are confirmed before ordering.",
  },
  {
    id: "lighting-solar",
    name: "Lighting & Solar Products",
    pathType: "Reference catalog experience",
    summary:
      "Commercial and architectural LED downlights, magnetic/standard LED track lights, recessed luminaires, and scoped solar lighting fixtures.",
    typicalChecks: [
      "Wattage, lumen output, color temperature (CCT), CRI rating, and driver/voltage compatibility (110V/220V)",
      "Required regional electrical certifications (UL/ETL, FCC, CE, RoHS) verified with supplier documentation",
      "Thermal housing materials, beam-angle optics, and drop-safe inner packaging",
    ],
    caveat: "Electrical and grid-connected fixtures require destination-market certification verification prior to shipment.",
  },
  {
    id: "consumer-electronics",
    name: "Consumer Electronics & Phone Accessories",
    pathType: "Scoped supplier research",
    summary:
      "Charging accessories, desk peripherals, audio accessories, cables, mounts, and practical consumer tech sourced through targeted supplier discovery.",
    typicalChecks: [
      "Battery/UN38.3 transport rules and safety markings (FCC, UL/ETL, CE) for air or sea freight",
      "Functional sample testing across voltage, port fit, and cable strain relief",
      "Warranty, spare-unit allowance, and clear defect replacement terms",
    ],
    caveat: "Supplier shortlists and current pricing are researched fresh per specification; no pre-claimed factory partnerships.",
  },
  {
    id: "home-appliances",
    name: "Small Home Appliances",
    pathType: "Scoped supplier research",
    summary:
      "Compact countertop and household appliances evaluated on electrical standards, plug type, spares availability, and after-sales defect rates.",
    typicalChecks: [
      "Destination voltage, frequency (60Hz US vs. 50Hz EU/UK), and regional plug configuration",
      "Safety certifications and factory test-report availability prior to sampling",
      "Protective foam/carton drop-test packaging for heavier appliance units",
    ],
    caveat: "Feasibility depends on product regulatory classification and minimum order quantities confirmed by vetted suppliers.",
  },
  {
    id: "kitchenware-household",
    name: "Kitchenware & Household Goods",
    pathType: "Scoped supplier research",
    summary:
      "Non-electric cookware, storage organizers, silicone/stainless utensils, drinkware, and practical everyday household essentials.",
    typicalChecks: [
      "Food-contact material declarations (e.g., FDA / LFGB grade stainless steel or silicone) where applicable",
      "Surface finish consistency, weld/seam inspection, and odor/wash durability checks",
      "Stackability and protective inner dividers to cut shipping damage and CBM waste",
    ],
    caveat: "Quotes, food-contact test certificates, and custom packaging minimums are confirmed per supplier inquiry.",
  },
];

export const SOURCING_WORKFLOW: SourcingWorkflowStep[] = [
  {
    step: "01",
    label: "Requirements & target spec",
    detail: "Define product specs, target destination country, order volume range, compliance needs, and realistic budget range.",
    gate: "Coordinated directly",
  },
  {
    step: "02",
    label: "Product & supplier shortlist",
    detail: "Research candidate manufacturers/suppliers, verify basic business details, and request structured like-for-like EXW/FOB quotations.",
    gate: "Requires supplier quote",
  },
  {
    step: "03",
    label: "Quote & landed-cost review",
    detail: "Normalize quotes across unit price, MOQ, carton CBM, packaging fees, estimated freight, and indicative duties before choosing samples.",
    gate: "Requires customer approval",
  },
  {
    step: "04",
    label: "Sample coordination & evaluation",
    detail: "Arrange paid product samples, consolidate where practical, check physical materials/workmanship, and log revision feedback.",
    gate: "Requires customer approval",
  },
  {
    step: "05",
    label: "Pre-production & quality checks",
    detail: "Lock final specs, packaging details, and coordinate pre-shipment inspection checkpoints (or third-party QC agencies when warranted).",
    gate: "Requires customer approval",
  },
  {
    step: "06",
    label: "Order & packing coordination",
    detail: "Track production milestones, verify carton marks, barcode/labeling specs, packing list accuracy, and export carton integrity.",
    gate: "Coordinated directly",
  },
  {
    step: "07",
    label: "Freight, Incoterms & delivery handoff",
    detail: "Request comparative air/sea freight quotes (EXW, FOB, CIF, DAP, or DDP where feasible) and track handover through licensed forwarders/brokers.",
    gate: "Requires supplier quote",
  },
];

export const INCOTERMS_TABLE: IncotermRow[] = [
  {
    term: "EXW",
    fullName: "Ex Works (Factory Gate)",
    sellerHandles: "Manufactures and packs goods at the factory; makes them available for pickup.",
    buyerHandles: "Origin pickup, China export customs, main international freight, insurance, destination customs, duties, and final delivery.",
    practicalNote: "Common on initial supplier quote sheets; always add origin truck + export clearance when comparing against FOB.",
  },
  {
    term: "FOB",
    fullName: "Free On Board (Origin Port)",
    sellerHandles: "Production, export packing, inland transport to the named origin port, export customs clearance, and vessel loading.",
    buyerHandles: "Main ocean/air freight, cargo insurance, destination port fees, import customs clearance, duties/taxes, and local delivery.",
    practicalNote: "Widely used baseline for sea freight because you control your own freight forwarder and destination charges.",
  },
  {
    term: "CIF",
    fullName: "Cost, Insurance & Freight",
    sellerHandles: "FOB obligations plus main sea freight and minimum marine insurance to the named destination port.",
    buyerHandles: "Destination port unloading/handling charges, import customs clearance, duties/taxes, and inland delivery.",
    practicalNote: "Watch carefully for high destination port/agent fees on low-freight CIF quotes — request the full destination charge breakdown.",
  },
  {
    term: "DAP",
    fullName: "Delivered At Place",
    sellerHandles: "Export clearance, international freight, and transit right up to the named destination address (unloaded by buyer).",
    buyerHandles: "Import customs clearance, import duties/VAT/GST, and unloading at destination.",
    practicalNote: "Useful when your licensed broker handles import clearance directly under your own importer-of-record number.",
  },
  {
    term: "DDP",
    fullName: "Delivered Duty Paid",
    sellerHandles: "Door-to-door transport including export, main freight, import clearance, and duty/tax payment to the agreed address.",
    buyerHandles: "Receiving and unloading goods at the named destination.",
    practicalNote: "Availability, compliance eligibility, and pricing depend strictly on destination country, product category, HS code, and route — never guaranteed upfront.",
  },
];

export const SOURCING_TOOLS: { href: string; title: string; description: string; icon: IconName }[] = [
  {
    href: "/tools/landed-cost-calculator",
    title: "Landed Cost Calculator",
    description: "Estimate unit price, FX rate, packaging/tooling, freight, insurance, customs duties, taxes, and gross margin.",
    icon: "globe",
  },
  {
    href: "/tools/moq-quantity-helper",
    title: "MOQ & Order Quantity Helper",
    description: "Convert supplier MOQ and pcs/carton into full cartons, total CBM volume, weight, and budget scenarios.",
    icon: "briefcase",
  },
  {
    href: "/tools/shipping-cost-calculator",
    title: "Shipping & Volumetric Calculator",
    description: "Compare actual weight vs. volumetric weight and multi-carton CBM across air express, air cargo, and sea LCL.",
    icon: "truck",
  },
  {
    href: "/tools/currency-exchange-calculator",
    title: "Live Currency Converter (USD / CNY)",
    description: "Convert supplier quotes with server-cached reference rates, visible timestamps, and instant manual override.",
    icon: "currency",
  },
];

export const SOURCING_SUBPAGES: SourcingSubpage[] = [
  {
    slug: "categories",
    navLabel: "Product Categories",
    title: "Product & Category Discovery — Product Sourcing",
    h1: "Product and category discovery",
    eyebrow: "Product Sourcing · Categories",
    lead: "Focused non-jewelry consumer and commercial product categories — distinguishing reference catalog categories from fresh custom supplier research.",
    photo: {
      src: "/images/services/sourcing-lighting-electronics.jpg",
      alt: "Architectural LED downlights, track lighting fixtures, and compact consumer electronics laid out on a dark workbench with a multimeter",
      caption: "Illustrative editorial photo — technical and physical evaluation across lighting, luggage, toys, and consumer goods.",
    },
    showCategories: true,
    sections: [
      {
        heading: "How category discovery works before you commit",
        paragraphs: [
          "Rather than copying stale directory listings, category discovery starts from your target product specifications, destination compliance rules, target order volume, and realistic landed-cost ceiling.",
          "Categories backed by existing reference sheets (Bags & Luggage, Toys & Educational Products, LED & Commercial Lighting) already have structured spec checklists, while Home Appliances, Consumer Electronics, and Kitchenware are scoped cleanly via targeted supplier research. No supplier is ever presented as a pre-verified partner without direct confirmation.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do you publish live catalog prices on this website?",
        a: "No. Raw factory quote sheets expire quickly (often within 15 days) and depend on exact model variants, quantity, packaging, and current exchange rates. Fresh competitive quotations are requested for your specific brief.",
      },
      {
        q: "Are there products you cannot source?",
        a: "Yes. Restricted, counterfeit, trademark-infringing, hazardous, or legally controlled goods are outside scope. Import compliance feasibility is checked before committing.",
      },
    ],
  },
  {
    slug: "suppliers",
    navLabel: "Supplier Coordination",
    title: "Supplier & Factory Coordination — Product Sourcing",
    h1: "Supplier and factory coordination",
    eyebrow: "Product Sourcing · Supplier Coordination",
    lead: "Structured outreach, like-for-like quote comparison, and clear specification alignment — without hiding direct supplier details behind opaque brokerage.",
    photo: {
      src: "/images/services/sourcing-sample-inspection.jpg",
      alt: "Quality specialist measuring a matte dark hard-shell suitcase sample on an inspection table with calipers and checklist",
      caption: "Illustrative editorial photo — generic inspection workflow; not a claim of a named factory partner.",
    },
    sections: [
      {
        heading: "Comparing suppliers on real terms instead of headline unit price",
        paragraphs: [
          "Two quotes that differ by 15% on unit price often invert once you compare actual material weight, accessories included, carton packing density, MOQ, lead time, and Incoterms (EXW vs. FOB).",
          "Supplier coordination normalizes every quotation into a clean side-by-side comparison so you can see exactly what is included, what requires an extra fee, and which supplier answers technical questions reliably.",
        ],
        bullets: [
          "Structured RFQ pack built from your dimensions, material specs, and packaging needs",
          "Requesting competitive quotations from multiple candidate factories/suppliers",
          "Verifying MOQ, carton pack counts, production lead time, and payment terms in writing",
          "Clear communication log so technical clarifications never get lost in translation",
        ],
      },
      {
        heading: "Honest relationship transparency",
        paragraphs: [
          "Candidate suppliers found during research or past quotation sheets are treated as prospective vendors until vetted on your specific product, sample, and terms. We do not exaggerate supplier lists as exclusive factory partnerships.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can you guarantee the lowest factory price or lowest MOQ?",
        a: "No honest coordinator guarantees lowest prices or MOQs in advance. We request competitive quotations across multiple vetted options and help you compare true landed cost and risk.",
      },
      {
        q: "Do we approve every supplier before placing an order?",
        a: "Always. You review the structured comparison, samples, and written terms and approve the chosen supplier before any purchase order or deposit moves forward.",
      },
    ],
  },
  {
    slug: "samples",
    navLabel: "Samples & Evaluation",
    title: "Sample Coordination & Product Evaluation — Product Sourcing",
    h1: "Sample coordination and product evaluation",
    eyebrow: "Product Sourcing · Samples",
    lead: "Verify physical materials, dimensions, finish, and packaging with real samples before risking bulk production capital.",
    photo: {
      src: "/images/services/sourcing-sample-inspection.jpg",
      alt: "Product quality specialist examining a matte polycarbonate suitcase sample with stainless calipers and swatch cards",
      caption: "Illustrative editorial photo — sample inspection checks dimensions, hardware tolerances, and finishes before bulk orders.",
    },
    sections: [
      {
        heading: "Why structured sample evaluation prevents expensive bulk mistakes",
        paragraphs: [
          "Catalog photos hide thin plastics, loose zippers, dim LED drivers, rough edges, and undersized inner cartons. Ordering and testing physical samples against a written checklist catches issues when revisions are still inexpensive.",
        ],
        bullets: [
          "Confirming exact sample fees, customization charges (if any), and courier delivery timelines",
          "Consolidating multi-supplier samples where practical to cut international courier overhead",
          "Evaluating physical build quality, weight, fit/finish, and packaging durability against your spec",
          "Documenting exact change requests for a signed-off golden sample prior to production",
        ],
      },
    ],
    faqs: [
      {
        q: "Are product samples free?",
        a: "Typically suppliers charge for samples and international express courier shipping; some credit the sample fee toward a confirmed bulk order, depending on the supplier's written terms.",
      },
      {
        q: "How long does sample delivery usually take?",
        a: "Stock samples often dispatch quickly while customized or logo-printed samples require extra prep time — exact timelines are confirmed by the supplier before you pay.",
      },
    ],
  },
  {
    slug: "quality-inspection",
    navLabel: "Quality & Inspections",
    title: "Quality Assurance & Pre-Shipment Inspections — Product Sourcing",
    h1: "Quality assurance and inspections",
    eyebrow: "Product Sourcing · Quality Assurance",
    lead: "Define measurable acceptance criteria upfront and coordinate inspections before final balance payment and shipment.",
    photo: {
      src: "/images/services/sourcing-lighting-electronics.jpg",
      alt: "LED lighting fixtures and electronics hardware laid out next to a digital multimeter and technical notebook for inspection",
      caption: "Illustrative editorial photo — technical and visual checks verified against written customer acceptance specs.",
    },
    sections: [
      {
        heading: "Practical quality checkpoints across production",
        paragraphs: [
          "Quality assurance works best when defects are defined clearly in the purchase specification before manufacturing begins — not argued about after cartons reach your warehouse.",
        ],
        bullets: [
          "Written quality checklist: critical, major, and minor defect criteria aligned with your golden sample",
          "In-process photo/video production checkpoints during manufacturing runs",
          "Pre-shipment inspection coordination (either supplier check protocols or independent third-party AQL inspection agencies, quoted separately as needed)",
          "Carton count, barcode scanability, drop-test packaging review, and shipping mark verification prior to balance release",
        ],
      },
      {
        heading: "Realistic expectations on quality",
        paragraphs: [
          "No third-party coordination can promise zero defects across every manufactured unit. Structured checkpoints and clear defect-handling clauses reduce surprises and let you model realistic defect buffers in the Supplier Comparison Calculator.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can we use an independent third-party inspection company before final payment?",
        a: "Yes — for larger orders, coordinating an independent on-site pre-shipment inspection (AQL sampling) before paying the final supplier balance is strongly recommended.",
      },
      {
        q: "Does quality inspection replace destination product safety certification?",
        a: "No. Visual/functional QC verifies production against your sample, while regulated items (such as toys or electrical lighting) require accredited lab test reports and compliance certificates.",
      },
    ],
  },
  {
    slug: "customization-packaging",
    navLabel: "Customization & Packaging",
    title: "Customization, Packaging & Private Label — Product Sourcing",
    h1: "Customization, packaging, and private label",
    eyebrow: "Product Sourcing · Customization & Packaging",
    lead: "Logo application, retail box packaging, inserts, and custom finishes — scoped strictly where confirmed by supplier capability and MOQ.",
    photo: {
      src: "/images/services/sourcing-warehouse-packing.jpg",
      alt: "Clean export warehouse showing neatly sealed brown master shipping cartons on timber pallets and packing label station",
      caption: "Illustrative editorial photo — retail packaging and export carton specs confirmed against supplier MOQs before production.",
    },
    sections: [
      {
        heading: "Conditional by supplier, category, and order volume",
        paragraphs: [
          "Private-label customization is never assumed automatically. Some stock catalog items allow simple laser engraving, hangtags, or custom outer stickers at low quantities, while custom color boxes, molded shells, or bespoke colorways carry higher MOQs and tooling/plate charges.",
        ],
        bullets: [
          "Light branding options (where supported): logo printing, hangtags, custom inserts, barcode/FNSKU labels",
          "Retail packaging (where supported): custom dieline color boxes, manual inserts, foam/blister fitment",
          "Export-safe outer cartons: double-wall corrugated cartons, moisture protection, and accurate shipping marks",
          "Proof sign-off: artwork dielines and physical packaging proofs approved by you before print runs start",
        ],
      },
    ],
    faqs: [
      {
        q: "Can you design our packaging dielines and brand graphics too?",
        a: "Yes — because brand identity and graphic design live inside Ali Arshad Personal Studio, packaging graphics and insert layouts can be coordinated cleanly alongside sourcing.",
      },
      {
        q: "What if our first order is below a supplier's custom packaging MOQ?",
        a: "We will state that upfront and present practical alternatives — such as neutral stock packaging with branded inserts or labels until volume supports custom print runs.",
      },
    ],
  },
  {
    slug: "order-fulfillment",
    navLabel: "Order & Packing Prep",
    title: "Order Coordination, Packing & Shipment Preparation — Product Sourcing",
    h1: "Order coordination, packing, and shipment preparation",
    eyebrow: "Product Sourcing · Order & Fulfillment",
    lead: "Keeping production schedules, packing lists, carton labels, and export handover organized so shipments do not stall at dispatch.",
    photo: {
      src: "/images/services/sourcing-warehouse-packing.jpg",
      alt: "Export fulfillment warehouse with stacked master cartons on pallets and thermal shipping label station",
      caption: "Illustrative editorial photo — clean carton labeling, accurate packing lists, and verified dimensions simplify freight handoff.",
    },
    sections: [
      {
        heading: "What order & shipment preparation covers",
        paragraphs: [
          "Between purchase-order deposit and port gate-in, small administrative errors — mismatched invoice values, wrong carton dimensions, missing country-of-origin marks, or late packing lists — cause avoidable customs delays and surprise storage bills.",
        ],
        bullets: [
          "Production milestone follow-ups and clear delay escalation when schedules shift",
          "Verifying final carton count, exact dimensions (L × W × H), gross/net weights, and total CBM",
          "Reviewing commercial invoice, packing list consistency, and required carton shipping marks",
          "Coordinating handover to your nominated freight forwarder, express courier, or consolidation warehouse",
        ],
      },
    ],
    faqs: [
      {
        q: "Can we verify carton dimensions before booking freight?",
        a: "Yes — getting verified master carton sizes and weights early lets you model volumetric vs. actual weight accurately in our Shipping & MOQ calculators before locking a freight mode.",
      },
      {
        q: "Do you handle warehouse 3PL fulfillment inside destination countries?",
        a: "Coordination hands off cleanly to your chosen destination 3PL, Amazon FBA prep center, or own warehouse — we do not claim to own physical warehouses.",
      },
    ],
  },
  {
    slug: "freight-incoterms",
    navLabel: "Freight & Incoterms (DDP)",
    title: "Freight, Delivery, DDP & Incoterms Explained — Product Sourcing",
    h1: "Freight, delivery, DDP, and Incoterms explained honestly",
    eyebrow: "Product Sourcing · Freight & Incoterms",
    lead: "Understand EXW, FOB, CIF, DAP, and DDP accurately — because freight options, duties, clearance, and costs always depend on destination, goods, and route.",
    photo: {
      src: "/images/services/sourcing-freight-logistics.jpg",
      alt: "Twilight documentary photograph of intermodal shipping containers and air-freight cargo pallets at a modern logistics port terminal",
      caption: "Illustrative editorial photo — air express, air cargo, and sea freight (LCL/FCL) options quoted per lane and cargo profile.",
    },
    showIncoterms: true,
    sections: [
      {
        heading: "Why DDP is never 'guaranteed' upfront",
        paragraphs: [
          "Delivered Duty Paid (DDP) can be convenient for eligible goods and lanes, but whether DDP is legally compliant, cost-effective, or available depends strictly on the destination country, HS tariff classification, product regulations (batteries, electronics, toys, lighting), and carrier rules.",
          "Ali Arshad Personal Studio coordinates freight quotation requests and landed-cost comparisons; formal customs brokerage, HS classification rulings, and import clearance always stay with licensed customs brokers and freight forwarders.",
        ],
        bullets: [
          "Air Express (Courier): fastest transit for samples and compact high-value parcels; billed by volumetric vs. actual weight",
          "Air Cargo: practical for urgent mid-weight commercial shipments; requires destination customs clearance",
          "Sea Freight (LCL consolidation / FCL container): most economical for bulky or heavy cargo like luggage and lighting",
        ],
      },
    ],
    faqs: [
      {
        q: "Are you a licensed customs broker or freight forwarder?",
        a: "No. I coordinate sourcing, supplier packing prep, landed-cost modeling, and freight quote comparisons; legal customs clearance and brokerage always run through licensed third-party brokers and forwarders.",
      },
      {
        q: "How do we estimate duties and freight before placing an order?",
        a: "Use the Landed Cost, Shipping/CBM, and Currency calculators on this site for planning estimates, then confirm official HS codes and binding freight quotes with your forwarder/broker prior to booking.",
      },
    ],
  },
  {
    slug: "process-faq",
    navLabel: "Process, FAQ & Quote",
    title: "Product Sourcing Process, FAQ & Quote Request",
    h1: "Sourcing process, common questions, and how to start",
    eyebrow: "Product Sourcing · Process & FAQ",
    lead: "A transparent seven-stage workflow from initial product brief to freight coordination — with written customer approvals at every spending gate.",
    photo: {
      src: "/images/services/sourcing-sample-inspection.jpg",
      alt: "Quality inspection specialist evaluating a suitcase sample with measurement tools and printed checklist",
      caption: "Illustrative editorial photo — every major spend decision (samples, bulk PO, inspection, freight) requires your written approval.",
    },
    sections: [
      {
        heading: "What to prepare for a sourcing quote request",
        paragraphs: [
          "The faster we lock clear requirements, the faster we can request accurate, comparable supplier quotations. Even a short bullet list is enough to start:",
        ],
        bullets: [
          "Product type, reference photo or link, key materials/dimensions, and any required variants",
          "Destination country and target sales channel (e.g., direct ecommerce, retail, commercial project)",
          "Rough target order quantity or budget range (so we check MOQ feasibility early)",
          "Whether you need neutral stock items or conditional custom packaging/branding",
        ],
      },
    ],
    faqs: [
      {
        q: "Who is my point of contact throughout the sourcing project?",
        a: "Ali Arshad directly. You work with one accountable point of contact from initial brief and supplier comparison through sample review and shipment coordination.",
      },
      {
        q: "Do you own the factories or represent a specific sourcing agency?",
        a: "Ali Arshad Personal Studio operates as an independent coordination and supply-chain support studio. We do not claim factory ownership or invent hidden company identities.",
      },
      {
        q: "Can you combine sourcing with a custom storefront, 3D renders, or inventory app?",
        a: "Yes — product visualization, Next.js ecommerce storefronts, and custom sourcing/inventory tools sit inside the same studio.",
      },
    ],
  },
];

export function getSourcingSubpage(slug: string): SourcingSubpage | undefined {
  return SOURCING_SUBPAGES.find((p) => p.slug === slug);
}

export const SOURCING_OVERVIEW_FAQS: FaqItem[] = [
  {
    q: "Which product categories do you support?",
    a: "We focus on practical non-jewelry categories including Bags & Luggage, Toys & Educational Products, and LED & Commercial Lighting (where structured reference specifications already exist), plus scoped supplier research for Consumer Electronics & Accessories, Small Home Appliances, and Kitchenware & Household Goods.",
  },
  {
    q: "Do you guarantee the lowest price, lowest MOQ, or DDP shipping?",
    a: "No. Ethical sourcing never promises guaranteed prices, MOQs, or universal DDP before verifying real factory terms, destination regulations, and lane costs. We request competitive quotations and model full landed cost transparently so you decide with real numbers.",
  },
  {
    q: "Are supplier leads in your sheets guaranteed factory partners?",
    a: "No. Any supplier candidate is vetted fresh on your exact product specification, compliance requirements, sample quality, and written commercial terms before you approve an order.",
  },
  {
    q: "How do I estimate landed cost and shipping volume before starting?",
    a: "Use our free Landed Cost Calculator, MOQ & Order Quantity Helper, Shipping & CBM Calculator, and Live Currency Converter (USD/CNY) linked directly from this section — all clearly labeled as planning estimates.",
  },
];
