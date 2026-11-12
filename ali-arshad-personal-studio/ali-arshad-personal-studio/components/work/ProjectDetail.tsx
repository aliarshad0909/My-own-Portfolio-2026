import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ArrowLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MediaGallery } from "@/components/work/MediaGallery";
import { ProjectCard } from "@/components/work/ProjectCard";
import { STATUS_NOTE, relatedProjects, type Project } from "@/lib/projects";

type Props = { project: Project; variant: "project" | "case-study" };

/**
 * Shared layout for /work/[slug] and /case-studies/[slug].
 * Sections without content are skipped, so a case study can grow over time.
 * Results are only shown when `caseStudy.results` contains verified entries.
 */
export function ProjectDetail({ project, variant }: Props) {
  const cs = project.caseStudy;
  const isCaseStudy = variant === "case-study";
  const isPlaceholder = project.status === "placeholder";
  const related = relatedProjects(project, 2);
  const backHref = isCaseStudy ? "/case-studies" : "/work";

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
              <StatusBadge status={project.status} />
            </div>
            <h1 className="page-title">{project.title}</h1>
            <p className="lead">{project.summary}</p>
            {project.status !== "published" ? (
              <p className="notice">
                <Icon name="alert" size={18} />
                <span>{STATUS_NOTE[project.status]}</span>
              </p>
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
                  <dt>Category</dt>
                  <dd>{project.categories.join(", ")}</dd>
                </div>
                {!isPlaceholder ? (
                  <div>
                    <dt>Role</dt>
                    <dd>{project.role}</dd>
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
              {project.liveUrl ? (
                <a className="arrow-link" href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <span>Visit live project</span>
                  <Icon name="arrow-up-right" size={18} />
                </a>
              ) : null}
            </aside>

            <div className="detail__content prose">
              <section aria-labelledby="overview-title">
                <h2 className="section-title section-title--sm" id="overview-title">
                  Project overview
                </h2>
                <p>{project.summary}</p>
              </section>

              {!isPlaceholder ? (
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
              ) : (
                <EditorNote>Replace this placeholder in lib/projects.ts with a real project: role, contribution, media and case-study text.</EditorNote>
              )}

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
                  {cs.approach ? (
                    <section aria-labelledby="approach-title">
                      <h2 className="section-title section-title--sm" id="approach-title">
                        Strategy and approach
                      </h2>
                      <p>{cs.approach}</p>
                    </section>
                  ) : (
                    <EditorNote>Add `caseStudy.approach` — the strategy chosen and why.</EditorNote>
                  )}
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
                    </section>
                  ) : (
                    <EditorNote>Add `caseStudy.results` only with verified outcomes. Leave empty otherwise.</EditorNote>
                  )}
                </>
              ) : null}

              {!isCaseStudy && cs ? <ArrowLink href={`/case-studies/${project.slug}`}>Read the case study</ArrowLink> : null}
            </div>
          </div>

          {project.gallery.length > 0 ? (
            <section className="detail__gallery" aria-labelledby="gallery-title">
              <h2 className="section-title section-title--sm" id="gallery-title">
                Gallery
              </h2>
              <MediaGallery items={project.gallery} />
            </section>
          ) : (
            <EditorNote>Add images or videos to `gallery` in lib/projects.ts to show a media gallery here.</EditorNote>
          )}
        </div>
      </article>

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
