/**
 * Expertise and tools. No proficiency percentages by design —
 * describe disciplines, tools and focus areas instead.
 */

export type Expertise = {
  discipline: string;
  description: string;
  tools: string[];
};

export const EXPERTISE: Expertise[] = [
  {
    discipline: "Creative Production",
    description: "3D visualization, video editing and motion for brand and product content.",
    tools: ["Blender", "Premiere Pro", "After Effects"],
  },
  {
    discipline: "Software Development",
    description: "Frontend and backend work for websites, dashboards and business apps.",
    tools: ["React", "Next.js", "Python", "PostgreSQL"],
  },
  {
    discipline: "AI Automation",
    description: "Agents and workflows that connect tools and remove repetitive work.",
    tools: ["n8n", "AI agents", "CRM integrations"],
  },
  {
    discipline: "Brand Management",
    description: "Brand, content and campaign management, including work for US brands.",
    tools: ["Social", "Email", "Content strategy"],
  },
  {
    discipline: "Business Operations",
    description: "Supply chain, sourcing and commercial thinking from a BBA background.",
    tools: ["Sourcing", "Procurement", "Logistics"],
  },
];

export type Tool = {
  name: string;
  /** Two-letter monogram used for the tile — consistent, no third-party logos. */
  mark: string;
  group: "Creative" | "Technical";
};

/** Only list tools Ali has verified he uses. */
export const TOOLS: Tool[] = [
  { name: "Blender", mark: "Bl", group: "Creative" },
  { name: "Photoshop", mark: "Ps", group: "Creative" },
  { name: "Illustrator", mark: "Ai", group: "Creative" },
  { name: "Premiere Pro", mark: "Pr", group: "Creative" },
  { name: "After Effects", mark: "Ae", group: "Creative" },
  { name: "React", mark: "Re", group: "Technical" },
  { name: "Next.js", mark: "Nx", group: "Technical" },
  { name: "Python", mark: "Py", group: "Technical" },
  { name: "PostgreSQL", mark: "Pg", group: "Technical" },
  { name: "n8n", mark: "n8", group: "Technical" },
  { name: "GitHub", mark: "Gh", group: "Technical" },
];
