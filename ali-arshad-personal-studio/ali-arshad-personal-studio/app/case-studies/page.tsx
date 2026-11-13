import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { caseStudies, type Project } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";
import { servicesForProject } from "@/lib/services";

export const metadata: Metadata = pageMetadata({
  title: "Case Studies",
  description:
    "How ideas became working products, creative systems and practical solutions — the challenge, the approach, the engineering decisions and what was verified, across twelve projects.",
  path: "/case-studies",
});

/**
 * The strongest demonstrations lead the page. Order is explicit rather than
 * sorted by status, so the sequence is an editorial judgement that can be
 * changed here without touching the project records.
 */
const FEATURED_ORDER = [
  "tessera-clayworks-storefront",
  "ledgerlight-block-explorer",
  "sentryline-security-posture",
  "halcyon-brand-system",
  "meridian-inventory-operations",
  "northwind-analytics-dashboard",
];

function orderStudies(studies: Project[]): { featured: Project[]; rest: Project[] } {
  const bySlug = new Map(studies.map((s) => [s.slug, s]));
  const featured = FEATURED_ORDER.map((slug) => bySlug.get(slug)).filter((p): p is Project => p !== undefined);
  const featuredSlugs = new Set(featured.map((p) => p.slug));
  return { featured, rest: studies.filter((s) => !featuredSlugs.has(s.slug)) };
}

/** The one-sentence challenge, trimmed to its first sentence for the card. */
function challengeLine(project: Project): string {
  const challenge = project.caseStudy?.challenge;
  if (!challenge) return project.summary;
  const end = challenge.indexOf(". ");
  return end === -1 ? challenge : `${challenge.slice(0, end)}.`;
}

function CaseCard({ project, index, size }: { project: Project; index: number; size: "lead" | "standard" }) {
  const services = servicesForProject(project.slug);
  return (
    <article className={`case-card case-card--${size} reveal`}>
      <Link href={`/case-studies/${project.slug}`} className="case-card__media" tabIndex={-1} aria-hidden="true">
        <Image
          src={project.cover.src}
          alt=""
          width={project.cover.width}
          height={project.cover.height}
          sizes={size === "lead" ? "(min-width: 1024px) 640px, 92vw" : "(min-width: 1024px) 420px, 92vw"}
        />
      </Link>

      <div className="case-card__body">
        <p className="case-card__index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </p>
        <div className="case-card__meta">
          <TypeBadge type={project.projectType} />
          <StatusBadge status={project.status} />
        </div>

        <h3 className="case-card__title">
          <Link href={`/case-studies/${project.slug}`}>{project.title}</Link>
        </h3>

        <p className="case-card__cat">
          {project.categories.join(" · ")}
          {project.year ? ` · ${project.year}` : ""}
        </p>

        <p className="case-card__challenge">{challengeLine(project)}</p>

        {project.tags.length > 0 ? (
          <ul className="case-card__tags" aria-label="Key capabilities">
            {project.tags.slice(0, size === "lead" ? 5 : 3).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : null}

        <p className="case-card__stack">
          <span className="label">Built with</span>
          {project.technologies.slice(0, 4).join(", ")}
        </p>

        <div className="case-card__foot">
          <span className="case-card__read">
            Read the case study
            <Icon name="arrow-up-right" size={16} />
          </span>
          {services.length > 0 ? (
            <Link href={`/services#${services[0].id}`} className="case-card__service">
              {services[0].shortTitle}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function CaseStudiesPage() {
  const studies = caseStudies();
  const { featured, rest } = orderStudies(studies);
  const hasDemos = studies.some((s) => s.status === "Demo Ready" || s.status === "In Development");

  return (
    <>
      <PageHero
        eyebrow="Case Studies"
        title={
          <>
            The thinking <span className="accent">behind the work</span>
          </>
        }
        lead="An inside look at how ideas become working products, creative systems and practical solutions — from the initial challenge to the final implementation, including the decisions that turned out to be wrong."
      />

      <section className="section section--flush-top" aria-labelledby="featured-title">
        <div className="container">
          {hasDemos ? (
            <p className="notice notice--wide">
              <Icon name="alert" size={18} />
              <span>
                Entries marked &ldquo;Demo Ready&rdquo; are working demonstrations built to show capability, not client engagements. Their brands and data
                are fictional, and none is publicly deployed. Results sections list tested behaviour, never commercial outcomes.
              </span>
            </p>
          ) : null}

          {studies.length === 0 ? (
            <div className="empty-state">
              <h2 className="empty-state__title">Case studies are on the way</h2>
              <p>Detailed write-ups are being prepared. In the meantime, the work page shows current projects.</p>
            </div>
          ) : (
            <>
              <h2 className="visually-hidden" id="featured-title">
                Selected case studies
              </h2>
              <div className="case-grid">
                {featured.map((p, i) => (
                  <CaseCard key={p.slug} project={p} index={i} size={i === 0 ? "lead" : "standard"} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {rest.length > 0 ? (
        <section className="section section--surface" aria-labelledby="more-title">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow eyebrow--plain">Also written up</p>
              <h2 className="section-title" id="more-title">
                The rest of the collection
              </h2>
              <p className="section-sub">
                Same depth, different disciplines — automation, voice, sourcing, 3D and production tooling. Two of these are in development rather than
                demo ready, and say so.
              </p>
            </div>
            <div className="case-grid case-grid--rest">
              {rest.map((p, i) => (
                <CaseCard key={p.slug} project={p} index={featured.length + i} size="standard" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ContactCTA
        standalone
        title="Want this kind of thinking on your project?"
        text="Every write-up above started as a problem someone had. Tell me yours and I'll give you an honest read on the approach."
      />
    </>
  );
}
