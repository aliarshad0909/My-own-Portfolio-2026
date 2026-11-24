import type { Project, ProjectCategory } from "@/lib/projects";
import { SERVICES } from "@/lib/services";

export type CategoryFilter = "All" | ProjectCategory;

export type AvailabilityFilter =
  | "all"
  | "live-demo"
  | "locally-tested"
  | "prototype"
  | "concept"
  | "in-development";

export type StackFilterId =
  | "all"
  | "nextjs"
  | "postgres"
  | "automation-ai"
  | "mobile"
  | "media-3d"
  | "security-web3";

export type StackFilterDef = {
  id: StackFilterId;
  label: string;
  match: (project: Project) => boolean;
};

/**
 * Real technology-stack groupings backed strictly by the `technologies` and
 * `tags` actually declared on `PROJECTS` in `lib/projects.ts`.
 */
export const STACK_FILTERS: StackFilterDef[] = [
  { id: "all", label: "All stacks", match: () => true },
  {
    id: "nextjs",
    label: "Next.js & React",
    match: (p) => p.technologies.some((t) => /next\.js|react 19/i.test(t)),
  },
  {
    id: "postgres",
    label: "PostgreSQL & Drizzle",
    match: (p) => p.technologies.some((t) => /postgres|drizzle/i.test(t)),
  },
  {
    id: "automation-ai",
    label: "n8n, Speech & Retrieval",
    match: (p) =>
      p.technologies.some((t) => /n8n|web speech/i.test(t)) ||
      p.tags.some((t) => /bm25|retrieval|workflow automation/i.test(t)),
  },
  {
    id: "mobile",
    label: "React Native & Expo",
    match: (p) => p.technologies.some((t) => /react native|expo/i.test(t)),
  },
  {
    id: "media-3d",
    label: "Blender & ffmpeg",
    match: (p) => p.technologies.some((t) => /blender|ffmpeg|python/i.test(t)),
  },
  {
    id: "security-web3",
    label: "Security & EVM",
    match: (p) => p.technologies.some((t) => /asn\.1|json-rpc|eip-1193/i.test(t)),
  },
];

export const AVAILABILITY_OPTIONS: { id: AvailabilityFilter; label: string }[] = [
  { id: "all", label: "All 80 showcases" },
  { id: "live-demo", label: "Live public sandboxes" },
  { id: "locally-tested", label: "Locally tested demos" },
  { id: "prototype", label: "Built repo prototypes" },
  { id: "concept", label: "Concepts & sample scenarios" },
  { id: "in-development", label: "In development" },
];

export type ProjectFilterCriteria = {
  category: CategoryFilter;
  serviceId: string | null;
  availability: AvailabilityFilter;
  stackId: StackFilterId;
  query: string;
};

export function matchesAvailability(project: Project, availability: AvailabilityFilter): boolean {
  if (availability === "all") return true;
  if (availability === "live-demo") return Boolean(project.liveUrl && project.liveUrl.trim() !== "");
  if (availability === "locally-tested") return project.status === "Demo Ready" && !project.liveUrl;
  if (availability === "prototype") return project.status === "Prototype";
  if (availability === "concept") return project.status === "Concept" || project.status === "Sample Scenario";
  if (availability === "in-development") return project.status === "In Development";
  return true;
}

export function filterProjects(projects: Project[], criteria: ProjectFilterCriteria): Project[] {
  const service = criteria.serviceId ? SERVICES.find((s) => s.id === criteria.serviceId) : undefined;
  const stack = STACK_FILTERS.find((s) => s.id === criteria.stackId) ?? STACK_FILTERS[0];
  const q = criteria.query.trim().toLowerCase();

  return projects.filter((p) => {
    if (service && !service.projectSlugs.includes(p.slug)) return false;
    if (criteria.category !== "All" && !p.categories.includes(criteria.category)) return false;
    if (!matchesAvailability(p, criteria.availability)) return false;
    if (!stack.match(p)) return false;
    if (q) {
      const haystack = [
        p.title,
        p.summary,
        p.role,
        p.projectType,
        p.status,
        ...p.categories,
        ...p.tags,
        ...p.technologies,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
