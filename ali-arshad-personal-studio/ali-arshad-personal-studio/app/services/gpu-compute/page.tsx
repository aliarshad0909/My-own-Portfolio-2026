import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { GpuNodeVisual3D } from "@/components/services/GpuNodeVisual3D";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { EditorialMedia } from "@/components/ui/EditorialMedia";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { InteractiveTiltCard } from "@/components/ui/InteractiveTiltCard";
import { PageHero } from "@/components/ui/PageHero";
import { StatusBadge, TypeBadge } from "@/components/ui/StatusBadge";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { getState } from "@/lib/geo/states";
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
  GPU_TOPIC_PAGES,
  GPU_WORKLOADS,
} from "@/lib/gpu-compute";
import { getProject } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { singleServiceSchema } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "GPU & Compute — Modest, Quote-Led Single-Host Server Access",
  description:
    "Small, limited-capacity GPU & Linux compute scoped directly with Ali Arshad for 3D rendering, dev/test environments, batch processing, and bounded AI inference — quote-led, never overstated as a hyperscaler cloud.",
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
          name: "GPU & Compute Access (Quote-Led, Small Capacity)",
          description:
            "Consultation-led single-host GPU and Linux compute access for suitable 3D rendering, dev/test environments, batch processing, and bounded inference — with real capacity and custom quotes confirmed per request.",
          path: GPU_COMPUTE_PATH,
          serviceType: "GPU & Compute Consultation",
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "GPU & Compute", path: GPU_COMPUTE_PATH },
        ]}
      />

      <PageHero
        eyebrow="Small-Capacity Compute · Quote-Led Access"
        title={
          <>
            Practical GPU &amp; Linux compute, <span className="accent">scoped honestly per workload</span>
          </>
        }
        lead="Modest, operator-run compute time for 3D rendering, temporary Linux dev/test environments, batch processing, and bounded AI evaluation — with direct technical review instead of hyperscaler guesswork."
        aside={<GpuNodeVisual3D />}
      >
        <p className="measure muted">
          This is a small, limited-capacity single-host offer run directly by Ali Arshad — not an AWS or Oracle-scale cloud platform. Exact
          hardware specifications, current availability, storage limits, and pricing are verified and confirmed in writing per request.
        </p>
        <div className="hero__actions">
          <ButtonLink href="/tools/gpu-quote-estimator">Scope workload &amp; request quote</ButtonLink>
          <ButtonLink href={contactHref} variant="secondary" icon={null}>
            Ask about current availability
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container" aria-label="Service boundary notice">
        <p className="notice notice--wide">
          <Icon name="alert" size={18} />
          <span>
            <strong>Clear capacity &amp; pricing boundary:</strong> No self-serve checkout, guaranteed regions, uptime SLA, or enterprise
            compliance certifications are claimed here. Hardware fit, live availability, access method, backup responsibility, and custom pricing
            are confirmed in writing before any engagement starts.
          </span>
        </p>
      </section>

      {/* Focused GPU & Compute Deep-Dive Directory (6 Subpages) */}
      <section className="section section--tight" aria-labelledby="gpu-guides-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Complete GPU &amp; Compute documentation</p>
            <h2 className="section-title section-title--sm" id="gpu-guides-title">
              Six focused guides covering access, workloads, storage, security, and onboarding
            </h2>
            <p className="section-sub">
              Review the exact operational boundaries before submitting a workload brief so there are zero surprises after kickoff.
            </p>
          </div>

          <ul className="hub-card-grid">
            {GPU_TOPIC_PAGES.map((topic, idx) => (
              <li key={topic.slug}>
                <Link href={`${GPU_COMPUTE_PATH}/${topic.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">
                    {String(idx + 1).padStart(2, "0")} · GPU &amp; Compute Guide
                  </span>
                  <span className="hub-link-card__title">
                    <span>{topic.navLabel}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{topic.lead}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Realistic Documentary Visual Pair + Selective Interactive 3D Operational Boundary Card */}
      <section className="section section--surface" aria-labelledby="gpu-visuals-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">How the environment works in practice</p>
            <h2 className="section-title" id="gpu-visuals-title">
              Real terminal workflow, transparent hardware boundaries
            </h2>
            <p className="section-sub">
              Whether you connect over key-based SSH or hand off a Blender/batch job for operator execution, both sides agree on exact
              responsibilities upfront.
            </p>
          </div>

          <div className="editorial-pair">
            <EditorialMedia
              src="/images/services/gpu-workstation-console.jpg"
              alt="Software engineer working at a dark desk using a Linux SSH terminal console on a matte monitor"
              badge="Illustrative editorial photo"
              caption="Key-based SSH shell, scoped container workspace, or operator-run batch delivery agreed during kickoff."
              priority
            />
            <EditorialMedia
              src="/images/services/gpu-server-hardware.jpg"
              alt="Close-up editorial photograph of a matte-black workstation chassis with brushed-aluminum GPU heatsink and NVMe storage bay"
              badge="Illustrative editorial photo"
              caption="Single-host studio compute — exact current CPU, GPU VRAM, host RAM, and disk quota verified before every booking."
            />
          </div>

          <div className="tilt3d-spotlight" style={{ marginTop: "28px" }}>
            <InteractiveTiltCard label="Operator vs. customer compute responsibilities">
              <div className="tilt3d-card__head">
                <span className="badge badge--demo">Interactive 3D Overview · Shared Responsibility</span>
                <h3 className="card-title" style={{ marginTop: "8px" }}>
                  What Ali handles vs. what the customer handles
                </h3>
              </div>
              <div className="tilt3d-card__cols">
                <div>
                  <p className="label">Operator (Ali Arshad)</p>
                  <ul className="check-list">
                    <li>
                      <Icon name="check" size={15} />
                      <span>Honest hardware fit &amp; live availability verification before quoting</span>
                    </li>
                    <li>
                      <Icon name="check" size={15} />
                      <span>Key-based SSH / scoped workspace provisioning &amp; post-run cleanup</span>
                    </li>
                    <li>
                      <Icon name="check" size={15} />
                      <span>Optional Blender, Docker, or pipeline setup assistance when scoped</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="label">Customer</p>
                  <ul className="check-list">
                    <li>
                      <Icon name="check" size={15} />
                      <span>Keeping authoritative off-host backups of code, datasets, and renders</span>
                    </li>
                    <li>
                      <Icon name="check" size={15} />
                      <span>Managing application dependencies, checkpoints, and output retrieval</span>
                    </li>
                    <li>
                      <Icon name="check" size={15} />
                      <span>Keeping regulated compliance data (HIPAA / SOC 2 / PCI) on certified clouds</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="hero__actions" style={{ marginTop: "16px" }}>
                <Link href={`${GPU_COMPUTE_PATH}/security`} className="arrow-link">
                  <span>Read Security &amp; Operational Boundaries</span>
                  <Icon name="arrow-right" size={15} />
                </Link>
                <Link href={`${GPU_COMPUTE_PATH}/storage-backups`} className="arrow-link">
                  <span>Read Storage &amp; Backups Policy</span>
                  <Icon name="arrow-right" size={15} />
                </Link>
              </div>
            </InteractiveTiltCard>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="gpu-process-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">How bookings work</p>
            <h2 className="section-title" id="gpu-process-title">
              Consultation first — written quote after checking real capacity
            </h2>
            <p className="section-sub">
              Every job goes through four straightforward steps so you never pay for a machine that cannot actually fit your software or schedule.
            </p>
          </div>

          <ol className="hub-process">
            {GPU_CONSULTATION_PROCESS.map((item) => (
              <li key={item.step} className="hub-process__step">
                <div className="hub-process__top">
                  <span className="hub-process__num">{item.step}</span>
                  <span className="hub-process__cadence">Stage</span>
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
            <p className="eyebrow eyebrow--plain">Practical workloads (non-AI &amp; AI)</p>
            <h2 className="section-title" id="gpu-workloads-title">
              Workloads evaluated where supported by confirmed hardware
            </h2>
            <p className="section-sub">
              Focused on practical rendering, Linux dev/test, batch processing, and modest inference — never marketed as an enterprise cloud fleet.
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

          <div style={{ marginTop: "20px" }}>
            <Link href={`${GPU_COMPUTE_PATH}/workloads`} className="arrow-link">
              <span>See full supported vs. unsupported workload limits</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="hardware-specs" aria-labelledby="hardware-specs-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Parameters confirmed per request</p>
            <h2 className="section-title" id="hardware-specs-title">
              What gets verified in writing before any compute booking
            </h2>
            <p className="section-sub">
              No unverified hardware claims or placeholder rates — every operational detail is checked against live host state before you approve.
            </p>
          </div>

          <div className="decision-table-wrap">
            <table className="decision-table">
              <thead>
                <tr>
                  <th scope="col">Parameter</th>
                  <th scope="col">How it is confirmed</th>
                  <th scope="col">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {GPU_COMPUTE_SPECS.map((row) => (
                  <tr key={row.parameter}>
                    <th scope="row">{row.parameter}</th>
                    <td>{row.value}</td>
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
              <p className="eyebrow eyebrow--plain">Related studio demonstrations</p>
              <h2 className="section-title section-title--sm" id="gpu-projects-title">
                Repository builds tied to 3D rendering, media encoding, and AI pipelines
              </h2>
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
            <p className="eyebrow eyebrow--plain">Related tools &amp; services</p>
            <h2 className="section-title section-title--sm" id="gpu-links-title">
              Estimators and connected studio capabilities
            </h2>
          </div>

          <ul className="hub-card-grid">
            {GPU_RELATED_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className="hub-link-card">
                  <span className="hub-link-card__kind">Calculator / Estimator</span>
                  <span className="hub-link-card__title">
                    <span>{tool.title}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{tool.description}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services/creative-production" className="hub-link-card">
                <span className="hub-link-card__kind">Related service</span>
                <span className="hub-link-card__title">
                  <span>Creative production &amp; Blender 3D</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">Scripted Blender Cycles scenes, product turntables, and web-ready video pipelines.</span>
              </Link>
            </li>
            <li>
              <Link href="/services/ai-agents" className="hub-link-card">
                <span className="hub-link-card__kind">Related service</span>
                <span className="hub-link-card__title">
                  <span>AI agents &amp; n8n automation</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">Scoped workflows and grounded agents with human review boundaries.</span>
              </Link>
            </li>
            <li>
              <Link href="/services/product-sourcing" className="hub-link-card">
                <span className="hub-link-card__kind">Related service</span>
                <span className="hub-link-card__title">
                  <span>Product Sourcing &amp; Logistics</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">Supplier coordination, sample checks, quality assurance, and landed-cost modeling.</span>
              </Link>
            </li>
          </ul>

          {fitStates.length > 0 ? (
            <div className="panel location-fit-strip" style={{ marginTop: "24px" }}>
              <p className="eyebrow eyebrow--plain">Remote consultations across US &amp; international time zones</p>
              <p className="section-sub" style={{ marginTop: "6px" }}>
                No claimed regional data centers or local offices — compute consultations and bookings are coordinated remotely with Ali.
              </p>
              <div className="location-pill-list" style={{ marginTop: "14px" }}>
                {fitStates.map((st) => (
                  <Link key={st.slug} href={`/locations/${st.slug}`} className="location-pill">
                    {st.name}
                  </Link>
                ))}
                {fitCities.map((c) => (
                  <Link key={`${c.stateSlug}-${c.slug}`} href={`/locations/${c.stateSlug}/${c.slug}`} className="location-pill location-pill--metro">
                    {c.name}
                  </Link>
                ))}
                <Link href="/locations" className="location-pill location-pill--all">
                  Remote coverage directory →
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <Faq
        id="faq-gpu-compute"
        eyebrow="Common questions"
        title="GPU & Compute: practical questions"
        items={GPU_COMPUTE_FAQS}
        surface
      />

      <ContactCTA
        standalone
        eyebrow="Availability & custom quote"
        title="Want to check if your rendering, dev/test, or batch job fits?"
        text="Use the scope estimator or send your workload requirements directly. Availability, verified host specs, and custom pricing are always confirmed in writing first."
        button="Ask about availability"
        href={contactHref}
        secondaryHref="/tools/gpu-quote-estimator"
        secondaryLabel="Open Workload Scope Estimator"
      />
    </>
  );
}
