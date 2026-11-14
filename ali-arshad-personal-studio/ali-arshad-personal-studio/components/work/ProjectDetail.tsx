import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ArrowLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { MediaGallery } from "@/components/work/MediaGallery";
import { ProjectCard } from "@/components/work/ProjectCard";
import { STATUS_NOTE, caseStudies, relatedProjects, type Project } from "@/lib/projects";
import { servicesForProject } from "@/lib/services";

type Props = { project: Project; variant: "project" | "case-study" };

/** Previous and next entries in the case-study order, wrapping at the ends. */
function neighbours(slug: string) {
  const all = caseStudies();
  const i = all.findIndex((p) => p.slug === slug);
  if (i === -1 || all.length < 2) return { prev: undefined, next: undefined };
  return {
    prev: all[(i - 1 + all.length) % all.length],
    next: all[(i + 1) % all.length],
  };
}

/**
 * Shared layout for /work/[slug] and /case-studies/[slug].
 * Sections without content are skipped, so a case study can grow over time.
 * Results are only shown when `caseStudy.results` contains verified entries.
 */
export function ProjectDetail({ project, variant }: Props) {
  const cs = project.caseStudy;
  const isCaseStudy = variant === "case-study";
  const related = relatedProjects(project, 2);
  const backHref = isCaseStudy ? "/case-studies" : "/work";
  const statusNote = STATUS_NOTE[project.status];
  const services = servicesForProject(project.slug);
  const { prev, next } = isCaseStudy ? neighbours(project.slug) : { prev: undefined, next: undefined };

  return (
    <>
      <article className="detail">
        <header className="page-hero">
          <div className="container enter">
            <Link href={backHref} className="back-link">
              <Icon name="arrow-right" size={16} className="flip" />
              <span>{isCaseStudy ? "All case studies" : "All work"}</span>
            </Link>
            <div className="detail__meta">
              <span className="eyebrow eyebrow--plain">{isCaseStudy ? "Case study" : "Project"}</span>
              <TypeBadge type={project.projectType} />
              <StatusBadge status={project.status} />
            </div>
            <h1 className="page-title">{project.title}</h1>
            <p className="lead">{project.summary}</p>
            {statusNote ? (
              <p className="notice">
                <Icon name="alert" size={18} />
                <span>{statusNote}</span>
              </p>
            ) : null}
            {project.liveUrl || project.sourceUrl ? (
              <div className="detail__links">
                {project.liveUrl ? (
                  <a className="btn btn--primary btn--md" href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <span>View live demo</span>
                    <Icon name="arrow-up-right" size={18} className="btn__icon" />
                  </a>
                ) : null}
                {project.sourceUrl ? (
                  <a className="btn btn--secondary btn--md" href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <span>View source code</span>
                    <Icon name="arrow-up-right" size={18} className="btn__icon" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <div className="container">
          <div className="detail__cover">
            <Image src={project.cover.src} alt={project.cover.alt} width={project.cover.width} height={project.cover.height} priority sizes="(min-width: 1240px) 1240px, 100vw" />
          </div>

          <div className="detail__layout">
            <aside className="panel detail__facts" aria-label="Project details">
              <dl>
                {project.client ? (
                  <div>
                    <dt>Client</dt>
                    <dd>{project.client}</dd>
                  </div>
                ) : null}
                {project.year ? (
                  <div>
                    <dt>Year</dt>
                    <dd>{project.year}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Type</dt>
                  <dd>{project.projectType}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{project.categories.join(", ")}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{project.role}</dd>
                </div>
                <div>
                  <dt>Stack</dt>
                  <dd>{project.technologies.join(", ")}</dd>
                </div>
                {services.length > 0 ? (
                  <div>
                    <dt>Service</dt>
                    <dd>
                      {services.map((s, i) => (
                        <span key={s.id}>
                          {i > 0 ? ", " : ""}
                          <Link href={`/services#${s.id}`}>{s.title}</Link>
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {project.tags.length > 0 ? (
                <ul className="tag-list" aria-label="Tags">
                  {project.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </aside>

            <div className="detail__content prose">
              <section aria-labelledby="overview-title">
                <h2 className="section-title section-title--sm" id="overview-title">
                  Project overview
                </h2>
                <p>{project.summary}</p>
              </section>

              {isCaseStudy && cs ? (
                <>
                  {cs.background ? (
                    <section aria-labelledby="background-title">
                      <h2 className="section-title section-title--sm" id="background-title">
                        Background
                      </h2>
                      <p>{cs.background}</p>
                    </section>
                  ) : (
                    <EditorNote>Add `caseStudy.background` — who the client is and what the project was for.</EditorNote>
                  )}
                  {cs.challenge ? (
                    <section aria-labelledby="challenge-title">
                      <h2 className="section-title section-title--sm" id="challenge-title">
                        The challenge
                      </h2>
                      <p>{cs.challenge}</p>
                    </section>
                  ) : (
                    <EditorNote>Add `caseStudy.challenge` — the problem that needed solving.</EditorNote>
                  )}
                  {cs.objectives && cs.objectives.length > 0 ? (
                    <section aria-labelledby="objectives-title">
                      <h2 className="section-title section-title--sm" id="objectives-title">
                        Objectives
                      </h2>
                      <ul>
                        {cs.objectives.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </>
              ) : null}

              <section aria-labelledby="role-title">
                <h2 className="section-title section-title--sm" id="role-title">
                  My role
                </h2>
                <p>{project.role}</p>
                <ul>
                  {project.contribution.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </section>

              {isCaseStudy && cs ? (
                <>
                  {cs.approach ? (
                    <section aria-labelledby="approach-title">
                      <h2 className="section-title section-title--sm" id="approach-title">
                        Technical approach
                      </h2>
                      <p>{cs.approach}</p>
                    </section>
                  ) : (
                    <EditorNote>Add `caseStudy.approach` — the strategy chosen and why.</EditorNote>
                  )}
                  {cs.features && cs.features.length > 0 ? (
                    <section aria-labelledby="features-title">
                      <h2 className="section-title section-title--sm" id="features-title">
                        What is implemented
                      </h2>
                      <ul className="check-list check-list--spaced">
                        {cs.features.map((f) => (
                          <li key={f}>
                            <Icon name="check" size={16} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {cs.process && cs.process.length > 0 ? (
                    <section aria-labelledby="process-title">
                      <h2 className="section-title section-title--sm" id="process-title">
                        Process
                      </h2>
                      <ol>
                        {cs.process.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </section>
                  ) : (
                    <EditorNote>Add `caseStudy.process` — the production or development steps.</EditorNote>
                  )}
                  {cs.decisions && cs.decisions.length > 0 ? (
                    <section aria-labelledby="decisions-title">
                      <h2 className="section-title section-title--sm" id="decisions-title">
                        Engineering and creative decisions
                      </h2>
                      <ul className="decisions">
                        {cs.decisions.map((d) => (
                          <li key={d.title}>
                            <h3 className="decisions__title">{d.title}</h3>
                            <p>{d.text}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {cs.solution ? (
                    <section aria-labelledby="solution-title">
                      <h2 className="section-title section-title--sm" id="solution-title">
                        What was delivered
                      </h2>
                      <p>{cs.solution}</p>
                    </section>
                  ) : (
                    <EditorNote>Add `caseStudy.solution` — what was delivered.</EditorNote>
                  )}
                  {cs.results && cs.results.length > 0 ? (
                    <section aria-labelledby="results-title">
                      <h2 className="section-title section-title--sm" id="results-title">
                        Results
                      </h2>
                      <ul>
                        {cs.results.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                      {project.status !== "Verified" && project.status !== "Published" ? (
                        <p className="fine-print">These are tested capabilities of the demonstration, not commercial outcomes.</p>
                      ) : null}
                    </section>
                  ) : (
                    <EditorNote>Add `caseStudy.results` only with verified outcomes. Leave empty otherwise.</EditorNote>
                  )}
                </>
              ) : null}

              <section aria-labelledby="stack-title">
                <h2 className="section-title section-title--sm" id="stack-title">
                  Technology stack
                </h2>
                <ul className="tag-list" aria-label="Technology stack">
                  {project.technologies.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </section>

              {project.attribution ? (
                <section aria-labelledby="attribution-title">
                  <h2 className="section-title section-title--sm" id="attribution-title">
                    Attribution
                  </h2>
                  <p>
                    Built on{" "}
                    <a href={project.attribution.url} target="_blank" rel="noopener noreferrer">
                      {project.attribution.project}
                    </a>
                    , © {project.attribution.copyright}, used under the{" "}
                    <a href={project.attribution.licenseUrl} target="_blank" rel="noopener noreferrer">
                      {project.attribution.license} licence
                    </a>
                    .
                  </p>
                  <p>
                    <strong>What the original provides:</strong> {project.attribution.originalWork}
                  </p>
                  <p>
                    <strong>What I changed:</strong>
                  </p>
                  <ul>
                    {project.attribution.modifications.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </section>
              ) : project.projectType === "Open-Source Adaptation" ? (
                <EditorNote>This project is an Open-Source Adaptation but has no `attribution` block. Add one before publishing.</EditorNote>
              ) : null}

              {!isCaseStudy && cs ? <ArrowLink href={`/case-studies/${project.slug}`}>Read the case study</ArrowLink> : null}
            </div>
          </div>

          {project.gallery.length > 0 ? (
            <section className="detail__gallery" aria-labelledby="gallery-title">
              <h2 className="section-title section-title--sm" id="gallery-title">
                {isCaseStudy ? "Visual demonstration" : "Screenshots"}
              </h2>
              {isCaseStudy ? (
                <p className="fine-print detail__gallery-note">
                  Captured from the running application{project.usesSampleMedia ? ", except where a card is marked as sample artwork" : ""}.
                </p>
              ) : null}
              <MediaGallery items={project.gallery} />
            </section>
          ) : (
            <EditorNote>Add images or videos to `gallery` in lib/projects.ts to show a media gallery here.</EditorNote>
          )}
        </div>
      </article>

      {isCaseStudy && (prev || next) ? (
        <nav className="case-nav" aria-label="Case study navigation">
          <div className="container case-nav__inner">
            {prev ? (
              <Link href={`/case-studies/${prev.slug}`} className="case-nav__link case-nav__link--prev">
                <span className="case-nav__label">
                  <Icon name="arrow-right" size={15} className="flip" />
                  Previous
                </span>
                <span className="case-nav__title">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            <Link href="/case-studies" className="case-nav__all">
              All case studies
            </Link>
            {next ? (
              <Link href={`/case-studies/${next.slug}`} className="case-nav__link case-nav__link--next">
                <span className="case-nav__label">
                  Next
                  <Icon name="arrow-right" size={15} />
                </span>
                <span className="case-nav__title">{next.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </div>
        </nav>
      ) : null}

      {related.length > 0 ? (
        <section className="section section--tight" aria-labelledby="related-title">
          <div className="container">
            <h2 className="section-title section-title--sm" id="related-title">
              Related projects
            </h2>
            <div className="project-grid project-grid--2">
              {related.map((p) => (
                <ProjectCard key={p.slug} project={p} linkTo={isCaseStudy && p.caseStudy ? "case-study" : "detail"} sizes="(min-width: 768px) 600px, 100vw" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ContactCTA standalone title="Have a similar project in mind?" />
    </>
  );
}
