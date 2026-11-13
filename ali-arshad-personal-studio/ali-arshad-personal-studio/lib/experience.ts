/**
 * Experience timeline.
 *
 * Only publish what is verified. Fields left empty are simply not rendered:
 *   - `period`        e.g. "2023 — Present". Omit until dates are confirmed.
 *   - `organization`  Only set once naming permission is confirmed.
 *   - `title`         Use the exact job title once confirmed.
 *
 * TO VERIFY BEFORE LAUNCH (from earlier project content):
 *   Dynamic360, FBR and BB Solutions were mentioned as organisations Ali has
 *   worked with. Map each one to the correct entry below, confirm dates and
 *   titles, then fill in `organization` / `period` / `title`.
 */

export type ExperienceKind = "work" | "internship" | "education";

export type ExperienceEntry = {
  id: string;
  area: string;
  title?: string;
  organization?: string;
  period?: string;
  summary: string;
  highlights: string[];
  kind: ExperienceKind;
  /**
   * The discipline thread this entry belongs to, used to draw the narrative
   * from business through creative, software and automation.
   */
  thread: "business" | "creative" | "software" | "automation";
  /**
   * Slugs from lib/projects.ts that demonstrate this kind of work. These are
   * portfolio demonstrations, never deliverables for the employer — the page
   * labels them that way.
   */
  relatedSlugs?: string[];
};

export const THREADS = {
  business: { label: "Business", text: "Supply chain, sourcing and commercial judgement." },
  creative: { label: "Creative", text: "Brand, content, video, motion and 3D." },
  software: { label: "Software", text: "Websites, applications and the integrations between them." },
  automation: { label: "Automation", text: "AI agents and workflows that remove repetitive work." },
} as const;

export const EXPERIENCE: ExperienceEntry[] = [
  {
    id: "brand-management",
    area: "Brand Management",
    summary:
      "More than two years managing brand work for US-based brands — keeping content, campaigns and communication consistent and moving.",
    highlights: ["Brand and content management", "Social media and email marketing", "Campaign and advertising coordination"],
    kind: "work",
    thread: "creative",
    relatedSlugs: ["halcyon-brand-system"],
  },
  {
    id: "creative-production",
    area: "Creative Production & Video Editing",
    summary:
      "Producing visual content for brands: edited video, motion graphics, 3D visualization and graphic design.",
    highlights: ["Video editing and motion graphics", "Blender 3D and product visualization", "Social-first ad creative"],
    kind: "work",
    thread: "creative",
    relatedSlugs: ["blender-product-visualisation", "motion-production-pipeline"],
  },
  {
    id: "software-development",
    area: "Software Development & Product Work",
    summary:
      "Building websites, web applications and AI-powered business workflows across the frontend and backend.",
    highlights: ["Frontend and backend development", "APIs and integrations", "Automation with n8n and AI agents"],
    kind: "work",
    thread: "software",
    relatedSlugs: ["tessera-clayworks-storefront", "northwind-analytics-dashboard", "meridian-inventory-operations", "tideline-support-agent", "inbound-lead-qualification-workflow"],
  },
  {
    id: "sales-internship",
    area: "Sales Internship",
    summary: "Hands-on sales experience — working with prospects and supporting the path from first conversation to close.",
    highlights: ["Prospect communication", "Sales support"],
    kind: "internship",
    thread: "business",
  },
  {
    id: "analyst-internships",
    area: "Analyst & Business Internships",
    summary: "Analyst and business-oriented internships that built a habit of working from data and process.",
    highlights: ["Business analysis", "Reporting and research"],
    kind: "internship",
    thread: "business",
    relatedSlugs: ["northwind-analytics-dashboard"],
  },
  {
    id: "bba",
    area: "Education",
    title: "Bachelor of Business Administration",
    summary: "BBA with a specialization in Supply Chain Management.",
    highlights: ["Supply chain management", "Operations and procurement"],
    kind: "education",
    thread: "business",
    relatedSlugs: ["lantern-sourcing-platform", "meridian-inventory-operations"],
  },
];
