import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { caseStudies } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Case Studies",
  description: "In-depth case studies from Ali Arshad's studio: the problem, the approach, the process and what was delivered.",
  path: "/case-studies",
});

export default function CaseStudiesPage() {
  const studies = caseStudies();
  const hasUnpublished = studies.some((s) => s.status !== "published");

  return (
    <>
      <PageHero
        eyebrow="Case Studies"
        title={
          <>
            The thinking <span className="accent">behind the work</span>
          </>
        }
        lead="A closer look at selected projects — the problem, my role, the approach and what was delivered. Results are only included where they have been verified."
      />
      <section className="section section--flush-top" aria-label="Case studies">
        <div className="container">
          {hasUnpublished ? (
            <p className="notice notice--wide">
              Entries marked &ldquo;Placeholder&rdquo; or &ldquo;Draft&rdquo; are not finished case studies. Placeholders use sample artwork and are not client work.
            </p>
          ) : null}
          {studies.length > 0 ? (
            <ol className="case-list">
              {studies.map((s, i) => (
                <li key={s.slug} className="reveal">
                  <Link href={`/case-studies/${s.slug}`} className="case-row">
                    <span className="case-row__index" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="case-row__media">
                      <Image src={s.cover.src} alt="" fill sizes="(min-width: 768px) 280px, 100vw" />
                    </span>
                    <span className="case-row__body">
                      <span className="project-card__meta">
                        <span>{s.categories.join(" · ")}</span>
                        {s.year ? <span>{s.year}</span> : null}
                        <StatusBadge status={s.status} />
                      </span>
                      <span className="case-row__title">{s.title}</span>
                      <span className="case-row__summary">{s.summary}</span>
                    </span>
                    <Icon name="arrow-up-right" size={22} className="case-row__arrow" />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-state">
              <h2 className="empty-state__title">Case studies are on the way</h2>
              <p>Detailed write-ups are being prepared. In the meantime, the work page shows current projects.</p>
            </div>
          )}
        </div>
      </section>
      <ContactCTA standalone />
    </>
  );
}
