/**
 * Central site configuration.
 * Everything here is safe to edit without touching page layouts.
 * Empty strings hide the related UI — never put placeholder contact details here.
 */

export type SocialLink = {
  label: string;
  /** Leave empty until the profile is live; empty links are not rendered. */
  url: string;
  icon: "linkedin" | "github" | "instagram" | "behance" | "dribbble" | "youtube" | "x";
};

export const SITE = {
  name: "Ali Arshad",
  descriptor: "Personal Studio",
  positioning: "Independent Creative & Digital Studio",
  role: "Designer, Developer & Creative Technologist",
  tagline: "Creative thinking. Technical execution. Business understanding.",
  description:
    "Ali Arshad is an independent designer, developer and creative technologist combining creative production, software development, AI automation and business strategy for brands worldwide.",
  /** Production URL, e.g. https://aliarshad.studio — set NEXT_PUBLIC_SITE_URL. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, ""),
  /** Public contact email — set NEXT_PUBLIC_CONTACT_EMAIL. Hidden when empty. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  /**
   * Availability statement shown on /contact. Leave empty until verified,
   * e.g. "Taking on new projects from February".
   */
  availability: "",
  /** Add URLs once profiles are live. Empty URLs are filtered out everywhere. */
  socials: [
    { label: "LinkedIn", url: "", icon: "linkedin" },
    { label: "GitHub", url: "", icon: "github" },
    { label: "Instagram", url: "", icon: "instagram" },
    { label: "Behance", url: "", icon: "behance" },
  ] as SocialLink[],
};

export const activeSocials = (): SocialLink[] => SITE.socials.filter((s) => s.url.trim() !== "");

export type NavItem = { label: string; href: string };

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Experience", href: "/experience" },
  { label: "Contact", href: "/contact" },
];

/** Resolve the absolute base URL for metadata. Falls back to Vercel's URL, then localhost. */
export function siteBaseUrl(): URL {
  if (SITE.url) return new URL(SITE.url);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}
