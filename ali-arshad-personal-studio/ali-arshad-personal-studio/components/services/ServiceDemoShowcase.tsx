import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { PendingMedia } from "@/components/services/ServiceShowcase";
import { evidenceTierOf, type EvidenceTier } from "@/lib/seo/evidence";
import type { Project } from "@/lib/projects";

const TIER_LABEL: Record<EvidenceTier, string> = {
  "not-built": "In development (no finished media)",
  "locally-tested-demo": "Locally tested demonstration · not publicly deployed",
  "publicly-deployed-demo": "Publicly deployed demonstration",
  "verified-professional-work": "Verified professional engagement",
  "verified-client-outcome": "Verified client outcome",
};

type Props = {
  projects: Project[];
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** Optional multi-screen gallery showcase for a lead project (e.g. storefront or brand system). */
  showLeadGallery?: boolean;
  /** Show an honest PendingMedia panel alongside live pipeline projects (used for Creative Production). */
  pendingMedia?: { heading: string; lines: string[] };
};

/**
 * Genuine demonstration-build showcase for service hubs and specialization pages.
 *
 * Uses only real screenshots and diagrams from lib/projects.ts, keeps fictional
 * demonstration framing explicit, and links to both the case study and work record.
 */
export function ServiceDemoShowcase({
  projects,
  eyebrow = "Substantiated capability",
  title = "Working demonstration builds",
  lead = "Each project below is a locally tested build under a fictional brand, labelled openly as a demonstration rather than a publicly deployed site or client engagement.",
  showLeadGallery = false,
  pendingMedia,
}: Props) {
  if (projects.length === 0 && !pendingMedia) return null;

  const leadProject = projects[0];
  const leadGallery =
    showLeadGallery && leadProject
      ? leadProject.gallery.filter((m): m is Extract<Project["gallery"][number], { type: "image" }> => m.type === "image").slice(0, 4)
      : [];

  return (
    <div className="demo-showcase">
      <div className="section-head">
        <p className="eyebrow eyebrow--plain">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        <p className="section-sub">{lead}</p>
      </div>

      <div className={`demo-grid ${projects.length === 1 && !pendingMedia ? "demo-grid--single" : ""}`.trim()}>
        {projects.map((p) => {
          const isSvg = p.cover.src.endsWith(".svg");
          const showRealMedia = !p.usesSampleMedia;
          return (
            <article key={p.slug} className="demo-card">
              {showRealMedia ? (
                <Link
                  href={p.caseStudy ? `/case-studies/${p.slug}` : `/work/${p.slug}`}
                  className={`demo-card__media ${isSvg ? "demo-card__media--diagram" : ""}`.trim()}
                  aria-label={`${p.title}, inspect demonstration`}
                >
                  <Image
                    src={p.cover.src}
                    alt={p.cover.alt}
                    width={p.cover.width}
                    height={p.cover.height}
                    sizes="(min-width: 1024px) 580px, 94vw"
                  />
                </Link>
              ) : null}

              <div className="demo-card__body">
                <div className="demo-card__badges">
                  <TypeBadge type={p.projectType} />
                  <StatusBadge status={p.status} />
                </div>
                <p className="fine-print">{TIER_LABEL[evidenceTierOf(p)]}</p>
                <h3 className="demo-card__title">
                  <Link href={p.caseStudy ? `/case-studies/${p.slug}` : `/work/${p.slug}`}>{p.title}</Link>
                </h3>
                <p className="demo-card__summary">{p.summary}</p>

                {p.caseStudy?.results && p.caseStudy.results.length > 0 ? (
                  <p className="demo-card__verified">
                    <Icon name="check" size={15} />
                    <span>{p.caseStudy.results[0].replace(/\*\*/g, "")}</span>
                  </p>
                ) : null}

                <ul className="tag-list" aria-label="Technologies used">
                  {p.technologies.slice(0, 5).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>

                <div className="demo-card__actions">
                  {p.caseStudy ? (
                    <Link href={`/case-studies/${p.slug}`} className="arrow-link">
                      <span>Read case study</span>
                      <Icon name="arrow-up-right" size={16} />
                    </Link>
                  ) : null}
                  <Link href={`/work/${p.slug}`} className="demo-card__secondary">
                    Project record
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {pendingMedia ? <PendingMedia heading={pendingMedia.heading} lines={pendingMedia.lines} /> : null}
      </div>

      {leadGallery.length > 0 ? (
        <div className="demo-strip" aria-label={`Screens from ${leadProject.title}`}>
          <div className="demo-strip__head">
            <span className="label">Inside the demonstration: {leadProject.title}</span>
            <Link href={`/case-studies/${leadProject.slug}`} className="demo-card__secondary">
              Full technical write-up
            </Link>
          </div>
          <div className="demo-strip__grid">
            {leadGallery.map((item) => (
              <figure key={item.src} className="demo-strip__item">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(min-width: 1024px) 280px, 46vw"
                />
                <figcaption>{item.alt}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

