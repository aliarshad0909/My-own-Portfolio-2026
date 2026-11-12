import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProjectMedia } from "@/components/work/ProjectMedia";
import type { Project } from "@/lib/projects";

type Props = {
  project: Project;
  /** "detail" links to /work/[slug]; "case-study" links to /case-studies/[slug]. */
  linkTo?: "detail" | "case-study";
  showRole?: boolean;
  sizes?: string;
  headingLevel?: "h2" | "h3";
};

export function ProjectCard({
  project,
  linkTo = "detail",
  showRole = false,
  sizes = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw",
  headingLevel: Heading = "h3",
}: Props) {
  const href = linkTo === "case-study" ? `/case-studies/${project.slug}` : `/work/${project.slug}`;
  return (
    <article className="project-card">
      <Link href={href} className="project-card__link" aria-label={`${project.title} — view project`}>
        <ProjectMedia project={project} sizes={sizes} />
        <div className="project-card__body">
          <div className="project-card__meta">
            <span>{project.categories[0]}</span>
            {project.year ? <span>{project.year}</span> : null}
            <StatusBadge status={project.status} />
          </div>
          <div className="project-card__row">
            <Heading className="project-card__title">{project.title}</Heading>
            <Icon name="arrow-up-right" size={18} className="project-card__arrow" />
          </div>
          <p className="project-card__summary">{project.summary}</p>
          {showRole && project.status !== "placeholder" ? <p className="project-card__role">Role: {project.role}</p> : null}
          {project.tags.length > 0 ? (
            <ul className="tag-list" aria-label="Tags">
              {project.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
