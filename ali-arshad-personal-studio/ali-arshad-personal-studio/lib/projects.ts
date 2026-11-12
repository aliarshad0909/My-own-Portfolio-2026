/**
 * Central project records.
 * Add, edit or remove entries here — the homepage, /work, /work/[slug],
 * /case-studies and /case-studies/[slug] all read from this file.
 *
 * IMPORTANT: The three entries below use SAMPLE ARTWORK as design placeholders.
 * They are not client work. Replace them with verified projects, or keep
 * `status: "placeholder"` so the site labels them honestly.
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
 * published   — verified, approved for public display.
 * draft       — real project, write-up not finished (shown with a Draft label, not indexed).
 * placeholder — sample artwork only, never client work (labelled, not indexed).
 */
export type ProjectStatus = "published" | "draft" | "placeholder";

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectMedia =
  | ({ type: "image" } & ProjectImage)
  | { type: "video"; src: string; poster?: string; alt: string };

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
  /** Verified results only. Leave empty rather than estimating. */
  results?: string[];
};

export type Project = {
  slug: string;
  title: string;
  /** Only name a client with their permission. */
  client?: string;
  categories: ProjectCategory[];
  tags: string[];
  /** e.g. "2025". Omit when not confirmed. */
  year?: string;
  summary: string;
  /** Ali's role in one line. */
  role: string;
  /** What Ali personally contributed. */
  contribution: string[];
  status: ProjectStatus;
  /** Shown in "Selected Work" on the homepage (first three featured). */
  featured: boolean;
  cover: ProjectImage;
  /** Optional muted preview clip, e.g. /videos/project-slug.mp4 */
  previewVideo?: string;
  gallery: ProjectMedia[];
  /** Presence of this object lists the project under /case-studies. */
  caseStudy?: CaseStudy;
  /** Optional external link to the live project. */
  liveUrl?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "travel-platform-concept",
    title: "Travel Platform Concept",
    categories: ["Web & Software", "Branding & Marketing"],
    tags: ["Web design", "Landing page", "UI"],
    summary: "Sample layout showing how a travel booking website would be presented in the portfolio.",
    role: "Placeholder — replace with Ali's role on a real project",
    contribution: ["Layout preview only"],
    status: "placeholder",
    featured: true,
    cover: {
      src: "/images/projects/placeholder-travel.webp",
      alt: "Sample travel website hero with a mountain landscape — placeholder artwork",
      width: 327,
      height: 170,
    },
    gallery: [],
    caseStudy: {},
  },
  {
    slug: "fitness-app-concept",
    title: "Fitness App Concept",
    categories: ["Web & Software"],
    tags: ["Mobile app", "UI", "Dashboard"],
    summary: "Sample mobile app screens used to preview how product and app work will be displayed.",
    role: "Placeholder — replace with Ali's role on a real project",
    contribution: ["Layout preview only"],
    status: "placeholder",
    featured: true,
    cover: {
      src: "/images/projects/placeholder-fitness.webp",
      alt: "Sample fitness app screens on two phones — placeholder artwork",
      width: 316,
      height: 170,
    },
    gallery: [],
    caseStudy: {},
  },
  {
    slug: "interior-brand-concept",
    title: "Interior Brand Concept",
    categories: ["Branding & Marketing", "3D & Motion"],
    tags: ["E-commerce", "Brand", "Product visual"],
    summary: "Sample storefront and product visual used to preview brand and e-commerce work.",
    role: "Placeholder — replace with Ali's role on a real project",
    contribution: ["Layout preview only"],
    status: "placeholder",
    featured: true,
    cover: {
      src: "/images/projects/placeholder-interior.webp",
      alt: "Sample interior brand storefront with a lounge chair — placeholder artwork",
      width: 302,
      height: 170,
    },
    gallery: [],
    caseStudy: {},
  },
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);

export const featuredProjects = (count = 3) => PROJECTS.filter((p) => p.featured).slice(0, count);

export const caseStudies = () => PROJECTS.filter((p) => p.caseStudy !== undefined);

/** Projects that should be indexed by search engines. */
export const isIndexable = (p: Project) => p.status === "published";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  published: "Published",
  draft: "Draft",
  placeholder: "Placeholder",
};

export const STATUS_NOTE: Record<ProjectStatus, string> = {
  published: "",
  draft: "This case study is still being written. Details may change.",
  placeholder: "Sample artwork used as a design placeholder. This is not client work.",
};

/** Related projects: shared categories first, then anything else. */
export function relatedProjects(project: Project, count = 2): Project[] {
  const others = PROJECTS.filter((p) => p.slug !== project.slug);
  const score = (p: Project) => p.categories.filter((c) => project.categories.includes(c)).length;
  return [...others].sort((a, b) => score(b) - score(a)).slice(0, count);
}
