import type { ProjectStatus, ProjectType } from "@/lib/projects";

/** Says how finished a project is. Hidden once a project is fully published. */
export function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "Published") return null;
  const tone = status === "Verified" ? "verified" : status === "Demo Ready" ? "demo" : "draft";
  return <span className={`badge badge--${tone}`}>{status}</span>;
}

/** Says how the work came about, so adaptations are never mistaken for original builds. */
export function TypeBadge({ type }: { type: ProjectType }) {
  const tone = type === "Professional Work" ? "pro" : type === "Open-Source Adaptation" ? "adapted" : "concept";
  return <span className={`badge badge--${tone}`}>{type}</span>;
}
