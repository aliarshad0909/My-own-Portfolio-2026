import Image from "next/image";
import Link from "next/link";
import { ArrowLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { PROJECTS, type Project } from "@/lib/projects";

/**
 * Alternating large project previews.
 *
 * The order is explicit so the strongest demonstration leads; the records
 * themselves come from lib/projects.ts, so status, type and imagery can never
 * drift from the project pages. No live-demo link is rendered, because no
 * project has a verified deployment yet — `liveUrl` is unset on all twelve.
 */
const FEATURED = [
  "tessera-clayworks-storefront",
  "northwind-analytics-dashboard",
  "tideline-support-agent",
  "meridian-inventory-operations",
  "lantern-sourcing-platform",
  "halcyon-brand-system",
];

/** First sentence of the case-study challenge, which is the one-line hook. */
function challengeLine(p: Project): string {
  const c = p.caseStudy?.challenge;
  if (!c) return p.summary;
  const end = c.indexOf(". ");
  return end === -1 ? c : `${c.slice(0, end)}.`;
}

export function FeaturedWork() {
  const projects = FEATURED.map((slug) => PROJECTS.find((p) => p.slug === slug)).filter((p): p is Project => p !== undefined);
  if (projects.length === 0) return null;
  const hasSample = projects.some((p) => p.usesSampleMedia);

  return (
    <section className="section section--surface" aria-labelledby="featured-work-title">
      <div className="container">
        <div className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow eyebrow--plain">What I&rsquo;ve built</p>
            <h2 className="section-title" id="featured-work-title">
              Selected work
            </h2>
          </div>
          <ArrowLink href="/work">View all {PROJECTS.length} projects</ArrowLink>
        </div>

        <div className="fw-list">
          {projects.map((p, i) => (
            <article key={p.slug} className={`fw ${i % 2 === 1 ? "fw--reverse" : ""} reveal`.trim()}>
              <Link href={`/work/${p.slug}`} className="fw__media" tabIndex={-1} aria-hidden="true">
                <Image
                  src={p.cover.src}
                  alt=""
                  width={p.cover.width}
                  height={p.cover.height}
                  sizes="(min-width: 1024px) 620px, 92vw"
                  className="fw__img"
                />
              </Link>

              <div className="fw__body">
                <p className="fw__index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div className="fw__badges">
                  <TypeBadge type={p.projectType} />
                  <StatusBadge status={p.status} />
                </div>
                <h3 className="fw__title">
                  <Link href={`/work/${p.slug}`}>{p.title}</Link>
                </h3>
                <p className="fw__cat">
                  {p.categories.join(" · ")}
                  {p.year ? ` · ${p.year}` : ""}
                </p>
                <p className="fw__challenge">{challengeLine(p)}</p>
                <ul className="fw__stack" aria-label="Key technology">
                  {p.technologies.slice(0, 3).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <span className="fw__go">
                  View project
                  <Icon name="arrow-up-right" size={16} />
                </span>
              </div>
            </article>
          ))}
        </div>

        <p className="fine-print fw__note">
          Every project above is an original concept built to demonstrate capability — the brands and data in them are fictional, and none is publicly
          deployed, so there are no live demo links.
          {hasSample ? " Cards marked as sample artwork are layout previews, not output from the project." : ""}
        </p>
      </div>
    </section>
  );
}
