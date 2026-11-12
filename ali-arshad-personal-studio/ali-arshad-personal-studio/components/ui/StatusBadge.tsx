import { STATUS_LABEL, type ProjectStatus } from "@/lib/projects";

/** Labels drafts and placeholders so nothing is mistaken for delivered client work. */
export function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "published") return null;
  return <span className={`badge badge--${status}`}>{STATUS_LABEL[status]}</span>;
}
