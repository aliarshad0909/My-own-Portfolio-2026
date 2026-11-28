import Image from "next/image";
import Link from "next/link";
import { ArticleSocialBar } from "@/components/blog/ArticleSocialBar";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ServiceMotion } from "@/components/services/ServiceMotion";
import { JsonLd } from "@/components/seo/JsonLd";
import { InteractiveArchitecture } from "@/components/services/InteractiveArchitecture";
import { ServiceDemoShowcase } from "@/components/services/ServiceDemoShowcase";
import { WorkflowScenarios } from "@/components/services/WorkflowScenarios";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ArrowLink, ButtonLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { VideoShowcasePlayer } from "@/components/media/VideoShowcasePlayer";
import { CredentialCard } from "@/components/credentials/CredentialCard";
import { getBlogPost } from "@/lib/content/blog";
import { getIndustry } from "@/lib/content/industries";
import { getResource } from "@/lib/content/resources";
import { APPROVED_PUBLIC_VIDEOS, CLIENT_VIDEO_RIGHTS_NOTICE } from "@/lib/creative-videos";
import { visibleCredentials } from "@/lib/credentials";
import { locationsForServiceHub } from "@/lib/geo/location-connections";
import { getProject, projectHref, type Project } from "@/lib/projects";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { getHubEnrichment, type ServiceHubEnrichment } from "@/lib/seo/service-enrichment";
import type { ServiceHub } from "@/lib/seo/service-hubs";
import { activeSocials, siteBaseUrl } from "@/lib/site";
import { singleServiceSchema } from "@/lib/structured-data";

const HUB_TO_BLOG_SLUGS: Record<string, string[]> = {
  "web-development": ["engineering-pipelineos-stockflow-sandboxes", "structured-data-llms-txt-honest-aeo"],
  "ecommerce-development": ["engineering-pipelineos-stockflow-sandboxes", "how-one-remote-studio-scopes-ships-software"],
  "business-dashboards": ["engineering-pipelineos-stockflow-sandboxes", "how-one-remote-studio-scopes-ships-software"],
  "ai-agents": ["mcp-tool-use-guardrails-business-ai-agents", "when-self-hosted-n8n-beats-saas-automation"],
  "n8n-automation": ["when-self-hosted-n8n-beats-saas-automation", "mcp-tool-use-guardrails-business-ai-agents"],
  "creative-production": ["reproducible-blender-bpy-rigs-ffmpeg-pipelines", "single-host-gpu-compute-when-consultation-beats-cloud"],
  branding: ["designing-accessible-dark-mode-brand-systems", "how-one-remote-studio-scopes-ships-software"],
  "global-sourcing": ["product-sourcing-landed-cost-catalog-checklist", "how-one-remote-studio-scopes-ships-software"],
};

function contactHrefFor(serviceTitle: string) {
  return `/contact?service=${encodeURIComponent(serviceTitle)}`;
}

/** Ensure internal link cards never point at a route that is gated off in production. */
function isHrefRenderable(href: string): boolean {
  if (href.startsWith("/resources/")) {
    const slug = href.slice("/resources/".length);
    const r = getResource(slug);
    return r ? shouldRender(r.publicationState) : false;
  }
  if (href.startsWith("/industries/")) {
    const slug = href.slice("/industries/".length);
    const ind = getIndustry(slug);
    return ind ? shouldRender(ind.publicationState) : false;
  }
  return true;
}

function HeroVisual({ enrichment }: { enrichment: ServiceHubEnrichment }) {
  if (enrichment.heroPreview) {
    const project = getProject(enrichment.heroPreview.projectSlug);
    if (!project || project.usesSampleMedia) return null;
    const target = projectHref(project);

    return (
      <div className="hub-hero-card">
        <Link
          href={target}
          className={`hub-hero-card__frame ${enrichment.heroPreview.diagram ? "hub-hero-card__frame--diagram" : ""}`.trim()}
          aria-label={`${project.title}, view case study`}
        >
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            width={project.cover.width}
            height={project.cover.height}
            priority
            sizes="(min-width: 1024px) 520px, 92vw"
          />
        </Link>
        <div className="hub-hero-card__caption">
          <span>{enrichment.heroPreview.caption}</span>
          <Link href={target}>Inspect demo</Link>
        </div>
      </div>
    );
  }

  if (enrichment.heroVisual) {
    const v = enrichment.heroVisual;
    return (
      <div className="hub-hero-card">
        <div className={`hub-hero-card__frame ${v.darkDiagram ? "hub-hero-card__frame--dark-diagram" : ""}`.trim()}>
          <Image
            src={v.src}
            alt={v.alt}
            width={v.width}
            height={v.height}
            priority
            sizes="(min-width: 1024px) 520px, 92vw"
          />
        </div>
        <div className="hub-hero-card__caption">
          <span>{v.caption}</span>
        </div>
      </div>
    );
  }

  return null;
}

export function ServiceHubView({ hub }: { hub: ServiceHub }) {
  const path = `/services/${hub.slug}`;
  const enrichment = getHubEnrichment(hub.slug);
  const projects = hub.projectSlugs
    .map((slug) => getProject(slug))
    .filter((p): p is Project => p !== undefined);
  const visibleSpokes = hub.spokes.filter((s) => shouldRender(s.publicationState));

  if (!enrichment) {
    // Fallback for any future hub before its enrichment block is authored.
    return (
      <>
        <JsonLd
          data={singleServiceSchema({
            name: hub.h1,
            description: hub.lead,
            path,
            serviceType: hub.title,
          })}
        />
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: hub.h1, path },
          ]}
        />
        <PageHero eyebrow="Service" title={hub.h1} lead={hub.lead}>
          <p className="measure">{hub.intent}</p>
        </PageHero>
        <section className="container section">
          <h2 className="section-title">Problems this solves</h2>
          <ul className="hub-problems">
            {hub.problems.map((p) => (
              <li key={p}>&ldquo;{p}&rdquo;</li>
            ))}
          </ul>
        </section>
        <Faq id={`faq-${hub.slug}`} eyebrow="Questions" title={`${hub.h1}: common questions`} items={hub.faqs} surface />
        <ContactCTA standalone />
      </>
    );
  }

  const ctaHref = contactHrefFor(enrichment.contactServiceTitle);
  const heroAside = <HeroVisual enrichment={enrichment} />;

  // Reusable section builders so each layoutVariant can compose a distinct visual hierarchy.
  const factsStrip = (
    <section className="container" aria-label="Service overview">
      <dl className="hub-facts">
        {enrichment.facts.map((f) => (
          <div key={f.label} className="hub-facts__item">
            <dt className="hub-facts__k">{f.label}</dt>
            <dd className="hub-facts__v">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="fine-print" style={{ marginTop: "12px" }}>
        Remote delivery: independent one-person studio working remotely with US and international teams on scheduled time-zone overlap — no physical regional offices claimed.
      </p>
    </section>
  );

  const scopeNotice = enrichment.scopeNotice ? (
    <div className="container" style={{ marginTop: "1.5rem" }}>
      <p className="notice notice--wide">
        <Icon name="alert" size={18} />
        <span>{enrichment.scopeNotice}</span>
      </p>
    </div>
  ) : null;

  const problemsSection = (surface = false) => (
    <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-labelledby={`${hub.slug}-problems`}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--plain">Problems solved</p>
          <h2 className="section-title" id={`${hub.slug}-problems`}>
            {enrichment.problemsHeading}
          </h2>
          <p className="section-sub">{enrichment.problemsLead}</p>
        </div>
        <ul className="hub-problem-grid">
          {enrichment.problems.map((item) => (
            <li key={item.quote} className="hub-problem-card">
              <p className="hub-problem-card__quote">&ldquo;{item.quote}&rdquo;</p>
              <p className="hub-problem-card__impact">{item.impact}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );

  const architectureSection = (surface = true) =>
    enrichment.architecture ? (
      <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-label={enrichment.architecture.title}>
        <div className="container">
          <InteractiveArchitecture
            eyebrow={enrichment.architecture.eyebrow}
            title={enrichment.architecture.title}
            lead={enrichment.architecture.lead}
            nodes={enrichment.architecture.nodes}
            caption={enrichment.architecture.caption}
          />
        </div>
      </section>
    ) : null;

  const scenariosSection = (surface = false) =>
    enrichment.scenarios ? (
      <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-label={enrichment.scenarios.title}>
        <div className="container">
          <WorkflowScenarios
            eyebrow={enrichment.scenarios.eyebrow}
            title={enrichment.scenarios.title}
            lead={enrichment.scenarios.lead}
            scenarios={enrichment.scenarios.items}
          />
        </div>
      </section>
    ) : null;

  const deliverablesSection = (surface = false) => (
    <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-labelledby={`${hub.slug}-deliverables`}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--plain">Deliverables &amp; capabilities</p>
          <h2 className="section-title" id={`${hub.slug}-deliverables`}>
            {enrichment.deliverablesHeading}
          </h2>
          <p className="section-sub">{enrichment.deliverablesLead}</p>
        </div>
        <ul className="hub-deliverables">
          {enrichment.deliverables.map((d) => (
            <li key={d.title} className="hub-deliverable">
              <div className="hub-deliverable__head">
                <span className="hub-deliverable__icon" aria-hidden="true">
                  <Icon name={d.icon} size={18} />
                </span>
                <h3 className="hub-deliverable__title">{d.title}</h3>
              </div>
              <p className="hub-deliverable__detail">{d.detail}</p>
              <p className="hub-deliverable__output">{d.output}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );

  const integrationsSection = (surface = true) => (
    <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-labelledby={`${hub.slug}-stack`}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--plain">Technology &amp; integrations</p>
          <h2 className="section-title" id={`${hub.slug}-stack`}>
            {enrichment.integrationsHeading}
          </h2>
          <p className="section-sub">{enrichment.integrationsLead}</p>
        </div>
        <div className="hub-integrations">
          {enrichment.integrations.map((group) => (
            <div key={group.category} className="hub-int-group">
              <h3 className="hub-int-group__title">{group.category}</h3>
              <ul className="tag-list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {group.note ? <p className="hub-int-group__note">{group.note}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const decisionSection = (surface = false) =>
    enrichment.decisionTable ? (
      <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-labelledby={`${hub.slug}-decision`}>
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">{enrichment.decisionTable.eyebrow}</p>
            <h2 className="section-title" id={`${hub.slug}-decision`}>
              {enrichment.decisionTable.title}
            </h2>
            <p className="section-sub">{enrichment.decisionTable.lead}</p>
          </div>
          <div className="decision-table-wrap">
            <table className="decision-table">
              <thead>
                <tr>
                  {enrichment.decisionTable.columns.map((col) => (
                    <th key={col} scope="col">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrichment.decisionTable.rows.map(([rowHead, colA, colB]) => (
                  <tr key={rowHead}>
                    <th scope="row">{rowHead}</th>
                    <td>{colA}</td>
                    <td>{colB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    ) : null;

  const industriesSection = (surface = false) => (
    <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-labelledby={`${hub.slug}-industries`}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--plain">Industry applications</p>
          <h2 className="section-title" id={`${hub.slug}-industries`}>
            {enrichment.industriesHeading}
          </h2>
          <p className="section-sub">{enrichment.industriesLead}</p>
        </div>
        <div className="hub-industries">
          {enrichment.industries.map((ind) => (
            <article key={ind.title} className="hub-industry-card">
              <span className="hub-industry-card__sector">{ind.sector}</span>
              <h3 className="hub-industry-card__title">{ind.title}</h3>
              <p className="hub-industry-card__text">{ind.detail}</p>
              {ind.href ? (
                <div className="hub-industry-card__link">
                  <ArrowLink href={ind.href}>Explore {ind.sector.toLowerCase()}</ArrowLink>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  const demoSection = (surface = true) => (
    <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-label="Portfolio demonstrations">
      <div className="container">
        <ServiceDemoShowcase
          projects={projects}
          title={enrichment.demoHeading ?? "Working demonstration builds"}
          lead={
            enrichment.demoLead ??
            "Each demonstration below is a complete, tested build under a fictional brand, labelled openly as a demonstration rather than a client engagement."
          }
          showLeadGallery={enrichment.showLeadGallery}
          pendingMedia={enrichment.pendingMedia}
        />
      </div>
    </section>
  );

  const credentialsSection = enrichment.showCredentials ? (
    <section className="section section--tight" aria-labelledby={`${hub.slug}-credentials`}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--plain">Verified credentials</p>
          <h2 className="section-title section-title--sm" id={`${hub.slug}-credentials`}>
            Documented certifications supporting brand &amp; growth work
          </h2>
        </div>
        <div className="cred-grid">
          {visibleCredentials().map((c) => (
            <CredentialCard key={c.id} credential={c} />
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const toolSection = enrichment.toolCallout ? (
    <section className="section section--tight" aria-label={enrichment.toolCallout.title}>
      <div className="container">
        <div className="hub-tool-banner">
          <div className="hub-tool-banner__copy">
            <p className="eyebrow eyebrow--plain">{enrichment.toolCallout.eyebrow}</p>
            <h2 className="hub-tool-banner__title">{enrichment.toolCallout.title}</h2>
            <p className="hub-tool-banner__text">{enrichment.toolCallout.text}</p>
          </div>
          <ButtonLink href={enrichment.toolCallout.href}>{enrichment.toolCallout.cta}</ButtonLink>
        </div>
      </div>
    </section>
  ) : null;

  const processSection = (surface = false) => (
    <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-labelledby={`${hub.slug}-process`}>
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--plain">Engagement process</p>
          <h2 className="section-title" id={`${hub.slug}-process`}>
            {enrichment.processHeading}
          </h2>
          <p className="section-sub">{enrichment.processLead}</p>
        </div>
        <ol className="hub-process">
          {enrichment.process.map((step, i) => (
            <li key={step.label} className="hub-process__step">
              <div className="hub-process__top">
                <span className="hub-process__num">{String(i + 1).padStart(2, "0")}</span>
                <span className="hub-process__cadence">{step.cadence}</span>
              </div>
              <h3 className="hub-process__label">{step.label}</h3>
              <p className="hub-process__detail">{step.detail}</p>
              <p className="hub-process__deliverable">{step.deliverable}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );

  const spokesSection =
    visibleSpokes.length > 0 ? (
      <section className="section section--tight" aria-labelledby={`${hub.slug}-spokes`}>
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Focused specializations</p>
            <h2 className="section-title section-title--sm" id={`${hub.slug}-spokes`}>
              Deep-dive service pages under {hub.h1.toLowerCase()}
            </h2>
          </div>
          <ul className="hub-card-grid">
            {visibleSpokes.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${hub.slug}/${s.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">
                    {isIndexable(s.publicationState) ? "Specialization" : `Preview (${s.publicationState})`}
                  </span>
                  <span className="hub-link-card__title">
                    <span>{s.h1}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{s.lead}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    ) : null;

  const visibleRelatedLinks = [
    ...enrichment.relatedLinks.filter((item) => isHrefRenderable(item.href)),
    ...(HUB_TO_BLOG_SLUGS[hub.slug] ?? [])
      .map((slug) => getBlogPost(slug))
      .filter((bp): bp is NonNullable<typeof bp> => bp !== undefined)
      .filter((bp) => !enrichment.relatedLinks.some((r) => r.href === `/blog/${bp.slug}`))
      .map((bp) => ({
        kind: "Studio Dispatch",
        title: bp.title,
        description: bp.excerpt,
        href: `/blog/${bp.slug}`,
      })),
  ];
  const locationMatches = locationsForServiceHub(hub.slug, 8);

  const locationsSection =
    locationMatches.states.length > 0 ? (
      <section className="section section--tight" aria-labelledby={`${hub.slug}-locations`}>
        <div className="container">
          <div className="panel location-fit-strip">
            <p className="eyebrow eyebrow--plain">Remote US coverage</p>
            <h2 className="section-title section-title--sm" id={`${hub.slug}-locations`}>
              Markets where {hub.h1.toLowerCase()} fits local operations
            </h2>
            <p className="section-sub" style={{ marginTop: "6px" }}>
              Delivered remotely nationwide with scheduled US time-zone overlap — no physical regional branch offices claimed.
            </p>
            <div className="location-pill-list" style={{ marginTop: "14px" }}>
              {locationMatches.states.map((st) => (
                <Link key={st.slug} href={`/locations/${st.slug}`} className="location-pill">
                  {st.name}
                </Link>
              ))}
              {locationMatches.cities.map((c) => (
                <Link key={`${c.stateSlug}-${c.slug}`} href={`/locations/${c.stateSlug}/${c.slug}`} className="location-pill location-pill--metro">
                  {c.name}
                </Link>
              ))}
              <Link href="/locations" className="location-pill location-pill--all">
                All 50 states + D.C. →
              </Link>
            </div>
          </div>
        </div>
      </section>
    ) : null;

  const relatedSection =
    visibleRelatedLinks.length > 0 ? (
      <section className="section section--tight" aria-labelledby={`${hub.slug}-related`}>
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Keep exploring</p>
            <h2 className="section-title section-title--sm" id={`${hub.slug}-related`}>
              Related services, tools and guides
            </h2>
          </div>
          <ul className="hub-card-grid">
            {visibleRelatedLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hub-link-card">
                  <span className="hub-link-card__kind">{item.kind}</span>
                  <span className="hub-link-card__title">
                    <span>{item.title}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{item.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    ) : null;

  // Vary information hierarchy cleanly per service discipline instead of using one mechanical sequence.
  const renderBody = () => {
    switch (enrichment.layoutVariant) {
      case "blueprint":
        return (
          <>
            {factsStrip}
            {scopeNotice}
            {problemsSection(false)}
            {architectureSection(true)}
            {scenariosSection(false)}
            {deliverablesSection(true)}
            {integrationsSection(false)}
            {decisionSection(true)}
            {industriesSection(false)}
            {demoSection(true)}
            {toolSection}
            {processSection(false)}
            {spokesSection}
          </>
        );
      case "editorial-split":
        return (
          <>
            {factsStrip}
            {demoSection(false)}
            {problemsSection(true)}
            {deliverablesSection(false)}
            {integrationsSection(true)}
            {scenariosSection(false)}
            {industriesSection(true)}
            {toolSection}
            {processSection(false)}
            {spokesSection}
          </>
        );
      case "guardrail":
        return (
          <>
            {factsStrip}
            {scopeNotice}
            {architectureSection(false)}
            {problemsSection(true)}
            {demoSection(false)}
            {decisionSection(true)}
            {deliverablesSection(false)}
            {scenariosSection(true)}
            {integrationsSection(false)}
            {industriesSection(true)}
            {processSection(false)}
            {spokesSection}
          </>
        );
      case "showcase-first":
        return (
          <>
            {factsStrip}
            {demoSection(false)}
            {problemsSection(true)}
            {deliverablesSection(false)}
            {decisionSection(true)}
            {scenariosSection(false)}
            {integrationsSection(true)}
            {industriesSection(false)}
            {toolSection}
            {processSection(true)}
            {spokesSection}
          </>
        );
      case "ledger":
        return (
          <>
            {factsStrip}
            {architectureSection(false)}
            {demoSection(true)}
            {problemsSection(false)}
            {deliverablesSection(true)}
            {scenariosSection(false)}
            {integrationsSection(true)}
            {industriesSection(false)}
            {processSection(true)}
            {spokesSection}
          </>
        );
      case "system-gallery":
        return (
          <>
            {factsStrip}
            {demoSection(false)}
            {credentialsSection}
            {problemsSection(true)}
            {deliverablesSection(false)}
            {scenariosSection(true)}
            {integrationsSection(false)}
            {industriesSection(true)}
            {processSection(false)}
            {spokesSection}
          </>
        );
      case "waterfall":
        return (
          <>
            {factsStrip}
            {scopeNotice}
            {architectureSection(false)}
            {toolSection}
            {problemsSection(true)}
            {deliverablesSection(false)}
            {demoSection(true)}
            {scenariosSection(false)}
            {industriesSection(true)}
            {integrationsSection(false)}
            {processSection(true)}
            {spokesSection}
          </>
        );
      case "pipeline":
        return (
          <>
            {factsStrip}
            {scopeNotice}
            <section className="section section--surface" id="motion-examples" aria-labelledby="creative-motion-demos">
              <div className="container">
                <div className="section-head">
                  <p className="eyebrow eyebrow--plain">Playable Video Portfolio &amp; Studio Motion Demos · Lazy-Loaded</p>
                  <h2 className="section-title" id="creative-motion-demos">
                    Authorized video edits, short-form social reels &amp; studio motion demos
                  </h2>
                  <p className="section-sub">
                    Filter by format or work type and click play on any poster to stream the web-optimized H.264 clip on demand — zero video bytes download until you press play.
                  </p>
                </div>
                <VideoShowcasePlayer videos={APPROVED_PUBLIC_VIDEOS} enableFilters notice={CLIENT_VIDEO_RIGHTS_NOTICE} />
              </div>
            </section>
            {architectureSection(false)}
            {demoSection(true)}
            {problemsSection(false)}
            {deliverablesSection(true)}
            {scenariosSection(false)}
            {integrationsSection(true)}
            {industriesSection(false)}
            {processSection(true)}
            {spokesSection}
          </>
        );
    }
  };

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: hub.h1,
          description: hub.lead,
          path,
          serviceType: hub.title,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: hub.h1, path },
        ]}
      />

      <PageHero
        eyebrow={enrichment.eyebrow}
        title={hub.h1}
        lead={hub.lead}
        aside={enrichment.heroPreview || enrichment.heroVisual ? heroAside : undefined}
      >
        <p className="measure muted">{hub.intent}</p>
        <div className="hero__actions">
          <ButtonLink href={ctaHref}>{enrichment.heroCta}</ButtonLink>
          {enrichment.heroSecondary && isHrefRenderable(enrichment.heroSecondary.href) ? (
            <ButtonLink href={enrichment.heroSecondary.href} variant="secondary" icon={null}>
              {enrichment.heroSecondary.label}
            </ButtonLink>
          ) : null}
        </div>
      </PageHero>

      {!isIndexable(hub.publicationState) ? (
        <EditorNote>
          This hub is {hub.publicationState}. It renders on previews as noindex
          and will not be served in production until set to Published.
        </EditorNote>
      ) : null}

      {renderBody()}

      <ServiceMotion hubSlug={hub.slug} />

      <Faq
        id={`faq-${hub.slug}`}
        eyebrow="Common questions"
        title={`${hub.h1}: practical questions`}
        items={hub.faqs}
        surface
      />

      {locationsSection}

      {relatedSection}

      <section className="section section--tight" aria-label="Follow and share this service">
        <div className="container">
          <ArticleSocialBar
            articleUrl={`${siteBaseUrl().origin}${path}`}
            articleTitle={`${hub.h1} — Ali Arshad Personal Studio`}
            socials={activeSocials()}
            shareHeading="Share this service overview"
            shareCopy={`Comparing options for ${hub.h1.toLowerCase()} with your team? Share a direct link:`}
          />
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow={enrichment.cta.eyebrow}
        title={enrichment.cta.title}
        text={enrichment.cta.text}
        button={enrichment.cta.button}
        href={ctaHref}
        secondaryHref="/work"
        secondaryLabel="Explore portfolio work"
      />
    </>
  );
}
