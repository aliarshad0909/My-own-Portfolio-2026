import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { FlowDiagram, type FlowStep } from "@/components/services/FlowDiagram";
import { ServiceNav } from "@/components/services/ServiceNav";
import { PendingMedia, RelatedProjectList, ServiceShowcase } from "@/components/services/ServiceShowcase";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { SERVICES, contactHref, projectsForService, relatedWorkHref, type Service } from "@/lib/services";

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description:
    "Creative production, web and software development, AI agents and automation, brand management and growth, global sourcing and specialist technical collaboration — six connected service areas from Ali Arshad's independent studio.",
  path: "/services",
});

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

      <ContactCTA
        standalone
        title="Not sure where to start? Let's work backward from your goal."
        text="Tell me what you're trying to build, improve or automate. I'll help identify the right technical and creative approach — even if that means a smaller project than you expected."
        button="Start a conversation"
      />
    </>
  );
}
