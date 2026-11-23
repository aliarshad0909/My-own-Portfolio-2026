/**
 * Central site configuration.
 * Everything here is safe to edit without touching page layouts.
 * Empty strings hide the related UI — never put placeholder contact details here.
 */

export type SocialLink = {
  label: string;
  /** Leave empty until the profile is live; empty links are not rendered. */
  url: string;
  icon: "linkedin" | "github" | "instagram" | "facebook" | "behance" | "dribbble" | "youtube" | "x";
};

export type FreelanceProfile = {
  id: "upwork" | "fiverr";
  label: string;
  ctaLabel: string;
  /** Empty string keeps the platform cleanly inactive until a verified URL is supplied. */
  url: string;
};

export const FREELANCE: Record<"upwork" | "fiverr", FreelanceProfile> = {
  upwork: {
    id: "upwork",
    label: "Upwork",
    ctaLabel: "Hire Me on Upwork",
    url: "https://www.upwork.com/freelancers/~011274422835620f07",
  },
  fiverr: {
    id: "fiverr",
    label: "Fiverr",
    ctaLabel: "Find Me on Fiverr",
    url: (process.env.NEXT_PUBLIC_FIVERR_URL ?? "").trim(),
  },
};

export const SITE = {
  name: "Ali Arshad",
  brandMarkText: "ALI ARSHAD",
  descriptor: "Personal Studio",
  positioning: "Independent Creative & Digital Studio",
  role: "Designer, Developer & Creative Technologist",
  tagline: "Creative thinking. Technical execution. Business understanding.",
  description:
    "Ali Arshad is an independent designer, developer and creative technologist. He builds custom web applications with Next.js, AI agents and n8n workflow automation, produces video editing, motion graphics and Blender 3D product visualization, and brings brand management and supply chain experience to every project.",
  /** Production URL, e.g. https://aliarshad.co — set NEXT_PUBLIC_SITE_URL. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, ""),
  /** Public contact email — set NEXT_PUBLIC_CONTACT_EMAIL. Hidden when empty. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  /**
   * Availability statement shown on /contact. Leave empty until verified,
   * e.g. "Taking on new projects from February".
   */
  availability: "",
  /** Verified social profiles; optional profiles remain hidden until configured. */
  socials: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/aliarshad09/", icon: "linkedin" },
    { label: "Instagram", url: "https://www.instagram.com/aliarshad.co/", icon: "instagram" },
    { label: "Facebook", url: "https://www.facebook.com/profile.php?id=61589134283009", icon: "facebook" },
    { label: "GitHub", url: (process.env.NEXT_PUBLIC_GITHUB_URL ?? "").trim(), icon: "github" },
  ] as SocialLink[],
};

export const activeSocials = (): SocialLink[] => SITE.socials.filter((s) => s.url.trim() !== "");

export type NavItem = { label: string; href: string };

/** Minimal primary header navigation — keeps focus on work, services and inquiry conversion. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Secondary quick links shown in the mobile drawer below the primary links. */
export const MOBILE_SECONDARY_ITEMS: NavItem[] = [
  { label: "Insights", href: "/insights" },
  { label: "Calculator Centre", href: "/tools" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Experience", href: "/experience" },
];

/** Core top-level pages included in the XML sitemap regardless of header nav trimming. */
export const CORE_SITEMAP_PAGES: string[] = [
  "/",
  "/work",
  "/products",
  "/case-studies",
  "/insights",
  "/services",
  "/experience",
  "/about",
  "/contact",
  "/privacy",
];

/**
 * Resolve the absolute base URL for metadata, canonicals, robots.txt, and sitemap.xml.
 * Normalizes apex `https://aliarshad.co` to `https://www.aliarshad.co` because the
 * live domain 308-redirects apex to `www`, preventing canonical/sitemap redirect loops.
 */
export function siteBaseUrl(): URL {
  const raw = SITE.url || (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL}` : "http://localhost:3000");
  const parsed = new URL(raw);
  if (parsed.hostname === "aliarshad.co") {
    parsed.hostname = "www.aliarshad.co";
  }
  return parsed;
}
