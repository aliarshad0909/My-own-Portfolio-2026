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

      <PageHero eyebrow={hub.h1} title={spoke.h1} lead={spoke.lead}>
        <div className="hero__actions">
          <ButtonLink href={contactHref}>Discuss {spoke.h1.toLowerCase()}</ButtonLink>
          <ButtonLink href={`/services/${hub.slug}`} variant="secondary" icon={null}>
            Full {hub.h1.toLowerCase()} service
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

      <section className="section" aria-labelledby="spoke-overview">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Overview</p>
            <h2 className="section-title section-title--sm" id="spoke-overview">
              Why teams focus specifically on {spoke.h1.toLowerCase()}
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
              What is included in a {spoke.h1.toLowerCase()} engagement
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

      {spoke.relatedTool ? (
        <section className="section section--tight" aria-label="Interactive planning tool">
          <div className="container">
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
            {siblings.slice(0, 3).map((sib) => (
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
        title={`Need help with ${spoke.h1.toLowerCase()}?`}
        text="Share your current workflow, constraints and timeline. I will give you an honest read on scope, trade-offs and the cleanest next step."
        button="Discuss your project"
        href={contactHref}
        secondaryHref={`/services/${hub.slug}`}
        secondaryLabel={`Back to ${hub.h1.toLowerCase()}`}
      />
    </>
  );
}
