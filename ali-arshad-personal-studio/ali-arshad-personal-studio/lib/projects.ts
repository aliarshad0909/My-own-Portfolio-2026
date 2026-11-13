/**
 * Central project records.
 * Add, edit or remove entries here — the homepage, /work, /work/[slug],
 * /case-studies and /case-studies/[slug] all read from this file.
 *
 * Honesty rules baked into the model:
 *   - `projectType` always says how the work came about (own work, concept, or
 *     an adaptation of someone else's open-source project).
 *   - `status` says how finished it is. Only "Published" is indexed by search
 *     engines and listed in the sitemap.
 *   - `attribution` is required for every Open-Source Adaptation.
 *   - `usesSampleMedia` marks any card whose imagery is not real project work.
 */

export const PROJECT_CATEGORIES = [
  "Creative Production",
  "3D & Motion",
  "Branding & Marketing",
  "Web & Software",
  "AI Automation",
  "Business Solutions",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/**
 * Professional Work      — paid or employed work Ali genuinely contributed to.
 * Original Concept       — built from scratch by Ali; the scenario may be fictional, the software is real.
 * Open-Source Adaptation — built on someone else's licensed project; see `attribution`.
 */
export type ProjectType = "Professional Work" | "Original Concept" | "Open-Source Adaptation";

/**
 * Planned        — scoped but not started. Not indexed, not shown in the gallery.
 * In Development — being built. Not indexed.
 * Demo Ready     — builds, tested, and deployable or deployed. Not indexed until published.
 * Verified       — a real engagement confirmed with the client, including naming permission.
 * Published      — live, written up, and approved for public listing. Indexed.
 */
export type ProjectStatus = "Planned" | "In Development" | "Demo Ready" | "Verified" | "Published";

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectMedia =
  | ({ type: "image" } & ProjectImage)
  | { type: "video"; src: string; poster?: string; alt: string };

/** Required whenever `projectType` is "Open-Source Adaptation". */
export type Attribution = {
  /** Upstream project name, e.g. "Medusa". */
  project: string;
  /** Upstream repository or homepage. */
  url: string;
  /** SPDX identifier, e.g. "MIT", "Apache-2.0", "BSD-2-Clause". */
  license: string;
  licenseUrl: string;
  /** Who holds copyright upstream. */
  copyright: string;
  /** What the original provides versus what was changed here. */
  originalWork: string;
  modifications: string[];
};

export type CaseStudy = {
  /** Client or project background. */
  background?: string;
  /** Problem or challenge. */
  challenge?: string;
  /** Strategy and approach. */
  approach?: string;
  /** Production or development process — one entry per step. */
  process?: string[];
  /** What was delivered. */
  solution?: string;
  /**
   * Verified outcomes only. For demonstrations, describe capabilities that were
   * tested — never invent commercial metrics.
   */
  results?: string[];
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  /** Only name a client with their written permission. */
  client?: string;
  categories: ProjectCategory[];
  tags: string[];
  /** e.g. "2026". Omit when not confirmed. */
  year?: string;
  summary: string;
  projectType: ProjectType;
  status: ProjectStatus;
  /** True when the cover or gallery uses sample artwork rather than real work. */
  usesSampleMedia?: boolean;
  /** Ali's role in one line. */
  role: string;
  /** What Ali personally did — be specific and truthful. */
  contribution: string[];
  /** Languages, frameworks and tools actually used. */
  technologies: string[];
  /** Shown in "Selected Work" on the homepage. */
  featured: boolean;
  cover: ProjectImage;
  /** Optional muted preview clip, e.g. /videos/project-slug.mp4 */
  previewVideo?: string;
  gallery: ProjectMedia[];
  /** Live deployment, once one exists. */
  liveUrl?: string;
  /** Public source code, when sharing is appropriate. */
  sourceUrl?: string;
  attribution?: Attribution;
  /** Presence of this object lists the project under /case-studies. */
  caseStudy?: CaseStudy;
};

const COMMERCE: Project = {
  id: "p01",
  slug: "tessera-clayworks-storefront",
  title: "Tessera Clayworks — E-Commerce Storefront",
  categories: ["Web & Software", "Branding & Marketing"],
  tags: ["Storefront", "Cart & checkout", "Admin CRUD", "TypeScript", "Accessibility"],
  year: "2026",
  summary:
    "A complete demonstration storefront for a fictional ceramics studio: catalogue with working filters, product variants, cart, simulated checkout and a product admin that writes back to the shop.",
  projectType: "Original Concept",
  status: "Demo Ready",
  role: "Sole designer and developer",
  contribution: [
    "Designed the brand, layout and interface, separate from this portfolio's visual identity",
    "Built the catalogue, filtering, sorting and search",
    "Implemented the cart, promotions, shipping rules and tax estimate in integer cents",
    "Built the simulated checkout with client and server-grade validation and stock enforcement",
    "Built the product admin with create, edit and delete, validation and live preview",
    "Drew every product illustration in code as SVG — no stock photography",
    "Wrote 18 unit tests and a 38-check browser suite covering the shopping journeys",
  ],
  technologies: ["TypeScript", "React 19", "esbuild", "CSS", "Node.js test runner", "Playwright"],
  featured: true,
  cover: {
    src: "/images/projects/commerce/cover.webp",
    alt: "Tessera Clayworks storefront homepage with a vase, mug and bowl illustration",
    width: 1600,
    height: 900,
  },
  gallery: [
    { type: "image", src: "/images/projects/commerce/shop.webp", alt: "Shop page with category, glaze and price filters applied", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/product.webp", alt: "Product page showing glaze and size variants with stock state", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/cart.webp", alt: "Cart with quantity steppers, a promotion code applied and an order summary", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/checkout.webp", alt: "Checkout with delivery details, shipping options and a simulated payment notice", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/admin.webp", alt: "Product admin with an edit form, stock fields and a live illustration preview", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/order.webp", alt: "Order confirmation screen showing the demo order number and totals", width: 1600, height: 900 },
    { type: "image", src: "/images/projects/commerce/mobile.webp", alt: "The shop and product pages on a phone-sized screen", width: 1382, height: 1420 },
  ],
  caseStudy: {
    background:
      "Tessera Clayworks is a fictional small-batch ceramics studio invented for this project. The brief was to build the storefront such a business would actually need, so the work shows commerce mechanics rather than a styled template.",
    challenge:
      "Most portfolio storefronts are a grid of product photos with buttons that do nothing. The hard parts of commerce are the ones that are usually faked: filters that really narrow a catalogue, variants that change price and availability, a cart that cannot oversell, and totals that stay correct when a discount pushes an order back below the free-shipping threshold.",
    approach:
      "I separated the commerce rules from the interface. Pricing, cart, promotions, shipping, tax and checkout live in plain TypeScript modules with no React imports, so they can be unit tested directly and reused by a real backend later. Every amount is held in integer cents, so no total is subject to floating-point drift. The interface is a thin layer over those rules.",
    process: [
      "Modelled the domain: products, glaze and size variants, per-variant stock, cart lines, promotions and orders.",
      "Wrote the pricing and cart rules first, with 18 unit tests covering stock caps, discount interaction with the free-shipping threshold, and order creation.",
      "Designed a brand distinct from this portfolio — warm paper, forest green and terracotta — so the demo reads as its own business.",
      "Drew all 8 product shapes as parametric SVG, tinted at runtime by the selected glaze, so changing a variant visibly changes the product.",
      "Built the storefront: catalogue, filters, search, sort, product pages, wishlist, cart and a three-step checkout.",
      "Built the product admin so the catalogue is genuinely editable, with validation, confirm-before-delete and a live preview.",
      "Wrote a 38-check Playwright suite covering the shopping journeys end to end, then fixed the two real defects it surfaced.",
    ],
    solution:
      "A static, deployable storefront of roughly 2,400 lines of TypeScript. Filters, cart, checkout, order history and admin all work against the same in-browser state, so an order placed in the shop reduces the stock the admin reports. Nothing is faked at the interface layer: where a real store would call a payment provider, the demo says so plainly instead of showing a false success.",
    results: [
      "18 unit tests and 38 browser checks pass, covering catalogue, cart, checkout, admin CRUD and keyboard access.",
      "Verified no horizontal overflow at 360, 390, 768, 1024 and 1440 px, with interactive targets at least 40 px.",
      "Testing caught two genuine defects — a hidden-label rule that widened the page on mobile, and colour swatches that rendered blank — both fixed and now covered by tests.",
      "Production bundle is 240 KB of JavaScript and 14 KB of CSS, with no UI framework, icon library or image dependencies.",
    ],
  },
};

export const PROJECTS: Project[] = [COMMERCE];

/**
 * The remaining planned projects. These are deliberately NOT in PROJECTS:
 * nothing is shown as portfolio work until it is built and tested. /work lists
 * them as a pipeline so the roadmap is visible without inflating the count.
 */
export type PlannedProject = {
  title: string;
  category: ProjectCategory;
  projectType: ProjectType;
  note: string;
};

export const PLANNED: PlannedProject[] = [
  { title: "Business Analytics Dashboard", category: "Business Solutions", projectType: "Original Concept", note: "Revenue, sales and inventory analytics over labelled synthetic data, with real filtering and calculations." },
  { title: "AI Customer Support Agent", category: "AI Automation", projectType: "Original Concept", note: "Knowledge-base retrieval with human escalation. Needs an AI provider key, or an explicitly labelled offline mode." },
  { title: "Supply Chain Management Application", category: "Business Solutions", projectType: "Original Concept", note: "Inventory, purchase orders, receiving and stock movements with an accurate transaction history." },
  { title: "AI Sales Voice Agent", category: "AI Automation", projectType: "Original Concept", note: "Browser-based voice demo. Telephony would need a provider account and consent safeguards." },
  { title: "n8n Lead Automation", category: "AI Automation", projectType: "Original Concept", note: "Importable workflow JSON with error handling and duplicate detection. No credentials in the export." },
  { title: "China Sourcing & Procurement Platform", category: "Business Solutions", projectType: "Original Concept", note: "Supplier comparison, quotations and shipping milestones over mock supplier data." },
  { title: "Website Security Monitoring Dashboard", category: "Web & Software", projectType: "Original Concept", note: "Defensive checks against approved targets only, with real and simulated results clearly separated." },
  { title: "3D Product Visualization Showcase", category: "3D & Motion", projectType: "Professional Work", note: "Awaiting Ali's own Blender renders. Scene specifications prepared; rendering not yet done." },
  { title: "Motion Graphics & Video Production", category: "Creative Production", projectType: "Professional Work", note: "Awaiting Ali's original footage and finished edits. Page structure and media slots prepared." },
  { title: "Brand Identity & Marketing Campaign", category: "Branding & Marketing", projectType: "Original Concept", note: "Identity system, templates and campaign creatives for an explicitly fictional brand." },
  { title: "Blockchain Explorer", category: "Web & Software", projectType: "Original Concept", note: "Read-only testnet explorer with wallet connection. No real-money transactions." },
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);

export const featuredProjects = (count = 3) => PROJECTS.filter((p) => p.featured).slice(0, count);

export const caseStudies = () => PROJECTS.filter((p) => p.caseStudy !== undefined);

/** Only fully published work is indexed by search engines and listed in the sitemap. */
export const isIndexable = (p: Project) => p.status === "Published";

/** Statuses that are safe to show in the public gallery. */
export const isLive = (p: Project) => p.status === "Demo Ready" || p.status === "Verified" || p.status === "Published";

export const STATUS_NOTE: Record<ProjectStatus, string> = {
  Planned: "This project is scoped but not built yet.",
  "In Development": "This project is being built. Details may change.",
  "Demo Ready": "This is a working demonstration, not a client engagement. The brand and data are fictional.",
  Verified: "This was a real engagement, confirmed with the client.",
  Published: "",
};

/** Related projects: shared categories first, then anything else. */
export function relatedProjects(project: Project, count = 2): Project[] {
  const others = PROJECTS.filter((p) => p.slug !== project.slug);
  const score = (p: Project) => p.categories.filter((c) => project.categories.includes(c)).length;
  return [...others].sort((a, b) => score(b) - score(a)).slice(0, count);
}
