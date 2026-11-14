import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import type { Project } from "@/lib/projects";

/**
 * The visual half of a service section.
 *
 * Shows covers from the projects that actually demonstrate the service, taken
 * straight from the project records — there is no second list of images to
 * keep in step. Where a service has no demonstration with real imagery yet,
 * `PendingMedia` says so instead of borrowing a screenshot from elsewhere.
 */

export function ServiceShowcase({ projects, serviceTitle }: { projects: Project[]; serviceTitle: string }) {
  const [lead, ...rest] = projects;
  if (!lead) return null;

  return (
    <div className="showcase">
      <Link href={`/work/${lead.slug}`} className="showcase__lead" aria-label={`${lead.title} — view project`}>
        <Image
          src={lead.cover.src}
          alt={lead.cover.alt}
          width={lead.cover.width}
          height={lead.cover.height}
          sizes="(min-width: 1024px) 560px, 92vw"
          className="showcase__img"
        />
        <span className="showcase__overlay">
          <span className="showcase__name">{lead.title}</span>
          <Icon name="arrow-up-right" size={18} />
        </span>
      </Link>

      {rest.length > 0 ? (
        <ul className="showcase__row">
          {rest.slice(0, 2).map((p) => (
            <li key={p.slug}>
              <Link href={`/work/${p.slug}`} className="showcase__thumb" aria-label={`${p.title} — view project`}>
                <Image src={p.cover.src} alt={p.cover.alt} width={p.cover.width} height={p.cover.height} sizes="(min-width: 1024px) 270px, 46vw" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="showcase__note">
        <Icon name="alert" size={15} />
        <span>
          Screenshots from working demonstrations built to show {serviceTitle.toLowerCase()} capability. Their brands and data are fictional, and none is
          publicly deployed.
        </span>
      </p>
    </div>
  );
}

/**
 * Used where a service has no publishable imagery yet. It names what is
 * missing rather than filling the space with a stock photograph or a
 * screenshot from an unrelated project.
 */
export function PendingMedia({ heading, lines }: { heading: string; lines: string[] }) {
  return (
    <div className="pending" role="note">
      <div className="pending__frame" aria-hidden="true">
        <Icon name="clapperboard" size={30} />
      </div>
      <h3 className="pending__title">{heading}</h3>
      <ul className="pending__list">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

/** Compact list of the projects behind a service, with their real status. */
export function RelatedProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;
  return (
    <ul className="related-mini">
      {projects.map((p) => (
        <li key={p.slug}>
          <Link href={p.caseStudy ? `/case-studies/${p.slug}` : `/work/${p.slug}`} className="related-mini__link">
            <span className="related-mini__name">{p.title}</span>
            <span className="related-mini__badges">
              <TypeBadge type={p.projectType} />
              <StatusBadge status={p.status} />
            </span>
            <Icon name="arrow-up-right" size={16} className="related-mini__arrow" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
