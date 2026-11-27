/**
 * Product Sourcing & Supply Chain Coordination data layer.
 *
 * Truthfulness, attribution & privacy governance:
 *  - Presented directly under Ali Arshad Personal Studio, grounded in Ali's
 *    supplied background: BBA in Supply Chain Management and 10+ years of
 *    hands-on sourcing experience.
 *  - Product examples and visuals are derived from locally reviewed reference
 *    catalogs (Kitchen Appliances, Luggage & Travel, Mobile Accessories & Power,
 *    Architectural/Outdoor LED Lighting, Toys & Educational Play) while keeping
 *    Kitchenware & Household Goods clearly marked as scoped custom research.
 *  - ZERO confidential supplier names, WhatsApp numbers, private emails,
 *    wholesale prices, or internal negotiation notes are exposed.
 *  - Product visuals retain honest OEM/manufacturer attribution — Ali Arshad
 *    coordinates sourcing, comparison, QC checkpoints, and logistics handoff,
 *    and is NOT a factory owner, licensed customs broker, or freight forwarder.
 *  - Avoids absolute claims ("lowest price", "best quality", "guaranteed DDP").
 */

import type { IconName } from "@/components/ui/Icon";
import type { FaqItem } from "@/lib/structured-data";

export const PRODUCT_SOURCING_PATH = "/services/product-sourcing";
export const PRODUCT_SOURCING_CONTACT_SERVICE = "Global Sourcing & Supply Chain";
export const SOURCING_LOOKBOOK_PDF_PATH = "/downloads/ali-arshad-studio-sourcing-lookbook.pdf";

export type SourcingCategoryId =
  | "kitchen-appliances"
  | "bags-luggage"
  | "mobile-accessories"
  | "lighting-solar"
  | "toys"
  | "kitchenware-household";

export type SourcingCategory = {
  id: SourcingCategoryId;
  name: string;
  pathType: "Reference catalog experience" | "Scoped supplier research";
  summary: string;
  typicalChecks: string[];
  caveat: string;
};

export type SourcingCatalogExample = {
  id: string;
  categoryId: Exclude<SourcingCategoryId, "kitchenware-household">;
  categoryLabel: string;
  title: string;
  image: string;
  imageAlt: string;
  darkSurface?: boolean;
  attributionNote: string;
  summary: string;
  specs: string[];
  packagingAndCompliance: string;
  calculatorHref: string;
  calculatorLabel: string;
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
  | "quote-comparison"
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
    badge?: string;
  };
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  faqs: FaqItem[];
  showCategories?: boolean;
  showCatalogExamples?: boolean;
  showIncoterms?: boolean;
  showResponsibilitySplit?: boolean;
};

export const SOURCING_RESPONSIBILITY_SPLIT = {
  directCoordination: [
    "Turning your product idea, specs, and target budget into a structured Request for Quotation (RFQ)",
    "Researching candidate factories/suppliers and collecting comparable quotes across EXW, FOB, CIF, DAP, or DDP",
    "Normalizing quotes side-by-side (unit cost, MOQ, carton CBM, packaging fees, and estimated landed cost)",
    "Coordinating paid physical samples, specification revisions, and written acceptance checklists",
    "Tracking production milestones, packaging/barcode proofs, and export packing lists prior to dispatch",
  ],
  externalSpecialists: [
    "Manufacturing & warranties: performed by the chosen OEM/ODM manufacturer under written commercial terms",
    "Accredited lab testing & certifications: UL/ETL, FCC, CE, RoHS, EN71, ASTM/CPC, UN38.3, and FDA/LFGB tests by accredited laboratories",
    "Independent on-site AQL inspections: performed by third-party inspection providers where scoped",
    "Freight carriage & customs clearance: executed by licensed freight forwarders and customs brokers (formal HS classification, duties, and lawful DDP eligibility)",
  ],
} as const;

export const SOURCING_CATEGORIES: SourcingCategory[] = [
  {
    id: "kitchen-appliances",
    name: "Kitchen & Small Appliances",
    pathType: "Reference catalog experience",
    summary:
      "Stand mixers, hand mixers, countertop blenders, stainless electric food choppers, and 2-slice digital or matte toasters with regional electrical configurations.",
    typicalChecks: [
      "Destination voltage, frequency (110V/60Hz US vs. 220–240V/50Hz EU/UK), and regional plug/cord spec",
      "Food-contact bowl, blade, and housing materials plus motor wattage and speed-control reliability",
      "Safety certification documentation, retail foam-insert color boxes, and drop-tested master export cartons",
    ],
    caveat: "Electrical compliance reports, spare-part allowances, and exact model MOQs are verified fresh with manufacturers per inquiry.",
  },
  {
    id: "bags-luggage",
    name: "Bags & Hard-Shell Luggage",
    pathType: "Reference catalog experience",
    summary:
      "ABS, polycarbonate (PC), and polypropylene (PP) spinner suitcases in nested 20\"/24\"/28\" or 20\"/25\"/29\" sets, front-opening carry-ons, and aluminum-frame or zipper builds.",
    typicalChecks: [
      "Shell resin blend & wall thickness (ABS, PC, PP), aluminum-frame vs. recessed zipper build tolerances",
      "360° silent spinner wheel load test, multi-stage aluminum trolley play, TSA combination locks, and interior lining",
      "Nested 3-piece export carton dimensions (often ~54×37×80 cm) — volumetric CBM drives sea vs. air freight economics",
    ],
    caveat: "Unit pricing, custom mold/color MOQs, and stock availability change by season and are quoted fresh on request.",
  },
  {
    id: "mobile-accessories",
    name: "Mobile Accessories & Power",
    pathType: "Reference catalog experience",
    summary:
      "Protective woven/aramid and MagSafe ring-stand phone cases, 20W built-in-cable and magnetic power banks, and UK/US/EU USB-C PD fast wall chargers.",
    typicalChecks: [
      "Internal PCB layout & RoHS/safety inspection on chargers, plus regional plug prong standards (US/UK/EU)",
      "Lithium battery UN38.3 / MSDS transport documentation for compliant air or sea freight on power banks",
      "Model-fit tolerances, magnet pull strength, retail packaging, and FNSKU/EAN barcode placement",
    ],
    caveat: "Battery-bearing products and AC chargers require strict transport and destination electrical compliance checks before shipping.",
  },
  {
    id: "lighting-solar",
    name: "Architectural & Outdoor LED Lighting",
    pathType: "Reference catalog experience",
    summary:
      "IP65 recessed and surface COB LED downlights, 10W–40W commercial LED track heads, and outdoor solar/LED street, flood, and UFO high-bay fixtures.",
    typicalChecks: [
      "Wattage, lumen output, color temperature (2700K–6500K), CRI 90+, beam angle (15°–36°), and driver spec",
      "Aging test records, thermal aluminum heatsink build, and IP ingress protection ratings",
      "Regional electrical safety certifications (UL/ETL, FCC, CE, RoHS) verified before bulk PO release",
    ],
    caveat: "Commercial lighting specs and driver brands vary widely across price tiers — photometric & driver datasheets are checked before sampling.",
  },
  {
    id: "toys",
    name: "Toys & Educational Play",
    pathType: "Reference catalog experience",
    summary:
      "High-strength magnetic ABS building block sets (24–168 pcs), early-learning baby stacking/ball-drop toys, kids' LCD learning devices, RC vehicles, and outdoor summer water/foam toys.",
    typicalChecks: [
      "Destination child-safety compliance testing (ASTM F963 & CPSIA/CPC for US; EN71/CE/REACH for EU)",
      "Small-parts screening, magnet encapsulation safety, screw-locked battery doors, and smooth edge checks",
      "Window-box, color-box, storage-tub, or e-commerce mailer packing specs and inner/master carton counts",
    ],
    caveat: "Toy import safety rules are strict and non-negotiable; accredited third-party lab testing requirements are confirmed before production.",
  },
  {
    id: "kitchenware-household",
    name: "Kitchenware & Household Goods",
    pathType: "Scoped supplier research",
    summary:
      "Non-electric cookware, food storage organizers, silicone and stainless utensils, drinkware, and everyday household essentials sourced through targeted supplier research.",
    typicalChecks: [
      "Food-contact material declarations (FDA / LFGB grade stainless steel, glass, or silicone) where applicable",
      "Surface finish consistency, seam/weld checks, and odor or wash durability inspection on samples",
      "Stackability and inner carton dividers to minimize breakage and shipping CBM waste",
    ],
    caveat: "Shortlists, food-contact certificates, and custom packaging minimums are researched fresh per buyer brief.",
  },
];

export const SOURCING_CATALOG_EXAMPLES: SourcingCatalogExample[] = [
  {
    id: "digital-toasters",
    categoryId: "kitchen-appliances",
    categoryLabel: "Kitchen & Small Appliances",
    title: "2-Slice Matte & Digital Countdown Toasters",
    image: "/images/sourcing-catalog/kitchen-toaster.webp",
    imageAlt: "Brushed stainless and matte-black 2-slice toaster with digital countdown display from OEM appliance reference catalog",
    attributionNote: "OEM reference catalog example · Manufactured by third-party appliance factory; coordinated by Ali Arshad Personal Studio",
    summary:
      "Countertop 2-slice toasters across entry matte-housing and stainless digital-display trims with cancel, reheat, defrost, and optional bun-warmer racks.",
    specs: [
      "Housing options: matte cool-touch body or brushed stainless steel trim",
      "Controls: rotary browning dial or digital countdown display with cancel/reheat/defrost",
      "Regional power cord & voltage spec verified for target destination market",
    ],
    packagingAndCompliance: "Foam-protected retail gift box + master export carton; regional electrical safety docs confirmed before sampling.",
    calculatorHref: "/tools/landed-cost-calculator",
    calculatorLabel: "Model appliance landed cost",
  },
  {
    id: "stand-hand-mixers",
    categoryId: "kitchen-appliances",
    categoryLabel: "Kitchen & Small Appliances",
    title: "Tilt-Head Stand Mixers, Hand Mixers & Blenders",
    image: "/images/sourcing-catalog/kitchen-stand-mixer.webp",
    imageAlt: "Metallic red tilt-head stand mixer with stainless steel mixing bowl from OEM kitchen appliance reference catalog",
    attributionNote: "OEM reference catalog example · Third-party appliance manufacturer; sourcing & QC coordinated by Ali Arshad",
    summary:
      "Home-baking stand mixers with brushed stainless bowls, splash guards, dough/whisk attachments, plus compact hand mixers and countertop blenders.",
    specs: [
      "Bowl & attachments: stainless steel bowl, tilt-head release, dough hook, beater, and whisk sets",
      "Control options: multi-speed rotary dial or LED timer interface depending on model tier",
      "Pre-production sample checks: gear noise, thermal load test, and attachment fitment",
    ],
    packagingAndCompliance: "Molded protective inner foam + reinforced color box; electrical test reports & voltage checks confirmed upfront.",
    calculatorHref: "/tools/supplier-comparison-calculator",
    calculatorLabel: "Compare appliance quotes",
  },
  {
    id: "stainless-food-choppers",
    categoryId: "kitchen-appliances",
    categoryLabel: "Kitchen & Small Appliances",
    title: "Stainless-Bowl Multi-Speed Food Choppers",
    image: "/images/sourcing-catalog/kitchen-food-chopper.webp",
    imageAlt: "Brushed stainless steel electric food chopper with clear lid from OEM appliance reference catalog",
    attributionNote: "OEM reference catalog example · Third-party kitchen appliance manufacturer; coordinated by Ali Arshad",
    summary:
      "Compact countertop electric food choppers with stainless or glass bowls, multi-blade assemblies, and top-mounted speed/pulse controls.",
    specs: [
      "Bowl variants: brushed stainless steel or thickened glass bowls with anti-slip base rings",
      "Blade & lid checks: safety interlock switch, blade sharpness, and seal tightness",
      "Manuals & language artwork: localized warning labels and custom gift-box dielines where MOQ fits",
    ],
    packagingAndCompliance: "Food-contact blade/bowl material checks and drop-tested inner dividers for parcel or retail transit.",
    calculatorHref: "/tools/moq-quantity-helper",
    calculatorLabel: "Plan MOQ & carton CBM",
  },
  {
    id: "luggage-pp-pc-lineup",
    categoryId: "bags-luggage",
    categoryLabel: "Bags & Hard-Shell Luggage",
    title: "PP & Polycarbonate Hard-Shell Spinner Collections",
    image: "/images/sourcing-catalog/luggage-collection.webp",
    imageAlt: "Multi-color hard-shell PP and polycarbonate spinner suitcases arranged in cabin and checked sizes from luggage reference catalog",
    attributionNote: "OEM reference catalog example · Third-party luggage manufacturer; sourcing & sample review coordinated by Ali Arshad",
    summary:
      "Coordinated travel luggage lines spanning cabin (20\") and checked (24\"–29\") sizes in ribbed PP/PC shells with custom Pantone colorways where volume fits.",
    specs: [
      "Common size sets: 20\"/24\"/28\" or 20\"/25\"/29\" nested sets (3-piece carton ~54×37×80 cm)",
      "Hardware specs: double-row 360° spinner wheels, aluminum or iron trolley handles, TSA or standard locks",
      "Optional utility trims: front-opening laptop pockets, side bag hooks, or cup-holder mounts",
    ],
    packagingAndCompliance: "Standard PE bag + nested 3-piece export carton; volumetric weight makes sea LCL/FCL critical for unit economics.",
    calculatorHref: "/tools/shipping-cost-calculator",
    calculatorLabel: "Calculate luggage CBM freight",
  },
  {
    id: "luggage-textured-shells",
    categoryId: "bags-luggage",
    categoryLabel: "Bags & Hard-Shell Luggage",
    title: "Textured ABS, PC & Aluminum-Frame Travel Cases",
    image: "/images/sourcing-catalog/luggage-hardshell-models.webp",
    imageAlt: "Three hard-shell spinner suitcases in metallic silver, champagne ribbed, and diamond navy finishes from luggage reference sheet",
    attributionNote: "OEM reference catalog example · Third-party luggage factory; specifications & packing coordinated by Ali Arshad",
    summary:
      "Distinct shell textures and finishes evaluated across ABS value tiers, flexible polycarbonate builds, and reinforced aluminum-frame latches.",
    specs: [
      "Typical case weights: ~3.0–3.9 kg (20\"), ~4.0–5.0 kg (24\"–25\"), ~5.0–6.5 kg (28\"–29\") by build",
      "Sample inspection checks: shell flex rebound, telescoping lock snap, lining stitching, and wheel noise",
      "Typical regular production window: ~30–45 days after deposit and golden-sample sign-off (confirmed per PO)",
    ],
    packagingAndCompliance: "Custom hangtags, molded logo plates, and zipper pulls quoted conditionally by MOQ.",
    calculatorHref: "/tools/moq-quantity-helper",
    calculatorLabel: "Check container fill %",
  },
  {
    id: "magsafe-phone-cases",
    categoryId: "mobile-accessories",
    categoryLabel: "Mobile Accessories & Power",
    title: "Woven Fabric, Aramid & MagSafe Ring-Stand Cases",
    image: "/images/sourcing-catalog/mobile-phone-cases.webp",
    imageAlt: "Four woven-texture MagSafe protective smartphone cases in charcoal, silver, coral, and teal from accessory catalog",
    attributionNote: "OEM reference catalog example · Third-party mobile accessory factory; coordinated by Ali Arshad",
    summary:
      "Protective multi-colorway smartphone cases combining woven textile/aramid textures, raised camera bezels, and integrated magnetic ring-stands.",
    specs: [
      "Finish families: woven textile, matte TPU/PC bumper, magnetic alignment ring, folding kickstand",
      "Sample checks: camera-ring clearance, tactile button responsiveness, and magnet hold force",
      "Retail customization: custom hang-tab boxes, EVA inserts, FNSKU/EAN labels, and logo debossing",
    ],
    packagingAndCompliance: "Compact high-density cartons suit air express or air cargo cleanly when launching multiple device SKUs.",
    calculatorHref: "/tools/landed-cost-calculator",
    calculatorLabel: "Estimate accessory margin",
  },
  {
    id: "power-banks-20w",
    categoryId: "mobile-accessories",
    categoryLabel: "Mobile Accessories & Power",
    title: "20W Built-In Cable & Magnetic Power Banks",
    image: "/images/sourcing-catalog/mobile-power-banks.webp",
    imageAlt: "Matte black portable power banks with integrated USB-C cables and digital battery display from electronics catalog",
    attributionNote: "OEM reference catalog example · Third-party power-accessory manufacturer; coordinated by Ali Arshad",
    summary:
      "Compact 20W fast-charging portable power banks with integrated multi-tip cables, LED digital percentage screens, and optional magnetic wireless coils.",
    specs: [
      "Feature options: integrated lanyard cables, digital charge readout, magnetic wireless alignment",
      "Critical QC checks: actual cell capacity verification, thermal cut-off testing, and port durability",
      "Freight readiness: UN38.3, MSDS, and hazardous-goods carrier routing confirmed prior to shipping",
    ],
    packagingAndCompliance: "Battery shipments require compliant carrier channels and verified UN38.3/MSDS documentation.",
    calculatorHref: "/tools/currency-exchange-calculator",
    calculatorLabel: "Convert USD / CNY quotes",
  },
  {
    id: "pd-chargers-pcb-qc",
    categoryId: "mobile-accessories",
    categoryLabel: "Mobile Accessories & Power",
    title: "UK / US / EU PD Wall Chargers & Internal PCB Review",
    image: "/images/sourcing-catalog/mobile-pd-chargers-pcb.webp",
    imageAlt: "UK plug USB-C PD fast charger alongside top and bottom views of its FR-4 RoHS internal circuit board",
    attributionNote: "OEM reference catalog example · Shows internal FR-4 PCB layout used during technical quote comparison",
    summary:
      "USB-C PD fast chargers in UK, US, and EU prong formats where comparing internal PCB layout, capacitor grade, and safety isolation separates safe builds from cut-corner quotes.",
    specs: [
      "Plug formats: regional US, UK (3-pin fused), and EU molded housings",
      "Technical comparison: FR-4 PCB build cleanliness, thermal potting, RoHS markings, and surge spacing",
      "Safety compliance: destination certification (UL/ETL/FCC, UKCA, CE) verified before bulk PO",
    ],
    packagingAndCompliance: "Never compare power adapters on unit price alone — internal PCB teardown and accredited lab reports protect brand safety.",
    calculatorHref: "/tools/supplier-comparison-calculator",
    calculatorLabel: "Score suppliers on quality",
  },
  {
    id: "architectural-led-downlights",
    categoryId: "lighting-solar",
    categoryLabel: "Architectural & Outdoor LED Lighting",
    title: "IP65 Architectural COB Downlights & Track Heads",
    image: "/images/sourcing-catalog/lighting-led-downlights.webp",
    imageAlt: "Architectural dark-anodized aluminum COB LED downlight housings and reflectors from lighting reference catalog",
    darkSurface: true,
    attributionNote: "OEM reference catalog example · Third-party LED lighting manufacturer; technical comparison coordinated by Ali Arshad",
    summary:
      "Commercial-grade recessed and surface COB LED downlights alongside 10W–40W adjustable track spotlights engineered for hospitality, retail, and interiors.",
    specs: [
      "Optical options: 2700K–6500K CCT, CRI 90+, narrow-to-wide reflectors (15°/24°/36°), IP65 wet-area trims",
      "Control options: standard dimming or Zigbee/Bluetooth smart-driver configurations",
      "Build checks: die-cast aluminum heatsinks, named LED chip/driver datasheets, and aging-test records",
    ],
    packagingAndCompliance: "Individual shock-safe inner boxes; voltage (100–277V / 220–240V) and regional listing rules verified pre-order.",
    calculatorHref: "/tools/landed-cost-calculator",
    calculatorLabel: "Model lighting landed cost",
  },
  {
    id: "solar-outdoor-lighting",
    categoryId: "lighting-solar",
    categoryLabel: "Architectural & Outdoor LED Lighting",
    title: "Outdoor Solar & LED Street, Flood & High-Bay Lights",
    image: "/images/sourcing-catalog/lighting-solar-outdoor.webp",
    imageAlt: "Die-cast aluminum outdoor LED street light housings and optical lenses from commercial lighting catalog",
    attributionNote: "OEM reference catalog example · Commercial/outdoor LED lighting manufacturer; coordinated by Ali Arshad",
    summary:
      "Outdoor solar street lights, solar flood fixtures, LED street luminaires, and industrial UFO high-bay housings reviewed on thermal management and photometric specs.",
    specs: [
      "Fixture classes: integrated or split-panel solar street lights, outdoor flood lights, UFO high bays",
      "Quality verification: ISO 9001 factory quality docs, photoelectric bench data, and 12-hour aging tests",
      "Project logistics: pole-bracket kits, battery-pack compliance, and sea-freight palletization",
    ],
    packagingAndCompliance: "Solar fixtures with LiFePO4 packs require battery shipping classification alongside IP65/IP66 waterproof sealing checks.",
    calculatorHref: "/tools/shipping-cost-calculator",
    calculatorLabel: "Estimate sea LCL/FCL volume",
  },
  {
    id: "magnetic-building-blocks",
    categoryId: "toys",
    categoryLabel: "Toys & Educational Play",
    title: "Magnetic ABS Building Sets & Early-Learning Toys",
    image: "/images/sourcing-catalog/toys-magnetic-blocks.webp",
    imageAlt: "Colorful magnetic ABS building sticks, spheres, and retail gift box from educational toy reference sheet",
    attributionNote: "OEM reference catalog example · Third-party toy manufacturer; compliance & carton coordination by Ali Arshad",
    summary:
      "24-to-168 piece magnetic ABS STEM construction sets alongside infant rainbow stacking rings, ball-drop towers, and learning playsets across retail gift packaging.",
    specs: [
      "Set scales: 24, 35, 50, 62, 102, 138, and 168-piece assortments in color boxes, window boxes, or storage tubs",
      "Safety standards referenced on sheets: EN71, CE, ASTM, CPC, REACH (verified via current accredited lab reports)",
      "Packing math: clear pcs/carton and outer carton sizes enable exact 20ft/40ft container utilization",
    ],
    packagingAndCompliance: "Always confirm current child-safety lab test reports (CPC/ASTM/EN71) matching your exact SKU & age grade before shipping.",
    calculatorHref: "/tools/moq-quantity-helper",
    calculatorLabel: "Calculate toy cartons & CBM",
  },
  {
    id: "early-learning-infant-toys",
    categoryId: "toys",
    categoryLabel: "Toys & Educational Play",
    title: "Infant Stacking Rings, Pound-a-Ball & Activity Sets",
    image: "/images/sourcing-catalog/toys-early-learning.webp",
    imageAlt: "Infant rainbow stacking ring tower and wooden/plastic pound-a-ball activity bench with retail window boxes",
    attributionNote: "OEM reference catalog example · Third-party toy manufacturer; sourcing & packaging coordinated by Ali Arshad",
    summary:
      "Early-development tactile and fine-motor playsets packaged in display window boxes or closed retail color boxes with transparent carton packing ratios.",
    specs: [
      "Assorted formats: rainbow stacking rings, ball-drop towers, shape-matching buses, and pound-a-ball benches",
      "Packaging variants: window box, open display box, closed retail color box, or e-commerce mailer",
      "Inspection checks: non-toxic paint/resin declarations, smooth molding seams, and English warning labels",
    ],
    packagingAndCompliance: "Retail packaging language, age-grade markings, and barcode placement confirmed prior to print production.",
    calculatorHref: "/tools/supplier-comparison-calculator",
    calculatorLabel: "Compare toy supplier offers",
  },
];

export const SOURCING_WORKFLOW: SourcingWorkflowStep[] = [
  {
    step: "01",
    label: "Brief & specifications",
    detail: "Define product specs, destination country, target volume range, compliance needs, and realistic budget range.",
    gate: "Coordinated directly",
  },
  {
    step: "02",
    label: "Supplier research & shortlist",
    detail: "Research candidate manufacturers/suppliers, check export readiness, and issue structured RFQs.",
    gate: "Requires supplier quote",
  },
  {
    step: "03",
    label: "Comparable quotes & landed cost",
    detail: "Normalize quotes side-by-side across unit price, MOQ, carton CBM, packaging fees, estimated freight, and indicative duties.",
    gate: "Requires customer approval",
  },
  {
    step: "04",
    label: "Sample approval & evaluation",
    detail: "Coordinate paid physical samples, check build quality, materials, and packaging, and log written revisions.",
    gate: "Requires customer approval",
  },
  {
    step: "05",
    label: "Quality checkpoints & inspection",
    detail: "Lock golden-sample criteria and coordinate in-process checks or independent third-party pre-shipment AQL inspections.",
    gate: "Requires customer approval",
  },
  {
    step: "06",
    label: "Production & packing coordination",
    detail: "Track production milestones, barcode/label placement, export carton marks, and verified packing-list dimensions.",
    gate: "Coordinated directly",
  },
  {
    step: "07",
    label: "Freight, Incoterms & delivery handoff",
    detail: "Evaluate EXW, FOB, CIF, DAP, or DDP (where feasible) and hand off cleanly to licensed freight forwarders and customs brokers.",
    gate: "Requires supplier quote",
  },
];

export const INCOTERMS_TABLE: IncotermRow[] = [
  {
    term: "EXW",
    fullName: "Ex Works (Factory Gate)",
    sellerHandles: "Manufactures and packs goods at the factory; makes them available for pickup.",
    buyerHandles: "Origin pickup, export customs, main international freight, insurance, destination customs, duties, and final delivery.",
    practicalNote: "Common on initial quote sheets; always add origin trucking + export clearance when comparing against FOB.",
  },
  {
    term: "FOB",
    fullName: "Free On Board (Origin Port)",
    sellerHandles: "Production, export packing, inland transport to the named origin port, export customs clearance, and vessel loading.",
    buyerHandles: "Main ocean/air freight, cargo insurance, destination port fees, import customs clearance, duties/taxes, and local delivery.",
    practicalNote: "Widely used baseline for sea freight because you control your own licensed freight forwarder and destination fees.",
  },
  {
    term: "CIF",
    fullName: "Cost, Insurance & Freight",
    sellerHandles: "FOB obligations plus main sea freight and minimum marine insurance to the named destination port.",
    buyerHandles: "Destination port unloading/handling charges, import customs clearance, duties/taxes, and inland delivery.",
    practicalNote: "Watch carefully for elevated destination port/agent fees on low-freight CIF quotes — request destination fees in writing.",
  },
  {
    term: "DAP",
    fullName: "Delivered At Place",
    sellerHandles: "Export clearance, international freight, and transit up to the named destination address (unloaded by buyer).",
    buyerHandles: "Import customs clearance, import duties/VAT/GST, and unloading at destination.",
    practicalNote: "Useful when your licensed customs broker clears goods directly under your own importer-of-record registration.",
  },
  {
    term: "DDP",
    fullName: "Delivered Duty Paid (Route-Dependent)",
    sellerHandles: "Door-to-door transport including export, main freight, import clearance, and duty/tax payment to the agreed address.",
    buyerHandles: "Receiving and unloading goods at the named destination.",
    practicalNote: "Strictly dependent on shipment, destination country, product/HS code, supplier capability, and licensed logistics/customs providers — never promised universally.",
  },
];

export const SOURCING_TOOLS: { href: string; title: string; description: string; icon: IconName }[] = [
  {
    href: "/tools/landed-cost-calculator",
    title: "Landed Cost Calculator",
    description: "Estimate unit price, FX rate, packaging/tooling, freight, insurance, indicative duties, taxes, and margin.",
    icon: "globe",
  },
  {
    href: "/tools/supplier-comparison-calculator",
    title: "Supplier Comparison Calculator",
    description: "Score competing factory quotes side-by-side on effective landed cost, MOQ feasibility, lead time, and defect risk.",
    icon: "layers",
  },
  {
    href: "/tools/moq-quantity-helper",
    title: "MOQ & Order Quantity Helper",
    description: "Convert supplier MOQ and pcs/carton into full cartons, total CBM volume, container fill %, and budget scenarios.",
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
    title: "Product Categories & Catalog Examples",
    h1: "Product categories and catalog-backed examples",
    eyebrow: "Product Sourcing · Categories & Catalog Showcase",
    lead: "Explore representative product lines backed by reference manufacturer catalogs — kitchen appliances, hard-shell luggage, mobile accessories, LED/solar lighting, and toys — with zero confidential supplier contacts or outdated prices exposed.",
    photo: {
      src: "/images/sourcing-catalog/luggage-collection.webp",
      alt: "Multi-color hard-shell PP and polycarbonate spinner suitcases from curated sourcing reference catalog",
      caption: "Catalog reference example (OEM manufacturing) — representative product structure; exact models and quotes are sourced fresh per brief.",
      badge: "Catalog reference · OEM product",
    },
    showCatalogExamples: true,
    showCategories: true,
    sections: [
      {
        heading: "Curated presentation without exposing private supplier data",
        paragraphs: [
          "Grounded in a BBA in Supply Chain Management and more than 10 years of stated sourcing experience, every category below distills what buyers actually need to evaluate early: material choices, electrical/safety standards, packaging formats, and carton volume drivers.",
          "Original supplier spreadsheets and presentations remain private so confidential contacts, wholesale prices, and short-lived quote sheets are never published on the public web. Every buyer inquiry receives fresh, comparable quotations tailored to exact specifications and order volume.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do you publish live factory unit prices on this website?",
        a: "No. Factory quotation sheets typically expire within 15–30 days and vary sharply with resin/component costs, quantity tiers, customization, packaging, and exchange rates. Fresh competitive quotations are requested for your exact brief.",
      },
      {
        q: "Who manufactures the products shown in the catalog showcase?",
        a: "Third-party OEM/ODM factories manufacture the physical products. Ali Arshad Personal Studio acts as your independent sourcing coordinator — researching options, normalizing quotes, coordinating samples and QC checkpoints, and guiding logistics handoff.",
      },
      {
        q: "Are there product categories outside scope?",
        a: "Yes. Restricted, counterfeit, trademark-infringing, hazardous, or legally controlled goods are outside scope. Destination import compliance is checked before moving forward.",
      },
    ],
  },
  {
    slug: "suppliers",
    navLabel: "Supplier Research",
    title: "Supplier Research & Factory Coordination",
    h1: "Supplier research and factory coordination",
    eyebrow: "Product Sourcing · Supplier Research",
    lead: "Targeted factory outreach, clear RFQ packages, and direct technical communication — keeping supplier selection transparent and grounded in verifiable specs.",
    photo: {
      src: "/images/services/sourcing-sample-inspection.jpg",
      alt: "Quality specialist measuring a matte dark hard-shell suitcase sample on an inspection table with calipers and checklist",
      caption: "Illustrative editorial photo — structured vetting workflow; never implies factory ownership or unverified factory visits.",
      badge: "Illustrative editorial photo",
    },
    showResponsibilitySplit: true,
    sections: [
      {
        heading: "How supplier shortlisting works",
        paragraphs: [
          "Good sourcing starts before anyone asks for a price. Sending a vague message to twenty factories produces twenty incomparable quotes. Sending a tight specification sheet — target materials, dimensions, electrical/safety rules, packaging style, and realistic quantity — separates capable export factories from trading intermediaries quickly.",
        ],
        bullets: [
          "Structured RFQ pack built from your dimensions, materials, compliance needs, and packaging goals",
          "Screening candidate factories on export readiness, response clarity, MOQ fit, and sample policy",
          "Confirming payment terms (commonly 30% deposit / 70% pre-shipment balance, subject to negotiation) and production lead times in writing",
          "Transparent vendor ownership — you approve every chosen supplier before committing funds",
        ],
      },
    ],
    faqs: [
      {
        q: "Do you own the factories or hold exclusive supplier tie-ups?",
        a: "No. Ali Arshad Personal Studio works independently on the buyer's behalf. Candidate suppliers are evaluated fresh against your product brief, sample quality, and written terms.",
      },
      {
        q: "Do we approve every supplier before placing an order?",
        a: "Always. You review the structured quote comparison, physical samples, and written commercial terms before any purchase order or deposit moves forward.",
      },
    ],
  },
  {
    slug: "quote-comparison",
    navLabel: "Quote Comparison",
    title: "Quote & Supplier Comparison",
    h1: "Like-for-like quote and supplier comparison",
    eyebrow: "Product Sourcing · Quote Comparison",
    lead: "Normalize competing factory quotes across unit price, MOQ, internal build quality, tooling, packaging, carton CBM, and Incoterms so hidden costs surface before you pay.",
    photo: {
      src: "/images/sourcing-catalog/mobile-pd-chargers-pcb.webp",
      alt: "USB-C PD wall charger shown next to top and bottom views of its FR-4 RoHS circuit board for technical build comparison",
      caption: "Catalog reference example — comparing internal component build alongside unit price prevents false savings.",
      badge: "Catalog reference · Technical QC",
    },
    sections: [
      {
        heading: "Why headline unit price rarely tells the full story",
        paragraphs: [
          "Two factory quotes that look 15–20% apart on unit price routinely invert once you normalize EXW vs. FOB origin charges, internal component grade (such as PCB build or luggage shell resin), accessories included, carton packing density, and defect-rate exposure.",
          "Every multi-supplier shortlist is normalized into a single side-by-side matrix and cross-checked with our Supplier Comparison and Landed Cost calculators so you decide on total delivered economics rather than sticker price.",
        ],
        bullets: [
          "Normalizing EXW, FOB, CIF, and route-dependent DDP terms onto one comparable baseline",
          "Separating unit price from tooling/mold setup, custom packaging plates, and sample courier costs",
          "Modeling carton dimensions and volumetric CBM to spot shipping-cost surprises early",
          "Comparing lead times, MOQ capital tie-up, and defect buffers honestly side by side",
        ],
      },
    ],
    faqs: [
      {
        q: "How do you evaluate pricing competitiveness and MOQ options?",
        a: "We aim to obtain competitive quotes from multiple capable suppliers, compare MOQs and carton configurations side by side, and model full landed cost transparently rather than promising unrealistic price or MOQ guarantees upfront.",
      },
      {
        q: "Can I model supplier quotes myself before booking sourcing support?",
        a: "Yes — open the free Supplier Comparison Calculator and Landed Cost Calculator linked below to test scenarios with your own numbers.",
      },
    ],
  },
  {
    slug: "samples",
    navLabel: "Samples & Evaluation",
    title: "Samples & Product Evaluation",
    h1: "Sample coordination and product evaluation",
    eyebrow: "Product Sourcing · Samples",
    lead: "Verify physical materials, dimensions, finish, electrical behavior, and retail packaging with real samples before risking bulk production deposits.",
    photo: {
      src: "/images/services/sourcing-sample-inspection.jpg",
      alt: "Product quality specialist examining a matte polycarbonate suitcase sample with stainless calipers and swatch cards",
      caption: "Illustrative editorial photo — structured sample evaluation checks dimensions, hardware tolerances, and finishes before bulk approval.",
      badge: "Illustrative editorial photo",
    },
    sections: [
      {
        heading: "Turning samples into a signed-off golden standard",
        paragraphs: [
          "Catalog photos hide thin housings, rough molding seams, noisy spinner wheels, dim LED drivers, and fragile gift boxes. Ordering and scoring physical samples against a written specification checklist catches defects when tooling or material adjustments are still straightforward.",
        ],
        bullets: [
          "Confirming exact sample fees, logo/color prep charges, and express courier timelines upfront",
          "Consolidating multi-supplier samples where practical to reduce international express fees",
          "Testing dimensions, weight, hardware action, finish consistency, and inner packaging protection",
          "Logging exact revision notes until you sign off a golden sample for bulk production",
        ],
      },
    ],
    faqs: [
      {
        q: "Are product samples free?",
        a: "Typically factories charge for samples and express courier freight; some suppliers credit part or all of the sample fee toward a confirmed bulk order under written terms.",
      },
      {
        q: "How long does sample preparation usually take?",
        a: "Stock samples often dispatch quickly while customized or logo-printed samples require extra production days — exact schedules are confirmed in writing before payment.",
      },
    ],
  },
  {
    slug: "quality-inspection",
    navLabel: "Quality & Inspections",
    title: "Quality Assurance & Inspection Checkpoints",
    h1: "Quality assurance and inspection checkpoints",
    eyebrow: "Product Sourcing · Quality Assurance",
    lead: "Define measurable defect criteria upfront and coordinate in-process and pre-shipment inspections with suppliers or independent third-party QC providers before balance payment.",
    photo: {
      src: "/images/services/sourcing-lighting-electronics.jpg",
      alt: "LED lighting fixtures and electronics hardware laid out next to a digital multimeter and technical notebook for inspection",
      caption: "Illustrative editorial photo — written acceptance criteria paired with independent third-party inspection when order size warrants it.",
      badge: "Illustrative editorial photo",
    },
    sections: [
      {
        heading: "Practical quality checkpoints from pre-production to pre-shipment",
        paragraphs: [
          "Quality assurance works when acceptable tolerances and critical/major/minor defects are written into the purchase specification before production starts — not debated after containers arrive.",
        ],
        bullets: [
          "Written QC checklist tied directly to your approved golden sample and packaging spec",
          "In-process production photo/video checkpoints to verify materials, colors, and assembly early",
          "Coordinating independent third-party pre-shipment AQL inspections (quoted separately by inspection agencies) prior to final balance release",
          "Verifying barcode scanability, carton drop-test readiness, packing counts, and shipping marks",
        ],
      },
      {
        heading: "Honest boundaries on quality & lab compliance",
        paragraphs: [
          "No sourcing coordinator can promise zero defects or replace accredited laboratory certification. Visual/functional QC checks production against your sample, while regulated products (toys, AC appliances, power banks, LED luminaires) require accredited third-party test reports.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can we arrange an independent on-site AQL inspection before final payment?",
        a: "Yes — coordinating an independent third-party pre-shipment inspection before releasing the final supplier balance is standard practice for bulk orders.",
      },
      {
        q: "Does pre-shipment QC replace EN71, CPC, UL, CE, or UN38.3 testing?",
        a: "No. Pre-shipment inspection verifies manufacturing consistency against your sample; regulated safety and transport certificates must come from accredited testing laboratories.",
      },
    ],
  },
  {
    slug: "customization-packaging",
    navLabel: "Customization & Packaging",
    title: "Customization, Packaging & Barcodes",
    h1: "Customization, packaging, labels, and barcodes",
    eyebrow: "Product Sourcing · Customization & Packaging",
    lead: "Coordinate logo application, retail color boxes, inserts, hangtags, and FNSKU/EAN barcodes — scoped honestly against each manufacturer's real MOQ and tooling thresholds.",
    photo: {
      src: "/images/services/sourcing-warehouse-packing.jpg",
      alt: "Clean export warehouse showing neatly sealed brown master shipping cartons on timber pallets and packing label station",
      caption: "Illustrative editorial photo — packaging proofs, barcodes, and export carton specs confirmed before bulk print runs.",
      badge: "Illustrative editorial photo",
    },
    sections: [
      {
        heading: "Matching branding depth to your order stage",
        paragraphs: [
          "Private-label customization depends directly on factory capability and order quantity. Early test orders often start with neutral stock units paired with branded inserts, hangtags, or outer barcode stickers, while larger volumes unlock custom retail color boxes, Pantone shell runs, or molded logos.",
        ],
        bullets: [
          "Light branding (where supported): laser engraving, silk-screen logos, hangtags, inserts, and FNSKU/EAN/UPC barcode labels",
          "Retail & e-commerce packaging: custom dieline color boxes, window boxes, instruction manuals, and drop-safe inner trays",
          "Export master cartons: corrugated board strength, moisture lining, country-of-origin marks, and clear shipping marks",
          "Written proof approval: artwork dielines and physical packaging proofs approved by you before printing",
        ],
      },
    ],
    faqs: [
      {
        q: "Can Ali Arshad Personal Studio design the packaging dielines and inserts too?",
        a: "Yes — because brand identity and graphic design sit inside the same studio, retail boxes, inserts, and label artwork can be prepared alongside sourcing coordination.",
      },
      {
        q: "What if our first order is below a factory's custom box MOQ?",
        a: "We flag that early and compare practical options — such as stock boxes with custom printed sleeves, stickers, or inserts — so you avoid over-ordering capital into packaging.",
      },
    ],
  },
  {
    slug: "order-fulfillment",
    navLabel: "Order & Packing",
    title: "Order, Production & Packing Coordination",
    h1: "Order, production, packing, and fulfillment prep",
    eyebrow: "Product Sourcing · Order & Fulfillment",
    lead: "Keep production milestones, export carton packing, barcode labels, commercial invoices, and packing lists aligned so shipments hand off cleanly to freight carriers.",
    photo: {
      src: "/images/services/sourcing-warehouse-packing.jpg",
      alt: "Export fulfillment warehouse with stacked master cartons on pallets and thermal shipping label station",
      caption: "Illustrative editorial photo — accurate packing lists and verified carton dimensions prevent avoidable dispatch delays.",
      badge: "Illustrative editorial photo",
    },
    sections: [
      {
        heading: "Preventing administrative bottlenecks between factory and port",
        paragraphs: [
          "Small documentation mismatches — inconsistent invoice totals, estimated instead of measured carton sizes, missing country-of-origin marks, or late packing lists — trigger customs holds and unnecessary demurrage or storage charges.",
        ],
        bullets: [
          "Structured production milestone check-ins and honest early flagging of schedule changes",
          "Confirming measured final carton count, L × W × H dimensions, gross/net weights, and total CBM",
          "Reviewing commercial invoice and packing-list alignment prior to forwarder handoff",
          "Coordinating handover to your nominated freight forwarder, express courier, or 3PL/FBA prep warehouse",
        ],
      },
    ],
    faqs: [
      {
        q: "Do you own warehouses or operate destination 3PL fulfillment?",
        a: "No. Coordination hands off cleanly to your chosen licensed freight forwarder, 3PL warehouse, Amazon FBA prep center, or own receiving address.",
      },
      {
        q: "Why measure final cartons before booking air or sea freight?",
        a: "Because carriers bill on the higher of actual weight or volumetric weight (CBM) — verified measurements prevent billing surprises.",
      },
    ],
  },
  {
    slug: "freight-incoterms",
    navLabel: "Freight & Incoterms",
    title: "Freight, Shipping & Incoterms (EXW to DDP)",
    h1: "Freight, shipping, and Incoterms explained honestly",
    eyebrow: "Product Sourcing · Freight & Incoterms",
    lead: "Understand EXW, FOB, CIF, DAP, and DDP accurately — evaluating delivery options where the supplier and qualified licensed logistics and customs providers can lawfully support them.",
    photo: {
      src: "/images/services/sourcing-freight-logistics.jpg",
      alt: "Twilight documentary photograph of intermodal shipping containers and air-freight cargo pallets at a modern logistics port terminal",
      caption: "Illustrative editorial photo — air express, air cargo, LCL, and FCL quotes coordinated with licensed logistics providers.",
      badge: "Illustrative editorial photo",
    },
    showIncoterms: true,
    showResponsibilitySplit: true,
    sections: [
      {
        heading: "Honest framing on DDP and licensed customs brokerage",
        paragraphs: [
          "Delivered Duty Paid (DDP) can simplify door-to-door delivery on certain lanes, but its legality, availability, and true cost depend strictly on the specific shipment, destination country, product regulations (such as lithium batteries, electronics, toys, or lighting), supplier capability, and qualified licensed logistics and customs providers.",
          "Ali Arshad Personal Studio is NOT a licensed customs broker or freight forwarder. I coordinate freight quote comparisons, carton CBM calculations, and landed-cost modeling while formal HS tariff rulings, customs clearance, and international carriage stay with licensed brokers and forwarders.",
        ],
        bullets: [
          "Air Express (Courier): fastest for samples and dense high-value cartons; billed on volumetric (÷5000) vs. actual weight",
          "Air Cargo: suited to time-sensitive mid-size shipments paired with destination customs clearance",
          "Sea Freight (LCL consolidation / 20ft & 40ft FCL): most cost-effective for bulky goods such as luggage, appliances, and lighting",
        ],
      },
    ],
    faqs: [
      {
        q: "Are you a licensed customs broker or freight forwarder?",
        a: "No. I coordinate sourcing, quote comparisons, packing readiness, and landed-cost modeling; formal HS classification, customs clearance, and freight carriage are handled by licensed customs brokers and freight forwarders.",
      },
      {
        q: "Can you evaluate DDP alongside FOB or DAP?",
        a: "Yes — where the supplier and qualified licensed logistics/customs providers can lawfully support DDP for your destination and goods, we compare it transparently against FOB and DAP.",
      },
    ],
  },
  {
    slug: "process-faq",
    navLabel: "Workflow, FAQ & Quote",
    title: "Sourcing Workflow, FAQ & Quote Request",
    h1: "Sourcing workflow, FAQ, and quote request",
    eyebrow: "Product Sourcing · Workflow & Quote",
    lead: "A clear seven-stage path from product brief to freight handoff — backed by a BBA in Supply Chain Management, 10+ years of sourcing experience, and customer sign-off at every spending gate.",
    photo: {
      src: "/images/services/sourcing-sample-inspection.jpg",
      alt: "Quality inspection specialist evaluating a suitcase sample with measurement tools and printed checklist",
      caption: "Illustrative editorial photo — every spending gate (samples, bulk PO, inspection, freight) requires written customer approval.",
      badge: "Illustrative editorial photo",
    },
    showResponsibilitySplit: true,
    sections: [
      {
        heading: "What to include in your sourcing inquiry",
        paragraphs: [
          "You do not need a 20-page engineering binder to begin. Sharing five clear basics lets us evaluate feasibility honestly and prepare a clean RFQ:",
        ],
        bullets: [
          "Product category, reference photo or link, key materials/dimensions, and required variants",
          "Destination country and sales channel (ecommerce, retail, hospitality/commercial project)",
          "Target order quantity or rough capital budget (to test MOQ feasibility upfront)",
          "Whether you want stock specifications or conditional private-label packaging/barcodes",
          "Target delivery window so we evaluate air vs. sea transit realistically",
        ],
      },
    ],
    faqs: [
      {
        q: "Who is my point of contact throughout the engagement?",
        a: "Ali Arshad directly — combining a BBA in Supply Chain Management and more than 10 years of stated sourcing experience with transparent written comparisons at every milestone.",
      },
      {
        q: "Can you pair product sourcing with a custom storefront, 3D visuals, or inventory tools?",
        a: "Yes — because ecommerce web development, brand packaging design, and inventory software sit inside the same studio, your product launch stays cohesive end to end.",
      },
    ],
  },
];

export function getSourcingSubpage(slug: string): SourcingSubpage | undefined {
  return SOURCING_SUBPAGES.find((p) => p.slug === slug);
}

export const SOURCING_OVERVIEW_FAQS: FaqItem[] = [
  {
    q: "What supply-chain background backs this service?",
    a: "A Bachelor of Business Administration (BBA) in Supply Chain Management paired with more than 10 years of stated hands-on sourcing experience across multi-SKU consumer and commercial categories.",
  },
  {
    q: "Which product categories have catalog-backed experience?",
    a: "Kitchen & Small Appliances (stand/hand mixers, blenders, food choppers, toasters), Bags & Hard-Shell Luggage, Mobile Accessories & Power (phone cases, power banks, PD chargers), Architectural & Outdoor LED Lighting, and Toys & Educational Play — plus scoped custom supplier research for Kitchenware & Household Goods.",
  },
  {
    q: "How do you approach pricing, MOQs, quality checks, and DDP shipping?",
    a: "We avoid absolute promises. Instead, we aim to obtain competitive quotes from multiple capable suppliers, compare MOQs and carton CBM transparently, coordinate agreed quality checks (including third-party AQL inspections when warranted), and evaluate EXW, FOB, CIF, DAP, or DDP options strictly where the supplier and licensed logistics/customs providers can support them.",
  },
  {
    q: "Are you a licensed customs broker, freight forwarder, or factory owner?",
    a: "No. Ali Arshad Personal Studio operates as an independent sourcing coordinator and analytical partner. Manufacturing stays with vetted OEM/ODM factories, lab compliance with accredited labs, and customs clearance/carriage with licensed brokers and forwarders.",
  },
];
