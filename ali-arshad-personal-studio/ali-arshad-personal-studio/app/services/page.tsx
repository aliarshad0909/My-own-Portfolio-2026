import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Faq } from "@/components/ui/Faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { serviceListSchema, type FaqItem } from "@/lib/structured-data";
import { FlowDiagram, type FlowStep } from "@/components/services/FlowDiagram";
import { ServiceNav } from "@/components/services/ServiceNav";
import { PendingMedia, RelatedProjectList, ServiceShowcase } from "@/components/services/ServiceShowcase";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { SERVICES, contactHref, projectsForService, relatedWorkHref, type Service } from "@/lib/services";
import { GPU_COMPUTE_CONTACT_SERVICE, GPU_COMPUTE_PATH } from "@/lib/gpu-compute";
import { SERVICE_HUBS } from "@/lib/seo/service-hubs";
import { isIndexable } from "@/lib/seo/publication";

const PUBLISHED_HUBS = SERVICE_HUBS.filter((h) => isIndexable(h.publicationState));

export const metadata: Metadata = pageMetadata({
  title: "Services: Web Development, AI Automation, Video & 3D",
  description:
    "Creative production, web and software development, AI agents and automation, brand management and growth, global sourcing and specialist technical collaboration: six connected service areas from Ali Arshad's independent studio.",
  path: "/services",
});

/** Grounded in what the service sections and work pages actually say — no claims beyond them. */
const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What services does Ali Arshad offer?",
    a: "Six connected service areas: creative production (video editing, motion graphics and Blender 3D product visualization), web and software development with Next.js, React and TypeScript, AI agents and workflow automation with n8n, brand management and growth, global sourcing and supply chain coordination, and specialist technical collaboration for work that needs a partner. Each section on this page describes what a typical engagement covers.",
  },
  {
    q: "Can Ali build custom AI agents?",
    a: "Yes. AI agents and automation is a core service: scoped agents for support, sales and internal operations, with clear hand-offs wherever human judgement matters. The work section includes complete demonstration builds, including a customer support agent, a voice-based sales agent and an inbound lead-qualification workflow, each built end to end under a fictional brand and labelled as a demonstration.",
  },
  {
    q: "Can sales workflows be automated with n8n?",
    a: "Yes. n8n is the main automation tool used here. The inbound lead-qualification demonstration routes a new inquiry through validation, enrichment, scoring and follow-up steps, and the same pattern applies to quoting, onboarding and reporting. Automations are designed so repetitive steps run on their own and judgement calls stay with people.",
  },
  {
    q: "Does Ali develop e-commerce applications?",
    a: "Yes. Custom storefronts and the operational tooling around them: product catalogues with filtering and search, carts and checkout flows, order handling and inventory views. The Tessera Clayworks storefront in the case studies is a complete demonstration build of exactly this kind of project.",
  },
  {
    q: "What is included in a typical development engagement?",
    a: "A short discovery conversation, then a plain-language written scope: what will be built, in what order, what it costs and what it depends on from your side. Work is delivered in stages, and hand-over includes documentation and an agreement on what ongoing support looks like. Every project is quoted individually, and there is no fixed price list.",
  },
  {
    q: "How is specialist collaboration handled?",
    a: "Some projects need expertise outside my own, such as blockchain, advanced security or large-scale infrastructure. For those I stay your single point of contact, bring in qualified specialists, and say so upfront rather than presenting their work as mine.",
  },
];

/** The inquiry-to-follow-up flow illustrated under AI Agents & Automation. */
const AUTOMATION_FLOW: FlowStep[] = [
  { label: "New inquiry", detail: "Form, inbox or chat", icon: "mail" },
  { label: "AI qualification", detail: "Scored against your criteria", icon: "bot" },
  { label: "CRM update", detail: "Record created, owner assigned", icon: "layers" },
  { label: "Human follow-up", detail: "A person takes the real conversation", icon: "users", human: true },
];

/** The sourcing flow illustrated under Global Sourcing & Supply Chain. */
const SOURCING_FLOW: FlowStep[] = [
  { label: "Requirements", detail: "Specification, volume, target cost", icon: "briefcase" },
  { label: "Supplier research", detail: "Shortlist and first contact", icon: "globe" },
  { label: "Comparison", detail: "Quotes, samples, landed cost", icon: "trending" },
  { label: "Order coordination", detail: "Terms, production follow-up", icon: "check" },
  { label: "Shipping follow-up", detail: "Tracking through to arrival", icon: "clock" },
];

/** Renders the visual half of a section. Each service earns its own treatment. */
function ServiceVisual({ service }: { service: Service }) {
  const projects = projectsForService(service.id);

  if (service.id === "creative-production") {
    // Blender and Motion are tooling and scene systems; neither has a finished
    // render or film yet, so there is nothing truthful to show as a still.
    return (
      <PendingMedia
        heading="Showreel in preparation"
        lines={[
          "The 3D scene system and the media pipeline behind this service are built and tested, but no finished render or film has been produced yet.",
          "Rather than show a stock image or a frame from someone else's work, this space is held for real output.",
          "Earlier editing and motion work is being cleared for publication.",
        ]}
      />
    );
  }

  if (service.id === "ai-automation") {
    return (
      <div className="visual-stack">
        <FlowDiagram
          title="A typical inbound flow"
          steps={AUTOMATION_FLOW}
          caption="An illustration of how these pieces fit together, not a screenshot of a running system. The demonstrations below implement the qualification and support stages."
        />
        <RelatedProjectList projects={projects} />
      </div>
    );
  }

  if (service.id === "global-sourcing") {
    return (
      <div className="visual-stack">
        <FlowDiagram
          title="How a sourcing project runs"
          steps={SOURCING_FLOW}
          caption="The coordination sequence for a sourcing project. Supplier quality, customs clearance and delivery dates depend on third parties and are never guaranteed."
        />
        <RelatedProjectList projects={projects} />
      </div>
    );
  }

  if (projects.length === 0) return null;
  return <ServiceShowcase projects={projects} serviceTitle={service.title} />;
}

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={serviceListSchema()} />
      <PageHero
        eyebrow="Services"
        title={
          <>
            Creative and technical solutions, <span className="accent">built around your business</span>
          </>
        }
        lead="From cinematic content and digital products to intelligent automation and operational support, I help businesses turn complex ideas into practical, well-executed solutions."
      >
        <div className="hero__actions">
          <ButtonLink href="/contact">Discuss your project</ButtonLink>
          <ButtonLink href="/work" variant="secondary" icon={null}>
            Explore selected work
          </ButtonLink>
        </div>
      </PageHero>

      <ServiceNav services={SERVICES} />

      <section className="section section--flush-top" aria-label="Service areas">
        <div className="container service-stack">
          {SERVICES.map((s, i) => {
            const projects = projectsForService(s.id);
            const visual = <ServiceVisual service={s} />;
            return (
              <article
                key={s.id}
                id={s.id}
                className={`service-block ${i % 2 === 1 ? "service-block--reverse" : ""}`.trim()}
                aria-labelledby={`${s.id}-title`}
              >
                <div className="service-block__copy reveal">
                  <p className="service-block__index" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <div className="service-block__head">
                    <Icon name={s.icon} size={26} className="service-block__icon" />
                    <h2 className="section-title section-title--sm" id={`${s.id}-title`}>
                      {s.title}
                    </h2>
                  </div>
                  {s.partnerDelivered ? <span className="badge badge--partner">Delivered with partners</span> : null}

                  <p className="service-block__positioning">{s.positioning}</p>
                  <p className="service-block__desc">{s.description}</p>

                  <div className="service-block__grid">
                    <div className="service-block__col">
                      <h3 className="label">What this solves</h3>
                      <ul className="quote-list">
                        {s.problems.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="service-block__col">
                      <h3 className="label">Capabilities</h3>
                      <ul className="check-list">
                        {s.capabilities.map((c) => (
                          <li key={c}>
                            <Icon name="check" size={15} />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="service-block__col">
                      <h3 className="label">Typical deliverables</h3>
                      <ul className="plain-list">
                        {s.examples.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="service-block__col">
                      <h3 className="label">A good fit for</h3>
                      <ul className="plain-list">
                        {s.clients.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {s.note ? (
                    <p className="notice">
                      <Icon name="alert" size={18} />
                      <span>{s.note}</span>
                    </p>
                  ) : null}

                  <div className="service-block__actions">
                    <ButtonLink href={contactHref(s)}>Discuss a project</ButtonLink>
                    {projects.length > 0 ? (
                      <ButtonLink href={relatedWorkHref(s)} variant="secondary" icon={null}>
                        View related work
                      </ButtonLink>
                    ) : null}
                  </div>
                </div>

                {visual ? <div className="service-block__visual reveal">{visual}</div> : null}
              </article>
            );
          })}

          <p className="fine-print">
            Typical deliverables describe the shape of a project, not past client work. Every project is quoted individually after a conversation about
            goals, scope and timeline.
          </p>
        </div>
      </section>

      <section className="section section--tight" aria-label="In-depth service pages">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Dedicated service pages</p>
            <h2 className="section-title">Go deeper on a specific service</h2>
            <p className="section-sub">
              Each core service has its own deep-dive page with workflow architecture, deliverables, technology integrations, demonstration builds, specializations and FAQs.
            </p>
          </div>
          <ul className="hub-card-grid">
            {PUBLISHED_HUBS.map((h) => (
              <li key={h.slug}>
                <Link href={`/services/${h.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">Service hub</span>
                  <span className="hub-link-card__title">
                    <span>{h.h1}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                  <span className="hub-link-card__desc">{h.lead}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href={GPU_COMPUTE_PATH} className="hub-link-card">
                <span className="hub-link-card__kind">Consultation-led infrastructure</span>
                <span className="hub-link-card__title">
                  <span>RTX GPU compute rental</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Rent dedicated RTX server time for AI inference, model testing, or 3D GPU rendering — scoped by meeting with a custom hourly quote.
                </span>
              </Link>
            </li>
          </ul>
          <div className="panel location-fit-strip" style={{ marginTop: "24px" }}>
            <p className="eyebrow eyebrow--plain">Consultation-led GPU compute</p>
            <h3 className="section-title section-title--sm" style={{ marginTop: "6px" }}>
              Need dedicated RTX compute time instead of a self-serve cloud cluster?
            </h3>
            <p className="section-sub" style={{ marginTop: "6px" }}>
              Submit your workload requirements, review fit with Ali in a short call, verify actual server capacity, and get a custom hourly quote.
            </p>
            <div className="hero__actions" style={{ marginTop: "14px" }}>
              <ButtonLink href={GPU_COMPUTE_PATH}>Review GPU compute process</ButtonLink>
              <ButtonLink
                href={`/contact?service=${encodeURIComponent(GPU_COMPUTE_CONTACT_SERVICE)}`}
                variant="secondary"
                icon={null}
              >
                Submit workload brief
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <Faq id="services-faq" eyebrow="Common questions" title="Questions clients usually start with" items={FAQ_ITEMS} surface />

      <ContactCTA
        standalone
        title="Not sure where to start? Let's work backward from your goal."
        text="Tell me what you're trying to build, improve or automate. I'll help identify the right technical and creative approach, even if that means a smaller project than you expected."
        button="Start a conversation"
      />
    </>
  );
}
