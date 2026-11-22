import Image from "next/image";
import Link from "next/link";
import { ArrowLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { PROJECTS, type Project } from "@/lib/projects";

/**
 * Restrained homepage selection of four additional demonstrations spanning
 * e-commerce, AI agents, workflow automation, and business dashboards.
 * PipelineOS and StockFlow are featured directly above in LiveProductDemos;
 * all 14 projects remain browsable at /work and /case-studies.
 */
const PRIORITY_SLUGS = [
  "tessera-clayworks-storefront",
  "tideline-support-agent",
  "inbound-lead-qualification-workflow",
  "northwind-analytics-dashboard",
] as const;

function shortHook(p: Project): string {
  const c = p.caseStudy?.challenge;
  if (!c) return p.summary;
  const end = c.indexOf(". ");
  return end === -1 ? c : `${c.slice(0, end)}.`;
}

function caseHref(p: Project): string {
  return p.caseStudy ? `/case-studies/${p.slug}` : `/work/${p.slug}`;
}

export function FeaturedWork() {
  const projects = PRIORITY_SLUGS.map((slug) => PROJECTS.find((p) => p.slug === slug)).filter(
    (p): p is Project => p !== undefined,
  );
  if (projects.length === 0) return null;

  const [lead, ...gridProjects] = projects;

  return (
    <section className="section section--surface" aria-labelledby="featured-work-title">
      <div className="container">
        <div className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow eyebrow--plain">Selected work</p>
            <h2 className="section-title" id="featured-work-title">
              More studio case studies
            </h2>
          </div>
          <ArrowLink href="/work">View all {PROJECTS.length} projects</ArrowLink>
        </div>

        {/* Lead spotlight card */}
        <article className="fw fw--lead reveal">
          <Link href={caseHref(lead)} className="fw__media" tabIndex={-1} aria-hidden="true">
            <Image
              src={lead.cover.src}
              alt=""
              width={lead.cover.width}
              height={lead.cover.height}
              sizes="(min-width: 1024px) 620px, 92vw"
              className="fw__img"
            />
          </Link>

          <div className="fw__body">
            <div className="fw__badges">
              <TypeBadge type={lead.projectType} />
              <StatusBadge status={lead.status} />
            </div>
            <h3 className="fw__title">
              <Link href={caseHref(lead)}>{lead.title}</Link>
            </h3>
            <p className="fw__cat">
              {lead.categories.join(" · ")}
              {lead.year ? ` · ${lead.year}` : ""}
            </p>
            <p className="fw__challenge">{shortHook(lead)}</p>
            <ul className="fw__stack" aria-label="Capabilities and stack">
              {lead.technologies.slice(0, 4).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <span className="fw__go">
              View Case Study
              <Icon name="arrow-up-right" size={16} />
            </span>
          </div>
        </article>

        {/* Three-project balanced studio grid */}
        <div className="fw-grid">
          {gridProjects.map((p) => (
            <article key={p.slug} className="fw-card reveal">
              <Link href={caseHref(p)} className="fw-card__media" tabIndex={-1} aria-hidden="true">
                <Image
                  src={p.cover.src}
                  alt=""
                  width={p.cover.width}
                  height={p.cover.height}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 46vw, 92vw"
                  className="fw-card__img"
                />
              </Link>

              <div className="fw-card__body">
                <div className="fw-card__top">
                  <span className="fw-card__cat">{p.categories[0]}</span>
                  <StatusBadge status={p.status} />
                </div>

                <h3 className="fw-card__title">
                  <Link href={caseHref(p)}>{p.title}</Link>
                </h3>

                <p className="fw-card__desc">{p.summary}</p>

                <ul className="tag-list fw-card__tags" aria-label="Key capabilities">
                  {p.tags.slice(0, 3).map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>

                <span className="fw-card__cta">
                  <span>View Case Study</span>
                  <Icon name="arrow-up-right" size={15} />
                </span>
              </div>
            </article>
          ))}
        </div>

        <p className="fine-print fw__note">
          Every project above is an original studio demonstration built to verify real architecture and execution: the brands and data are fictional,
          and none is presented as a paid client deployment.
        </p>
      </div>
    </section>
  );
}
