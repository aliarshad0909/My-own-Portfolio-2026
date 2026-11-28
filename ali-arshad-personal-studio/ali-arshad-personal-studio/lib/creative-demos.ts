/**
 * Studio-Created Creative Demonstrations & Visual Concepts.
 *
 * Truthfulness & attribution standard:
 * - Every piece below was authored under Ali Arshad Personal Studio to provide
 *   tangible visual proof for creative capabilities that previously had no
 *   dedicated visual gallery (Photoshop retouching/compositing, Illustrator
 *   vector artwork & identity, social media brand content direction, and
 *   digital collectible / NFT concepts).
 * - Every entry is explicitly badged as "Studio-Created Demonstration" or
 *   "Studio-Created Concept" — never presented as a paid client commission,
 *   client testimonial, or live commercial mint/drop.
 */

export type CreativeDemoCategory = "photoshop" | "illustrator" | "social-brand" | "nft-concept";

export type CreativeDemo = {
  id: string;
  category: CreativeDemoCategory;
  badge: "Studio-Created Demonstration" | "Studio-Created Concept";
  discipline: string;
  title: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
  width: number;
  height: number;
  tools: readonly string[];
  techniques: readonly string[];
  deliverables: string;
  serviceHref: string;
  serviceLabel: string;
  contactService: string;
  hasVectorOverlay?: boolean;
};

export const CREATIVE_DEMOS: readonly CreativeDemo[] = [
  {
    id: "photoshop-product-compositing",
    category: "photoshop",
    badge: "Studio-Created Demonstration",
    discipline: "Photoshop · Retouching & Compositing",
    title: "Dark-Studio Product Retouching & Atmospheric Composite",
    summary:
      "Commercial tabletop composite demonstrating multi-layer surface retouching, fluted glass specular control, floating basalt shadow grounding, and warm coral-amber rim-light grading.",
    imageSrc: "/images/demos/demo-photoshop-retouching.webp",
    imageAlt:
      "Studio-created Photoshop compositing demonstration featuring a matte black ceramic pour-over coffee carafe, fluted glass dripper, and brushed copper cup on a suspended dark basalt slab with rising steam",
    width: 1280,
    height: 714,
    tools: ["Adobe Photoshop", "Lighting & Color Grade", "Multi-Layer Compositing"],
    techniques: [
      "Clean material cleanup across matte ceramic, smoked glass, and brushed copper",
      "Controlled warm key/rim color harmony matching obsidian brand palettes",
      "Layered atmospheric steam and grounded tabletop reflection blending",
    ],
    deliverables: "Layered PSD source, print-ready CMYK/RGB masters & lightweight WebP hero crops",
    serviceHref: "/services/creative-production",
    serviceLabel: "Creative Production Hub",
    contactService: "Creative Production — Photoshop Retouching & Compositing",
  },
  {
    id: "illustrator-vector-identity",
    category: "illustrator",
    badge: "Studio-Created Demonstration",
    discipline: "Illustrator · Vector Artwork & Identity",
    title: "Swiss Modernist Editorial Illustration & Construction System",
    summary:
      "Precision geometric editorial artwork built around orbital drafting circles, disciplined obsidian-cream-coral color ratios, and clean vector geometry that scales cleanly from favicons to print.",
    imageSrc: "/images/demos/demo-illustrator-vector.webp",
    imageAlt:
      "Studio-created Illustrator vector artwork demonstration showing a geometric coastal lighthouse with coral light beam, stylized waves, and fine circular drafting lines on obsidian",
    width: 1280,
    height: 714,
    tools: ["Adobe Illustrator", "Vector Geometry", "SVG & Print Systems"],
    techniques: [
      "Modular circle-and-grid construction rules for balanced proportions",
      "Crisp high-contrast palette tokens aligned to dark and light surfaces",
      "Resolution-independent SVG, EPS, and PDF vector production exports",
    ],
    deliverables: "Editable AI/SVG masters, brand mark construction grid & color token spec",
    serviceHref: "/services/branding",
    serviceLabel: "Brand Identity Hub",
    contactService: "Brand Identity & Illustrator Vector Artwork",
    hasVectorOverlay: true,
  },
  {
    id: "social-brand-content-direction",
    category: "social-brand",
    badge: "Studio-Created Demonstration",
    discipline: "Social Media · Brand Content Systems",
    title: "Cohesive Launch-Grid Direction & Brand Material Palette",
    summary:
      "Overhead visual system demonstration aligning a 6-tile dark-editorial Instagram grid with physical color swatches, unbranded packaging tones, and consistent lighting rules.",
    imageSrc: "/images/demos/demo-social-brand-grid.webp",
    imageAlt:
      "Studio-created social media art direction demonstration showing an overhead dark slate flat-lay with a cohesive 3x2 editorial photography grid, obsidian-cream-coral-bronze swatch cards, minimal boxes, and a matte black camera lens",
    width: 1280,
    height: 714,
    tools: ["Content Direction", "Instagram Launch Grids", "Visual Templates"],
    techniques: [
      "Multi-post visual rhythm so a 9-to-12-tile profile grid reads as one brand",
      "Consistent color temperature across static posts, Story Highlights & Reels",
      "Reusable art-direction rules built for approval-gated monthly calendars",
    ],
    deliverables: "Launch-grid layout pack, reusable post/Story templates & Highlight cover set",
    serviceHref: "/services/social-media-management",
    serviceLabel: "Social Media Setup Hub",
    contactService: "Social Media Setup & Management",
  },
  {
    id: "nft-digital-collectible-concepts",
    category: "nft-concept",
    badge: "Studio-Created Concept",
    discipline: "Digital Collectibles · NFT Visual Concepts",
    title: "Sculpted Artifact Triptych — Collectible Series Art Direction",
    summary:
      "Self-initiated digital collectible visual concept exploring cohesive trait families (faceted obsidian prism, brushed titanium core, copper-veined ceramic torus) inside unified gallery capsules.",
    imageSrc: "/images/demos/demo-nft-collectibles.webp",
    imageAlt:
      "Studio-created digital collectible concept triptych displaying three floating dark glass gallery capsules containing a faceted obsidian-coral prism, brushed titanium sphere with warm amber core, and copper-veined matte ceramic torus",
    width: 1280,
    height: 714,
    tools: ["3D Artifact Direction", "Shader & Lighting Lookdev", "Collection Systems"],
    techniques: [
      "Unified capsule framing and plinth lighting for cohesive multi-item drops",
      "Distinct material families & rarity-ready visual differentiation without clutter",
      "Web-ready gallery renders (concept artwork only — no live mint or token claimed)",
    ],
    deliverables: "Collection art direction, lookdev stills, turntable specs & showcase gallery frames",
    serviceHref: "/services/creative-production",
    serviceLabel: "Creative & 3D Direction",
    contactService: "Creative Production — Digital Collectible / 3D Concept Direction",
  },
];

export function creativeDemosByCategories(categories?: readonly CreativeDemoCategory[]): CreativeDemo[] {
  if (!categories || categories.length === 0) return [...CREATIVE_DEMOS];
  return CREATIVE_DEMOS.filter((d) => categories.includes(d.category));
}
