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

export type ExperienceEntry = {
  id: string;
  area: string;
  title?: string;
  organization?: string;
  period?: string;
  summary: string;
  highlights: string[];
  kind: "work" | "internship" | "education";
};

export const EXPERIENCE: ExperienceEntry[] = [
  {
    id: "brand-management",
    area: "Brand Management",
    summary:
      "More than two years managing brand work for US-based brands — keeping content, campaigns and communication consistent and moving.",
    highlights: ["Brand and content management", "Social media and email marketing", "Campaign and advertising coordination"],
    kind: "work",
  },
  {
    id: "creative-production",
    area: "Creative Production & Video Editing",
    summary:
      "Producing visual content for brands: edited video, motion graphics, 3D visualization and graphic design.",
    highlights: ["Video editing and motion graphics", "Blender 3D and product visualization", "Social-first ad creative"],
    kind: "work",
  },
  {
    id: "software-development",
    area: "Software Development & Product Work",
    summary:
      "Building websites, web applications and AI-powered business workflows across the frontend and backend.",
    highlights: ["Frontend and backend development", "APIs and integrations", "Automation with n8n and AI agents"],
    kind: "work",
  },
  {
    id: "sales-internship",
    area: "Sales Internship",
    summary: "Hands-on sales experience — working with prospects and supporting the path from first conversation to close.",
    highlights: ["Prospect communication", "Sales support"],
    kind: "internship",
  },
  {
    id: "analyst-internships",
    area: "Analyst & Business Internships",
    summary: "Analyst and business-oriented internships that built a habit of working from data and process.",
    highlights: ["Business analysis", "Reporting and research"],
    kind: "internship",
  },
  {
    id: "bba",
    area: "Education",
    title: "Bachelor of Business Administration",
    summary: "BBA with a specialization in Supply Chain Management.",
    highlights: ["Supply chain management", "Operations and procurement"],
    kind: "education",
  },
];
