import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { FlowDiagram } from "@/components/services/FlowDiagram";
import { ServiceDemoShowcase } from "@/components/services/ServiceDemoShowcase";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { getProject, type Project } from "@/lib/projects";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { getHubEnrichment } from "@/lib/seo/service-enrichment";
import type { ServiceHub, ServiceSpoke } from "@/lib/seo/service-hubs";
import { singleServiceSchema } from "@/lib/structured-data";

export function ServiceSpokeView({ hub, spoke }: { hub: ServiceHub; spoke: ServiceSpoke }) {
  const path = `/services/${hub.slug}/${spoke.slug}`;
  const hubEnrichment = getHubEnrichment(hub.slug);
  const contactHref = hubEnrichment
    ? `/contact?service=${encodeURIComponent(hubEnrichment.contactServiceTitle)}`
    : "/contact";
  const projects = spoke.projectSlugs
    .map((slug) => getProject(slug))
    .filter((p): p is Project => p !== undefined);
  const siblings = hub.spokes.filter((s) => s.slug !== spoke.slug && shouldRender(s.publicationState));
  const hasPublicLiveDemo = projects.some((p) => Boolean(p.liveUrl));
  const proofSummary = hasPublicLiveDemo
    ? "Includes publicly deployed live sandbox demonstration"
    : projects.length > 0
      ? "Backed by locally tested studio demonstration build(s)"
      : "Scoped transparently during discovery";

  const heroVisual = spoke.heroVisual;
  const linkedProject = heroVisual?.projectSlug ? getProject(heroVisual.projectSlug) : undefined;
  const linkedHref = linkedProject
    ? linkedProject.caseStudy
      ? `/case-studies/${linkedProject.slug}`
      : `/work/${linkedProject.slug}`
    : undefined;

  const frameClass = [
    "hub-hero-card__frame",
    heroVisual?.diagram ? "hub-hero-card__frame--diagram" : "",
    heroVisual?.darkDiagram ? "hub-hero-card__frame--dark-diagram" : "",
    heroVisual?.lightCard ? "hub-hero-card__frame--light" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const heroAside = heroVisual ? (
    <div className="hub-hero-card">
      {linkedHref && linkedProject ? (
        <Link href={linkedHref} className={frameClass} aria-label={`${linkedProject.title}, view case study`}>
          <Image
            src={heroVisual.src}
            alt={heroVisual.alt}
            width={heroVisual.width}
            height={heroVisual.height}
            priority
            sizes="(min-width: 1024px) 520px, 92vw"
          />
        </Link>
      ) : (
        <div className={frameClass}>
          <Image
            src={heroVisual.src}
            alt={heroVisual.alt}
            width={heroVisual.width}
            height={heroVisual.height}
            priority
            sizes="(min-width: 1024px) 520px, 92vw"
          />
        </div>
      )}
      <div className="hub-hero-card__caption">
        <span>{heroVisual.caption}</span>
        {linkedHref ? <Link href={linkedHref}>Inspect demo</Link> : null}
      </div>
    </div>
  ) : undefined;

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: spoke.h1,
          description: spoke.lead,
          path,
          serviceType: spoke.title,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: hub.h1, path: `/services/${hub.slug}` },
          { name: spoke.h1, path },
        ]}
      />

      <PageHero eyebrow={hub.h1} title={spoke.h1} lead={spoke.lead} aside={heroAside}>
        <div className="hero__actions">
          <ButtonLink href={contactHref}>Discuss {spoke.h1}</ButtonLink>
          <ButtonLink href={`/services/${hub.slug}`} variant="secondary" icon={null}>
            Full {hub.h1} service
          </ButtonLink>
        </div>
      </PageHero>

      {!isIndexable(spoke.publicationState) ? (
        <EditorNote>
          This specialization page is {spoke.publicationState}: preview-only and
          noindex in non-production environments, and not served or indexed in
          production until its evidence requirement is satisfied.
        </EditorNote>
      ) : null}

      {spoke.scopeNotice ? (
        <div className="container" style={{ marginTop: "1.25rem" }}>
          <p className="notice notice--wide">
            <Icon name="alert" size={18} />
            <span>{spoke.scopeNotice}</span>
          </p>
        </div>
      ) : null}

      <section className="container" style={{ marginTop: "1.5rem" }} aria-label="Service summary and delivery details">
        <div className="panel spoke-aeo-panel">
          {spoke.quickAnswer ? (
            <div className="spoke-aeo-panel__answer">
              <p className="label">Direct answer</p>
              <p className="spoke-aeo-panel__lead">{spoke.quickAnswer}</p>
            </div>
          ) : null}
          <dl className="spoke-aeo-grid">
            {spoke.audience ? (
              <div>
                <dt>Best fit / Audience</dt>
                <dd>{spoke.audience}</dd>
              </div>
            ) : null}
            <div>
              <dt>Remote delivery</dt>
              <dd>
                Delivered remotely for US &amp; international clients with scheduled time-zone overlap — independent studio of one, no physical regional offices claimed.
              </dd>
            </div>
            <div>
              <dt>Supporting proof</dt>
              <dd>{proofSummary}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section" aria-labelledby="spoke-overview">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Overview</p>
            <h2 className="section-title section-title--sm" id="spoke-overview">
              Why teams focus specifically on {spoke.h1}
            </h2>
          </div>
          <div className="prose">
            {spoke.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <ul className="hub-problems" style={{ marginTop: "1.75rem" }}>
            {spoke.problems.map((problem) => (
              <li key={problem}>&ldquo;{problem}&rdquo;</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="spoke-deliverables">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Deliverables</p>
            <h2 className="section-title section-title--sm" id="spoke-deliverables">
              What is included: {spoke.h1}
            </h2>
          </div>
          <ul className="hub-deliverables">
            {spoke.deliverables.map((d) => (
              <li key={d.title} className="hub-deliverable">
                <div className="hub-deliverable__head">
                  <span className="hub-deliverable__icon" aria-hidden="true">
                    <Icon name="check" size={17} />
                  </span>
                  <h3 className="hub-deliverable__title">{d.title}</h3>
                </div>
                <p className="hub-deliverable__detail">{d.detail}</p>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: "2rem" }}>
            <FlowDiagram
              title={spoke.workflow.title}
              steps={spoke.workflow.steps}
              caption={spoke.workflow.caption}
            />
          </div>

          {spoke.supportingVisual ? (
            <figure className="article-figure" style={{ marginTop: "2rem", maxWidth: "56rem" }}>
              <div
                className={`article-figure__frame ${spoke.supportingVisual.darkDiagram ? "article-figure__frame--dark-diagram" : ""}`.trim()}
              >
                <Image
                  src={spoke.supportingVisual.src}
                  alt={spoke.supportingVisual.alt}
                  width={spoke.supportingVisual.width}
                  height={spoke.supportingVisual.height}
                  loading="lazy"
                  sizes="(min-width: 1024px) 860px, 94vw"
                />
              </div>
              <figcaption className="article-figure__caption">
                <span>{spoke.supportingVisual.caption}</span>
              </figcaption>
            </figure>
          ) : null}

          {spoke.stack.length > 0 ? (
            <div style={{ marginTop: "1.75rem" }}>
              <p className="label" style={{ marginBottom: "0.65rem" }}>
                Tools, integrations &amp; standards
              </p>
              <ul className="tag-list">
                {spoke.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {projects.length > 0 ? (
        <section className="section" aria-label="Supporting demonstration build">
          <div className="container">
            <ServiceDemoShowcase
              projects={projects}
              eyebrow="Grounded capability"
              title="Supporting demonstration build"
              lead="Working software built under a fictional brand and verified with automated tests to prove the mechanics described above."
            />
          </div>
        </section>
      ) : null}

      {spoke.relatedTool || spoke.relatedProduct || spoke.relatedResource ? (
        <section className="section section--tight" aria-label="Interactive tools and connected resources">
          <div className="container">
            {spoke.relatedTool ? (
              <div className="hub-tool-banner">
                <div className="hub-tool-banner__copy">
                  <p className="eyebrow eyebrow--plain">Interactive planning tool</p>
                  <h2 className="hub-tool-banner__title">{spoke.relatedTool.label}</h2>
                  <p className="hub-tool-banner__text">
                    Run your own numbers directly in the browser — no email gate and no obligation.
                  </p>
                </div>
                <ButtonLink href={spoke.relatedTool.href}>Open calculator</ButtonLink>
              </div>
            ) : null}
            {spoke.relatedProduct || spoke.relatedResource ? (
              <ul className="hub-card-grid" style={{ marginTop: spoke.relatedTool ? "1.25rem" : "0" }}>
                {spoke.relatedProduct ? (
                  <li>
                    <Link href={spoke.relatedProduct.href} className="hub-link-card">
                      <span className="hub-link-card__kind">Studio demonstration product</span>
                      <span className="hub-link-card__title">
                        <span>{spoke.relatedProduct.label}</span>
                        <Icon name="arrow-up-right" size={16} />
                      </span>
                      <span className="hub-link-card__desc">
                        Inspect architecture details, sandbox credentials, and real application screenshots in the Product Directory.
                      </span>
                    </Link>
                  </li>
                ) : null}
                {spoke.relatedResource ? (
                  <li>
                    <Link href={spoke.relatedResource.href} className="hub-link-card">
                      <span className="hub-link-card__kind">Background guide</span>
                      <span className="hub-link-card__title">
                        <span>{spoke.relatedResource.label}</span>
                        <Icon name="arrow-up-right" size={16} />
                      </span>
                      <span className="hub-link-card__desc">
                        Plain-English decision guide written directly from the studio&rsquo;s engineering and operational practices.
                      </span>
                    </Link>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {spoke.faqs.length > 0 ? (
        <Faq
          id={`faq-${hub.slug}-${spoke.slug}`}
          eyebrow="Questions"
          title={`${spoke.h1}: common questions`}
          items={spoke.faqs}
          surface
        />
      ) : null}

      <section className="section section--tight" aria-labelledby="spoke-explore">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Related capabilities</p>
            <h2 className="section-title section-title--sm" id="spoke-explore">
              Explore the broader {hub.h1.toLowerCase()} practice
            </h2>
          </div>
          <ul className="hub-card-grid">
            <li>
              <Link href={`/services/${hub.slug}`} className="hub-link-card">
                <span className="hub-link-card__kind">Parent hub</span>
                <span className="hub-link-card__title">
                  <span>{hub.h1}</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">{hub.lead}</span>
              </Link>
            </li>
            {siblings.slice(0, 5).map((sib) => (
              <li key={sib.slug}>
                <Link href={`/services/${hub.slug}/${sib.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">
                    {isIndexable(sib.publicationState) ? "Specialization" : `Preview (${sib.publicationState})`}
                  </span>
                  <span className="hub-link-card__title">
                    <span>{sib.h1}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{sib.lead}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="Start a focused engagement"
        title={`Need help with ${spoke.h1}?`}
        text="Share your current workflow, constraints and timeline. I will give you an honest read on scope, trade-offs and the cleanest next step."
        button="Discuss your project"
        href={contactHref}
        secondaryHref={`/services/${hub.slug}`}
        secondaryLabel={`Back to ${hub.h1}`}
      />
    </>
  );
}

