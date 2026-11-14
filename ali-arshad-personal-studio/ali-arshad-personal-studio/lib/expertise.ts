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

export const TOOL_GROUPS = ["Creative", "Development", "Automation"] as const;

export type ToolGroup = (typeof TOOL_GROUPS)[number];

export type Tool = {
  name: string;
  /** Two-letter monogram used for the tile — consistent, no third-party logos. */
  mark: string;
  group: ToolGroup;
  /**
   * True when the tool has only been used inside a concept demonstration
   * rather than in delivered work. Shown as a qualifier so the list never
   * implies more depth than there is.
   */
  conceptOnly?: boolean;
};

/**
 * Only list tools Ali has verified he uses. Appearing in a concept
 * demonstration is not the same as professional depth — mark those
 * `conceptOnly` rather than listing them as straightforward capabilities.
 */
export const TOOLS: Tool[] = [
  { name: "Blender", mark: "Bl", group: "Creative" },
  { name: "Photoshop", mark: "Ps", group: "Creative" },
  { name: "Illustrator", mark: "Ai", group: "Creative" },
  { name: "Premiere Pro", mark: "Pr", group: "Creative" },
  { name: "After Effects", mark: "Ae", group: "Creative" },
  { name: "React", mark: "Re", group: "Development" },
  { name: "Next.js", mark: "Nx", group: "Development" },
  { name: "Python", mark: "Py", group: "Development" },
  { name: "PostgreSQL", mark: "Pg", group: "Development" },
  { name: "n8n", mark: "n8", group: "Automation" },
  { name: "AI agents", mark: "Ag", group: "Automation" },
  { name: "API integrations", mark: "Ap", group: "Automation" },
  { name: "TypeScript", mark: "Ts", group: "Development" },
  { name: "GitHub", mark: "Gh", group: "Development" },
];

/** Tools in a group, in the order they are declared. */
export const toolsInGroup = (group: ToolGroup): Tool[] => TOOLS.filter((t) => t.group === group);
