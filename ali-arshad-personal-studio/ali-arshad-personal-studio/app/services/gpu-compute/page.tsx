import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { GpuNodeVisual3D } from "@/components/services/GpuNodeVisual3D";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { getState } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { getProject } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import {
  GPU_COMPUTE_CONTACT_SERVICE,
  GPU_COMPUTE_FAQS,
  GPU_COMPUTE_FIT_CITIES,
  GPU_COMPUTE_FIT_STATES,
  GPU_COMPUTE_PATH,
  GPU_COMPUTE_PUBLICATION_STATE,
  GPU_COMPUTE_SPECS,
  GPU_CONSULTATION_PROCESS,
  GPU_RELATED_PROJECT_SLUGS,
  GPU_RELATED_TOOLS,
  GPU_WORKLOADS,
} from "@/lib/gpu-compute";
import { breadcrumbSchema, singleServiceSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "RTX GPU Compute Rental: Consultation-Led Server Access",
  description:
    "Rent dedicated compute time on Ali Arshad's RTX server through a consultation-led process: submit workload requirements, discuss fit, verify capacity, and receive a custom hourly quote.",
  path: GPU_COMPUTE_PATH,
  index: isIndexable(GPU_COMPUTE_PUBLICATION_STATE),
});

export default function GpuComputePage() {
  const contactHref = `/contact?service=${encodeURIComponent(GPU_COMPUTE_CONTACT_SERVICE)}`;
  const relatedProjects = GPU_RELATED_PROJECT_SLUGS.map((slug) => getProject(slug)).filter(
    (p): p is NonNullable<typeof p> => p !== undefined,
  );
  const fitStates = GPU_COMPUTE_FIT_STATES.map((slug) => getState(slug)).filter(
    (s): s is NonNullable<typeof s> => s !== undefined && shouldRender(s.publicationState),
  );
  const fitCities = GPU_COMPUTE_FIT_CITIES.map((slug) => PILOT_CITIES.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => c !== undefined && shouldRender(c.publicationState),
  );

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: "RTX GPU Compute Rental (Consultation-Led)",
          description:
            "Consultation-led compute rental on Ali Arshad's RTX server for suitable AI inference, model testing, Blender Cycles rendering, and batch GPU tasks.",
          path: GPU_COMPUTE_PATH,
          serviceType: "GPU Compute Consultation & Rental",
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "RTX GPU Compute", path: GPU_COMPUTE_PATH },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "RTX GPU Compute", path: GPU_COMPUTE_PATH },
        ]}
      />

      <PageHero
        eyebrow="Consultation-Led Infrastructure · RTX Server"
        title={
          <>
            RTX GPU compute rental, <span className="accent">scoped around your workload</span>
          </>
        }
        lead="Rent dedicated compute time on Ali's RTX server for AI inference, model testing, 3D GPU rendering, and compatible batch workloads — scoped through a direct technical consultation rather than a self-serve cloud dashboard."
        aside={<GpuNodeVisual3D />}
      >
        <p className="measure muted">
          Not a self-serve cloud platform. Every engagement starts with your workload requirements, a short meeting to review technical fit, a real
          capacity check on the server, and a custom hourly quote.
        </p>
        <div className="hero__actions">
          <ButtonLink href={contactHref}>Submit workload requirements</ButtonLink>
          <ButtonLink href="#hardware-specs" variant="secondary" icon={null}>
            Review specification status
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container" aria-label="Service status notice">
        <p className="notice notice--wide">
          <Icon name="alert" size={18} />
          <span>
            <strong>Honest specification notice:</strong> Hardware specifications, VRAM capacity, availability windows, security controls, and hourly
            pricing below currently carry clear placeholders pending Ali&rsquo;s direct confirmation. Nothing on this page is fabricated; exact
            server details are confirmed before quoting. This page stays excluded from search indexing (noindex) until hardware specs are finalized.
          </span>
        </p>
      </section>

      <section className="section" aria-labelledby="gpu-process-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">How compute rental works</p>
            <h2 className="section-title" id="gpu-process-title">
              Consultation first — custom hourly quote after verifying fit
            </h2>
            <p className="section-sub">
              Because compute runs directly on Ali&rsquo;s RTX hardware rather than an elastic hyperscaler fleet, checking real memory, software, and
              schedule fit upfront avoids wasted setup hours and surprises.
            </p>
          </div>

          <figure className="article-figure" style={{ marginBottom: "2rem" }}>
            <div className="article-figure__frame article-figure__frame--dark-diagram">
              <Image
                src="/images/site-visuals/services/gpu-compute/rtx-consultation-workflow.svg"
                alt="Four-stage consultation-led RTX GPU compute workflow: submit workload requirements, discuss fit in a meeting, verify server capacity, and receive a custom hourly quote"
                width={1200}
                height={720}
                priority
                sizes="(min-width: 1024px) 1040px, 94vw"
              />
            </div>
            <figcaption className="article-figure__caption">
              <span>Consultation-led allocation diagram — workload scope and server headroom are confirmed before any booking.</span>
            </figcaption>
          </figure>

          <ol className="hub-process">
            {GPU_CONSULTATION_PROCESS.map((item) => (
              <li key={item.step} className="hub-process__step">
                <div className="hub-process__top">
                  <span className="hub-process__num">{item.step}</span>
                  <span className="hub-process__cadence">Consultation stage</span>
                </div>
                <h3 className="hub-process__label">{item.label}</h3>
                <p className="hub-process__detail">{item.detail}</p>
                <p className="hub-process__deliverable">{item.output}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="gpu-workloads-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Suitable workloads</p>
            <h2 className="section-title" id="gpu-workloads-title">
              GPU workloads evaluated where supported by confirmed hardware
            </h2>
            <p className="section-sub">
              Suitability is always verified against real VRAM, storage, and runtime requirements before any booking is accepted.
            </p>
          </div>

          <ul className="gpu-workload-grid">
            {GPU_WORKLOADS.map((w) => (
              <li key={w.title} className="panel gpu-workload-card">
                <div className="hub-deliverable__head">
                  <span className="hub-deliverable__icon" aria-hidden="true">
                    <Icon name={w.icon} size={18} />
                  </span>
                  <h3 className="hub-deliverable__title">{w.title}</h3>
                </div>
                <p className="hub-deliverable__detail">{w.summary}</p>
                <ul className="check-list" style={{ marginTop: "10px" }}>
                  {w.examples.map((ex) => (
                    <li key={ex}>
                      <Icon name="check" size={15} />
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
                <p className="fine-print" style={{ marginTop: "12px" }}>
                  {w.fitNote}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="hardware-specs" aria-labelledby="hardware-specs-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Hardware &amp; operational parameters</p>
            <h2 className="section-title" id="hardware-specs-title">
              Server configuration &amp; placeholders awaiting confirmation
            </h2>
            <p className="section-sub">
              Exact server capacity, supported runtimes, availability windows, security controls, and hourly pricing are confirmed directly by Ali
              rather than guessed on this page.
            </p>
          </div>

          <div className="decision-table-wrap">
            <table className="decision-table">
              <thead>
                <tr>
                  <th scope="col">Parameter</th>
                  <th scope="col">Current documentation status</th>
                  <th scope="col">Why it is checked during consultation</th>
                </tr>
              </thead>
              <tbody>
                {GPU_COMPUTE_SPECS.map((row) => (
                  <tr key={row.parameter}>
                    <th scope="row">{row.parameter}</th>
                    <td>
                      <span className="gpu-spec-placeholder">{row.value}</span>
                    </td>
                    <td>{row.whyItMatters}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {relatedProjects.length > 0 ? (
        <section className="section section--surface section--tight" aria-labelledby="gpu-projects-title">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow eyebrow--plain">Connected studio builds</p>
              <h2 className="section-title section-title--sm" id="gpu-projects-title">
                Demonstrations tied to AI, 3D rendering, and media pipelines
              </h2>
              <p className="section-sub">
                Each project below is a clearly labeled studio demonstration showing how we engineer AI agents, Blender Cycles scenes, and media
                pipelines — not client testimonials or hosted cloud benchmarks.
              </p>
            </div>
            <ul className="hub-card-grid">
              {relatedProjects.map((p) => {
                const href = p.caseStudy ? `/case-studies/${p.slug}` : `/work/${p.slug}`;
                return (
                  <li key={p.slug}>
                    <Link href={href} className="hub-link-card">
                      <span className="hub-link-card__kind">
                        <TypeBadge type={p.projectType} /> <StatusBadge status={p.status} />
                      </span>
                      <span className="hub-link-card__title">
                        <span>{p.title}</span>
                        <Icon name="arrow-up-right" size={16} />
                      </span>
                      <span className="hub-link-card__desc">{p.summary}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section section--tight" aria-labelledby="gpu-links-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Connected services, calculators &amp; US coverage</p>
            <h2 className="section-title section-title--sm" id="gpu-links-title">
              Related services, planning tools, and remote markets
            </h2>
          </div>

          <ul className="hub-card-grid">
            <li>
              <Link href="/services/ai-agents" className="hub-link-card">
                <span className="hub-link-card__kind">Related service</span>
                <span className="hub-link-card__title">
                  <span>AI agent development</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">Scoped support, sales, and retrieval agents with explicit human escalation.</span>
              </Link>
            </li>
            <li>
              <Link href="/services/creative-production" className="hub-link-card">
                <span className="hub-link-card__kind">Related service</span>
                <span className="hub-link-card__title">
                  <span>Creative production &amp; Blender 3D</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">Reproducible Blender Cycles product scenes, motion graphics, and web-optimized video.</span>
              </Link>
            </li>
            <li>
              <Link href="/services/n8n-automation" className="hub-link-card">
                <span className="hub-link-card__kind">Related service</span>
                <span className="hub-link-card__title">
                  <span>n8n workflow automation</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">Connect scheduled batch inference or media outputs cleanly into your CRM and storage.</span>
              </Link>
            </li>
            {GPU_RELATED_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className="hub-link-card">
                  <span className="hub-link-card__kind">Calculator</span>
                  <span className="hub-link-card__title">
                    <span>{tool.title}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{tool.description}</span>
                </Link>
              </li>
            ))}
          </ul>

          {fitStates.length > 0 ? (
            <div className="panel location-fit-strip" style={{ marginTop: "24px" }}>
              <p className="eyebrow eyebrow--plain">Remote US coverage for AI, engineering &amp; media teams</p>
              <p className="section-sub" style={{ marginTop: "6px" }}>
                RTX compute consultations are delivered remotely across the United States — zero implied regional data centers or local offices.
              </p>
              <div className="location-pill-list" style={{ marginTop: "14px" }}>
                {fitStates.map((st) => (
                  <Link key={st.slug} href={`/locations/${st.slug}`} className="location-pill">
                    {st.name}
                  </Link>
                ))}
                {fitCities.map((c) => (
                  <Link key={`${c.stateSlug}-${c.slug}`} href={`/locations/${c.stateSlug}/${c.slug}`} className="location-pill location-pill--metro">
                    {c.name} (preview)
                  </Link>
                ))}
                <Link href="/locations" className="location-pill location-pill--all">
                  All 50 states + D.C. →
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <Faq
        id="faq-gpu-compute"
        eyebrow="Common questions"
        title="RTX GPU compute consultation: practical questions"
        items={GPU_COMPUTE_FAQS}
        surface
      />

      <ContactCTA
        standalone
        eyebrow="Request a compute consultation"
        title="Have an AI inference, model testing, or 3D rendering job?"
        text="Share your workload requirements, estimated runtime, and software stack. We will review fit on a short call, confirm server capacity, and send a custom hourly quote."
        button="Submit workload requirements"
        href={contactHref}
        secondaryHref="/services"
        secondaryLabel="All studio services"
      />
    </>
  );
}
