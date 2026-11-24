import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { FlowDiagram, type FlowStep } from "@/components/services/FlowDiagram";
import { ServiceNav } from "@/components/services/ServiceNav";
import { PendingMedia, RelatedProjectList, ServiceShowcase } from "@/components/services/ServiceShowcase";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { GPU_COMPUTE_CONTACT_SERVICE, GPU_COMPUTE_PATH } from "@/lib/gpu-compute";
import { pageMetadata } from "@/lib/seo";
import { isIndexable } from "@/lib/seo/publication";
import { SERVICE_HUBS, type ServiceHub } from "@/lib/seo/service-hubs";
import { SERVICES, contactHref, projectsForService, relatedWorkHref, type Service } from "@/lib/services";
import { professionalServiceSchema, serviceListSchema, type FaqItem } from "@/lib/structured-data";

const PUBLISHED_HUBS = SERVICE_HUBS.filter((h) => isIndexable(h.publicationState));

function hubsForPillar(pillarId: string): ServiceHub[] {
  return PUBLISHED_HUBS.filter((h) => h.pillarId === pillarId);
}

export const metadata: Metadata = pageMetadata({
  title: "Services: Web Development, AI Automation, Video & 3D",
  description:
    "Compare creative production, Next.js and React web development, AI agents, n8n workflow automation, brand management, global sourcing, and specialist collaboration — delivered remotely from Ali Arshad's independent studio.",
  path: "/services",
});

/** Scannable comparison rows grounded strictly in existing services and verified repo builds. */
const COMPARISON_ROWS: {
  id: string;
  name: string;
  href: string;
  bestFor: string;
  deliverables: string;
  proof: { label: string; href: string; kind: "Live demo" | "Locally tested" | "Pipeline tested" | "Partner-led" };
  niches: { label: string; href: string }[];
}[] = [
  {
    id: "web-development",
    name: "Web & Software Development",
    href: "/services/web-development",
    bestFor: "Founders & teams outgrowing templates, launching MVPs, or replacing spreadsheets with custom software",
    deliverables: "Next.js App Router apps, React portals, custom CRMs, storefronts, REST APIs & PostgreSQL backends",
    proof: { label: "PipelineOS CRM (live) & StockFlow (live)", href: "/products/pipelineos-crm", kind: "Live demo" },
    niches: [
      { label: "Next.js", href: "/services/web-development/nextjs" },
      { label: "Custom CRM", href: "/services/web-development/custom-crm-development" },
      { label: "API Integration", href: "/services/web-development/api-integration" },
      { label: "Custom Storefronts", href: "/services/ecommerce-development/custom-storefronts" },
      { label: "Inventory Software", href: "/services/business-dashboards/inventory-software" },
    ],
  },
  {
    id: "ai-automation",
    name: "AI Agents & n8n Automation",
    href: "/services/n8n-automation",
    bestFor: "Sales, support & ops teams drowning in manual copy-paste work, slow lead follow-up, or repetitive FAQs",
    deliverables: "Self-hostable n8n workflows, grounded BM25/RAG support agents, voice/chat lead qualification & CRM sync",
    proof: { label: "Tideline, Kestrel & 15-node n8n workflow", href: "/case-studies/inbound-lead-qualification-workflow", kind: "Locally tested" },
    niches: [
      { label: "Google Workspace", href: "/services/n8n-automation/google-workspace-automation" },
      { label: "CRM Automation", href: "/services/n8n-automation/crm-automation" },
      { label: "Lead Qualification", href: "/services/n8n-automation/lead-qualification" },
      { label: "Support Agents", href: "/services/ai-agents/support" },
      { label: "Sales Agents", href: "/services/ai-agents/sales" },
    ],
  },
  {
    id: "creative-production",
    name: "Creative Production",
    href: "/services/creative-production",
    bestFor: "Product brands & founders needing launch edits, UI motion explainers, or web-optimized video delivery",
    deliverables: "Hook-first video edits, motion graphics, 9:16/4:5/16:9 ad cuts, H.264/VP9 web encodes & scripted Blender scenes",
    proof: { label: "Motion Media Pipeline (28 ffmpeg tests)", href: "/case-studies/motion-production-pipeline", kind: "Pipeline tested" },
    niches: [
      { label: "Video Editing", href: "/services/creative-production/video-editing" },
      { label: "Motion Graphics", href: "/services/creative-production/motion" },
      { label: "Social Video Ads", href: "/services/creative-production/social-video" },
    ],
  },
  {
    id: "brand-growth",
    name: "Brand Management & Growth",
    href: "/services/branding",
    bestFor: "US & international brands needing a developer-ready visual system, steady social publishing, or email/ad alignment",
    deliverables: "WCAG-checked brand systems, SVG kits, social operations, 600px HTML email templates & campaign landing pages",
    proof: { label: "Halcyon Brand System (50 checks) & HubSpot/Google certs", href: "/case-studies/halcyon-brand-system", kind: "Locally tested" },
    niches: [
      { label: "Brand Identity", href: "/services/branding/identity" },
      { label: "Social Management", href: "/services/branding/social-media-management" },
      { label: "Email Marketing", href: "/services/branding/email-marketing" },
      { label: "Paid Ad Support", href: "/services/branding/paid-advertising-support" },
    ],
  },
  {
    id: "global-sourcing",
    name: "Global Sourcing & Supply Chain",
    href: "/services/global-sourcing",
    bestFor: "Ecommerce sellers & physical product brands vetting factories, comparing mixed incoterms, or modelling landed margin",
    deliverables: "Standardised RFQs, direct-contact supplier shortlists, weighted scorecards & volumetric landed-cost models",
    proof: { label: "Lantern Sourcing (52 tests) & Landed Cost Tool", href: "/case-studies/lantern-sourcing-platform", kind: "Locally tested" },
    niches: [
      { label: "Supplier Research", href: "/services/global-sourcing/supplier-research" },
      { label: "Supplier Comparison", href: "/services/global-sourcing/supplier-comparison" },
      { label: "Landed-Cost Analysis", href: "/services/global-sourcing/landed-cost-analysis" },
    ],
  },
  {
    id: "specialist-collaboration",
    name: "Specialist Technical Collaboration",
    href: "/studio-network",
    bestFor: "Multi-discipline builds needing security reviews, blockchain engineering, or parallel sprint capacity under one lead",
    deliverables: "Upfront specialist scoping, single-point project coordination & transparent independent collaborator attribution",
    proof: { label: "Sentryline Security & Ledgerlight Explorer", href: "/studio-network", kind: "Partner-led" },
    niches: [
      { label: "Studio Network", href: "/studio-network" },
      { label: "RTX GPU Compute (Consultation)", href: GPU_COMPUTE_PATH },
    ],
  },
];

/** Grounded in what the service sections and work pages actually say — no claims beyond them. */
const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What services does Ali Arshad offer?",
    a: "Six connected service areas: creative production (video editing, motion graphics and Blender 3D product visualization), web and software development with Next.js, React and TypeScript, AI agents and workflow automation with n8n, brand management and growth, global sourcing and supply chain coordination, and specialist technical collaboration for work that needs a partner. Dedicated consultation-led RTX GPU compute rental is also available on a scoped hourly basis.",
  },
  {
    q: "How do you work remotely with US and international clients?",
    a: "Ali Arshad Personal Studio operates remotely as an independent studio of one, with scheduled US time-zone overlap for discovery calls and milestone reviews. Every project starts with a plain-language written scope and ships through reviewable staging previews, with full repository and account ownership handed over directly. No physical regional offices are claimed.",
  },
  {
    q: "Are the portfolio projects real client engagements or demonstrations?",
    a: "The portfolio case studies and 12 SaaS applications in the Product Directory are clearly labeled studio demonstrations built under fictional companies and seeded data — including publicly deployed live sandboxes for PipelineOS CRM (crm.aliarshad.co) and StockFlow Inventory (stock.aliarshad.co). They prove real engineering execution without fabricating client claims.",
  },
  {
    q: "Can Ali build custom AI agents and n8n workflows?",
    a: "Yes. AI agents and n8n automation are core services: scoped agents for support, sales qualification and knowledge retrieval, plus self-hostable n8n workflows with tested JavaScript Code nodes, error workflows and human approval gates where judgement matters.",
  },
  {
    q: "Does Ali develop custom e-commerce storefronts and inventory systems?",
    a: "Yes. From custom Next.js storefronts with integer-cent pricing and stock-enforced checkouts (demonstrated in Tessera Clayworks) to append-only multi-warehouse inventory backends (demonstrated live in StockFlow and locally in Meridian). Where standard Shopify is simpler and cheaper, I recommend it honestly.",
  },
  {
    q: "What is included in a typical engagement?",
    a: "A short discovery conversation, then a plain-language written scope covering what will be built, in what order, what it costs and what it depends on from your side. Work is delivered in reviewable stages, and hand-over includes documentation and an agreed support arrangement. Every project is quoted individually with no fixed public rate sheet.",
  },
  {
    q: "How is specialist collaboration handled?",
    a: "Some projects need expertise outside my own, such as blockchain, deep security reviews or parallel native mobile sprints. For those I stay your single point of contact, bring in vetted independent specialists through the Studio Network, and disclose partner involvement upfront rather than presenting their work as mine.",
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
  const hubsWithSpokes = PUBLISHED_HUBS.filter((h) => h.spokes.some((s) => isIndexable(s.publicationState)));

  return (
    <>
      <JsonLd
        data={professionalServiceSchema(
          PUBLISHED_HUBS.map((h) => ({ name: h.h1, path: `/services/${h.slug}` })),
        )}
      />
      <JsonLd data={serviceListSchema()} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ]}
      />
      <PageHero
        eyebrow="Services · Remote Independent Studio"
        title={
          <>
            Creative and technical solutions, <span className="accent">built around your business</span>
          </>
        }
        lead="Compare six connected disciplines — software engineering, AI automation, creative production, brand growth, global sourcing, and transparent specialist collaboration — delivered remotely for US and international teams."
      >
        <div className="hero__actions">
          <ButtonLink href="/contact">Discuss your project</ButtonLink>
          <ButtonLink href="/project-planner" variant="secondary" icon={null}>
            Visual Project Planner
          </ButtonLink>
          <ButtonLink href="#compare-services" variant="secondary" icon={null}>
            Compare services
          </ButtonLink>
          <ButtonLink href="/products" variant="secondary" icon={null}>
            Try live SaaS demos
          </ButtonLink>
        </div>
      </PageHero>

      <ServiceNav services={SERVICES} />

      <section className="section section--tight" id="compare-services" aria-labelledby="compare-services-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Quick comparison</p>
            <h2 className="section-title section-title--sm" id="compare-services-title">
              Find the right service for your bottleneck
            </h2>
            <p className="section-sub">
              Every engagement starts with a plain-language written scope. Compare fit, typical deliverables, verifiable studio demonstrations, and focused niche pages below.
            </p>
          </div>

          <div className="decision-table-wrap">
            <table className="decision-table decision-table--services">
              <thead>
                <tr>
                  <th scope="col">Service Area</th>
                  <th scope="col">Best Fit</th>
                  <th scope="col">Core Deliverables</th>
                  <th scope="col">Supporting Proof</th>
                  <th scope="col">Focused Niche Pages</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">
                      <Link href={row.href} className="service-compare__link">
                        {row.name}
                      </Link>
                      <span className="service-compare__jump">
                        <a href={`#${row.id}`}>Read overview ↓</a>
                      </span>
                    </th>
                    <td>{row.bestFor}</td>
                    <td>{row.deliverables}</td>
                    <td>
                      <span className="service-compare__badge">{row.proof.kind}</span>
                      <Link href={row.proof.href} className="service-compare__proof-link">
                        {row.proof.label}
                      </Link>
                    </td>
                    <td>
                      <div className="service-compare__pills">
                        {row.niches.map((niche) => (
                          <Link key={niche.href} href={niche.href} className="location-pill">
                            {niche.label}
                          </Link>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section section--flush-top" aria-label="Service areas">
        <div className="container service-stack">
          {SERVICES.map((s, i) => {
            const projects = projectsForService(s.id);
            const visual = <ServiceVisual service={s} />;
            const matchedHubs = hubsForPillar(s.id);
            const matchedSpokes = matchedHubs.flatMap((h) =>
              h.spokes
                .filter((sp) => isIndexable(sp.publicationState))
                .map((sp) => ({ hubSlug: h.slug, slug: sp.slug, label: sp.h1 })),
            );

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

                  {matchedHubs.length > 0 || s.id === "specialist-collaboration" ? (
                    <div className="service-block__niches">
                      <p className="label">Dedicated hubs &amp; focused niche pages</p>
                      <div className="location-pill-list">
                        {matchedHubs.map((hub) => (
                          <Link key={hub.slug} href={`/services/${hub.slug}`} className="location-pill location-pill--all">
                            {hub.h1} →
                          </Link>
                        ))}
                        {matchedSpokes.map((sp) => (
                          <Link key={`${sp.hubSlug}/${sp.slug}`} href={`/services/${sp.hubSlug}/${sp.slug}`} className="location-pill">
                            {sp.label}
                          </Link>
                        ))}
                        {s.id === "specialist-collaboration" ? (
                          <>
                            <Link href="/studio-network" className="location-pill location-pill--all">
                              Studio Network →
                            </Link>
                            <Link href={GPU_COMPUTE_PATH} className="location-pill">
                              RTX GPU Compute (Consultation)
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

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

      <section className="section section--surface section--tight" aria-labelledby="remote-delivery-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Remote-first collaboration</p>
            <h2 className="section-title section-title--sm" id="remote-delivery-title">
              How I work remotely with US and international clients
            </h2>
            <p className="section-sub">
              Ali Arshad Personal Studio is an independent studio of one operating remotely — no physical US branch offices or staffed agency layers are claimed.
            </p>
          </div>
          <div className="remote-delivery-grid">
            <div className="panel">
              <h3 className="card-title">Scheduled time-zone overlap</h3>
              <p className="section-sub" style={{ marginTop: "8px" }}>
                Discovery calls, milestone demos, and scope reviews schedule around US Eastern, Central, Mountain, and Pacific working hours, backed by crisp async written updates between calls.
              </p>
            </div>
            <div className="panel">
              <h3 className="card-title">Written scope &amp; staged previews</h3>
              <p className="section-sub" style={{ marginTop: "8px" }}>
                Before writing code or cutting assets, you get a plain-language scope and milestone order. You test real preview URLs and reviewable cuts at each stage rather than waiting for a final reveal.
              </p>
            </div>
            <div className="panel">
              <h3 className="card-title">Full ownership &amp; honest boundaries</h3>
              <p className="section-sub" style={{ marginTop: "8px" }}>
                Repositories, n8n workflow JSON, brand SVGs, and hosting accounts belong to your business. Where specialist depth is required, independent partners via <Link href="/studio-network">the Studio Network</Link> are disclosed upfront.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-label="In-depth service pages">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Dedicated service hubs</p>
            <h2 className="section-title">Go deeper on a specific service</h2>
            <p className="section-sub">
              Each core service has its own deep-dive hub with workflow architecture, deliverables, technology integrations, demonstration builds, specializations and FAQs.
            </p>
          </div>
          <ul className="hub-card-grid">
            {PUBLISHED_HUBS.map((h) => (
              <li key={h.slug}>
                <Link href={`/services/${h.slug}`} className="hub-link-card">
                  <span className="hub-link-card__kind">
                    Service hub · {h.spokes.filter((s) => isIndexable(s.publicationState)).length} niche pages
                  </span>
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

          <div className="niche-directory" style={{ marginTop: "36px" }}>
            <div className="section-head">
              <p className="eyebrow eyebrow--plain">Focused specializations</p>
              <h2 className="section-title section-title--sm">Explore all published service niche pages</h2>
              <p className="section-sub">
                Distinct deep-dive pages covering specific deliverables, architectures, tools, and verified demonstrations — zero swapped-keyword doorway pages.
              </p>
            </div>
            <div className="niche-directory-grid">
              {hubsWithSpokes.map((hub) => {
                const liveSpokes = hub.spokes.filter((s) => isIndexable(s.publicationState));
                return (
                  <div key={hub.slug} className="panel niche-directory__group">
                    <h3 className="card-title">
                      <Link href={`/services/${hub.slug}`}>{hub.h1}</Link>
                    </h3>
                    <ul className="niche-directory__list">
                      {liveSpokes.map((sp) => (
                        <li key={sp.slug}>
                          <Link href={`/services/${hub.slug}/${sp.slug}`}>
                            <span>{sp.h1}</span>
                            <Icon name="arrow-up-right" size={14} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel location-fit-strip" style={{ marginTop: "28px" }}>
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
