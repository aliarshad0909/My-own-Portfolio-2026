import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ArrowLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { ConceptCoverArt } from "@/components/work/ConceptCoverArt";
import { MediaGallery } from "@/components/work/MediaGallery";
import { ProjectCard } from "@/components/work/ProjectCard";
import { STATUS_NOTE, caseStudies, relatedProjects, type Project } from "@/lib/projects";
import { SERVICE_HUBS, spokesForProject } from "@/lib/seo/service-hubs";
import { isIndexable } from "@/lib/seo/publication";
import { servicesForProject } from "@/lib/services";
import { GPU_COMPUTE_PATH, GPU_RELATED_PROJECT_SLUGS } from "@/lib/gpu-compute";

function labelFromPath(path: string): string {
  const seg = path.split("/").filter(Boolean).pop() ?? path;
  return seg
    .split("-")
    .map((w) => {
      if (w === "ai") return "AI";
      if (w === "crm") return "CRM";
      if (w === "api") return "API";
      if (w === "n8n") return "n8n";
      if (w === "rag") return "RAG";
      if (w === "mvp") return "MVP";
      if (w === "gpu") return "GPU";
      if (w === "roi") return "ROI";
      if (w === "saas") return "SaaS";
      if (w === "nextjs") return "Next.js";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/** Dedicated published service hubs evidenced by a given project slug. */
function hubsForProject(slug: string) {
  return SERVICE_HUBS.filter((h) => isIndexable(h.publicationState) && h.projectSlugs.includes(slug));
}

function isGpuRelatedProject(slug: string): boolean {
  return (GPU_RELATED_PROJECT_SLUGS as readonly string[]).includes(slug);
}

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
  const hubs = hubsForProject(project.slug);
  const spokes = spokesForProject(project.slug);
  const gpuRelated = isGpuRelatedProject(project.slug);
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
                  <TrackedLink
                    className="btn btn--primary btn--md"
                    href={project.liveUrl}
                    external
                    event="demo_launch"
                    props={{ product: project.slug, placement: "case-study-hero" }}
                  >
                    <span>Launch Live Demo</span>
                    <Icon name="arrow-up-right" size={18} className="btn__icon" />
                  </TrackedLink>
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
            {project.conceptVisual ? (
              <ConceptCoverArt spec={project.conceptVisual} title={project.title} status={project.status} />
            ) : (
              <Image src={project.cover.src} alt={project.cover.alt} width={project.cover.width} height={project.cover.height} priority sizes="(min-width: 1240px) 1240px, 100vw" />
            )}
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
                {hubs.length > 0 ? (
                  <div>
                    <dt>Related service</dt>
                    <dd>
                      {hubs.map((h, i) => (
                        <span key={h.slug}>
                          {i > 0 ? ", " : ""}
                          <Link href={`/services/${h.slug}`}>{h.h1}</Link>
                        </span>
                      ))}
                      {gpuRelated ? (
                        <>
                          {", "}
                          <Link href={GPU_COMPUTE_PATH}>RTX GPU compute rental</Link>
                        </>
                      ) : null}
                    </dd>
                  </div>
                ) : services.length > 0 || gpuRelated ? (
                  <div>
                    <dt>Service</dt>
                    <dd>
                      {services.map((s, i) => (
                        <span key={s.id}>
                          {i > 0 ? ", " : ""}
                          <Link href={`/services#${s.id}`}>{s.title}</Link>
                        </span>
                      ))}
                      {gpuRelated ? (
                        <>
                          {services.length > 0 ? ", " : ""}
                          <Link href={GPU_COMPUTE_PATH}>RTX GPU compute rental</Link>
                        </>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
                {spokes.length > 0 ? (
                  <div>
                    <dt>Service specializations</dt>
                    <dd>
                      {spokes.map(({ hub, spoke }, i) => (
                        <span key={`${hub.slug}/${spoke.slug}`}>
                          {i > 0 ? ", " : ""}
                          <Link href={`/services/${hub.slug}/${spoke.slug}`}>{spoke.h1}</Link>
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
                {project.relatedServicePaths && project.relatedServicePaths.length > 0 ? (
                  <div>
                    <dt>Related services</dt>
                    <dd>
                      {project.relatedServicePaths.map((href, i) => (
                        <span key={href}>
                          {i > 0 ? ", " : ""}
                          <Link href={href}>{labelFromPath(href)}</Link>
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
                {project.relatedToolPaths && project.relatedToolPaths.length > 0 ? (
                  <div>
                    <dt>Related calculators</dt>
                    <dd>
                      {project.relatedToolPaths.map((href, i) => (
                        <span key={href}>
                          {i > 0 ? ", " : ""}
                          <Link href={href}>{labelFromPath(href)}</Link>
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
              {(isCaseStudy || project.isCatalogExpansion) && cs ? (
                <>
                  {cs.background ? (
                    <section aria-labelledby="background-title">
                      <h2 className="section-title section-title--sm" id="background-title">
                        {project.isCatalogExpansion ? "Overview & status" : "Background"}
                      </h2>
                      <p>{cs.background}</p>
                    </section>
                  ) : !project.isCatalogExpansion ? (
                    <EditorNote>Add `caseStudy.background`: who the client is and what the project was for.</EditorNote>
                  ) : null}
                  {cs.challenge ? (
                    <section aria-labelledby="challenge-title">
                      <h2 className="section-title section-title--sm" id="challenge-title">
                        The challenge
                      </h2>
                      <p>{cs.challenge}</p>
                    </section>
                  ) : !project.isCatalogExpansion ? (
                    <EditorNote>Add `caseStudy.challenge`: the problem that needed solving.</EditorNote>
                  ) : null}
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
                  {project.isCatalogExpansion ? "Scope & deliverables" : "My role"}
                </h2>
                <p>{project.role}</p>
                <ul>
                  {project.contribution.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </section>

              {(isCaseStudy || project.isCatalogExpansion) && cs ? (
                <>
                  {cs.approach ? (
                    <section aria-labelledby="approach-title">
                      <h2 className="section-title section-title--sm" id="approach-title">
                        Technical approach
                      </h2>
                      <p>{cs.approach}</p>
                    </section>
                  ) : !project.isCatalogExpansion ? (
                    <EditorNote>Add `caseStudy.approach`: the strategy chosen and why.</EditorNote>
                  ) : null}
                  {cs.features && cs.features.length > 0 ? (
                    <section aria-labelledby="features-title">
                      <h2 className="section-title section-title--sm" id="features-title">
                        {project.isCatalogExpansion && project.status !== "Prototype"
                          ? "Planned architecture & capabilities"
                          : "What is implemented"}
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
                  {!project.isCatalogExpansion && cs.process && cs.process.length > 0 ? (
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
                  ) : !project.isCatalogExpansion ? (
                    <EditorNote>Add `caseStudy.process`: the production or development steps.</EditorNote>
                  ) : null}
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
                        {project.isCatalogExpansion && project.status !== "Prototype"
                          ? "Blueprint readiness"
                          : "What was delivered"}
                      </h2>
                      <p>{cs.solution}</p>
                    </section>
                  ) : !project.isCatalogExpansion ? (
                    <EditorNote>Add `caseStudy.solution`: what was delivered.</EditorNote>
                  ) : null}
                  {!project.isCatalogExpansion && cs.results && cs.results.length > 0 ? (
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
                  ) : !project.isCatalogExpansion ? (
                    <EditorNote>Add `caseStudy.results` only with verified outcomes. Leave empty otherwise.</EditorNote>
                  ) : null}
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

              {project.architectureDiagram ? (
                <section id="architecture" aria-labelledby="architecture-diagram-title">
                  <h2 className="section-title section-title--sm" id="architecture-diagram-title">
                    Technical architecture schematic
                  </h2>
                  <figure className="article-figure">
                    <div className="article-figure__frame article-figure__frame--dark-diagram">
                      <Image
                        src={project.architectureDiagram.src}
                        alt={project.architectureDiagram.alt}
                        width={project.architectureDiagram.width}
                        height={project.architectureDiagram.height}
                        loading="lazy"
                        sizes="(min-width: 1024px) 780px, 94vw"
                      />
                    </div>
                    <figcaption className="article-figure__caption">
                      <span>{project.architectureDiagram.caption}</span>
                    </figcaption>
                  </figure>
                </section>
              ) : null}

              {project.demoAccess ? (
                <section id="demo-access" aria-labelledby="demo-access-title">
                  <h2 className="section-title section-title--sm" id="demo-access-title">
                    Interactive demo access &amp; deployment status
                  </h2>
                  <div className="demo-access-panel">
                    <p className="demo-access-panel__note">{project.demoAccess.hostingNote}</p>
                    <dl className="demo-access-panel__grid">
                      <div>
                        <dt>Target Deployment</dt>
                        <dd>{project.demoAccess.deploymentTarget}</dd>
                      </div>
                      <div>
                        <dt>Demo Credentials</dt>
                        <dd>
                          <code>{project.demoAccess.demoEmail}</code> /{" "}
                          <code>{project.demoAccess.demoPassword}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>Run Locally</dt>
                        <dd>
                          <code>{project.demoAccess.localRunCommand}</code>
                        </dd>
                      </div>
                    </dl>
                    {project.liveUrl ? (
                      <div className="demo-access-panel__cta">
                        <a
                          className="btn btn--primary btn--sm"
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Open Live Instance</span>
                          <Icon name="arrow-up-right" size={16} className="btn__icon" />
                        </a>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {project.mobilePreview ? (
                <section id="mobile-preview" aria-labelledby="mobile-preview-title">
                  <h2 className="section-title section-title--sm" id="mobile-preview-title">
                    {project.mobilePreview.headline}
                  </h2>
                  <p>{project.mobilePreview.summary}</p>
                  <ul className="tag-list" aria-label="Mobile app technologies">
                    {project.mobilePreview.techBadges.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {project.mobilePreview.interactiveWebUrl || project.mobilePreview.androidApkUrl ? (
                    <div className="detail__links" style={{ marginTop: "16px" }}>
                      {project.mobilePreview.interactiveWebUrl ? (
                        <TrackedLink
                          className="btn btn--primary btn--sm"
                          href={project.mobilePreview.interactiveWebUrl}
                          external
                          event="mobile_preview_launch"
                          props={{ product: project.slug, placement: "case-study-mobile" }}
                        >
                          <span>Open Interactive Mobile Web Preview</span>
                          <Icon name="arrow-up-right" size={16} className="btn__icon" />
                        </TrackedLink>
                      ) : null}
                      {project.mobilePreview.androidApkUrl ? (
                        <TrackedLink
                          className="btn btn--secondary btn--sm"
                          href={project.mobilePreview.androidApkUrl}
                          external
                          event="mobile_preview_launch"
                          props={{ product: project.slug, placement: "case-study-apk" }}
                        >
                          <span>Download Android Preview APK</span>
                          <Icon name="arrow-up-right" size={16} className="btn__icon" />
                        </TrackedLink>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mobile-preview__grid">
                    {project.mobilePreview.screens.map((screen) => (
                      <figure key={screen.src} className="mobile-preview__card">
                        <div className="mobile-preview__frame">
                          <Image
                            src={screen.src}
                            alt={screen.alt}
                            width={screen.width}
                            height={screen.height}
                            loading="lazy"
                            sizes="(min-width: 1024px) 220px, 44vw"
                          />
                        </div>
                        <figcaption className="mobile-preview__caption">{screen.label}</figcaption>
                      </figure>
                    ))}
                  </div>
                  <p className="fine-print">{project.mobilePreview.distributionNote}</p>
                </section>
              ) : null}

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

              {!isCaseStudy && cs && !project.isCatalogExpansion ? (
                <ArrowLink href={`/case-studies/${project.slug}`}>Read the case study</ArrowLink>
              ) : null}
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
          ) : null}
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
                <ProjectCard key={p.slug} project={p} linkTo={isCaseStudy && p.caseStudy && !p.isCatalogExpansion ? "case-study" : "detail"} sizes="(min-width: 768px) 600px, 100vw" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ContactCTA standalone title="Have a similar project in mind?" />
    </>
  );
}
