import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { CreativeDemoShowcase } from "@/components/creative/CreativeDemoShowcase";
import { JsonLd } from "@/components/seo/JsonLd";
import { FlowDiagram, type FlowStep } from "@/components/services/FlowDiagram";
import { ServiceNav } from "@/components/services/ServiceNav";
import { PendingMedia, RelatedProjectList, ServiceShowcase } from "@/components/services/ServiceShowcase";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Faq } from "@/components/ui/Faq";
import { Icon, type IconName } from "@/components/ui/Icon";
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
    "Explore four clear service families — SaaS & Web Engineering, AI Agents & Automation, Creative & Brand Production, and Global Sourcing & Specialist Collaboration — aligned directly with working portfolio demonstrations.",
  path: "/services",
});

/** Four consolidated service families eliminating duplicate hub/niche directories while keeping every capability visible. */
type ServiceFamily = {
  id: string;
  icon: IconName;
  title: string;
  delivery: "Direct by Ali Arshad" | "Direct Sourcing + Partner-Led Specialists";
  bestFor: string;
  deliverables: string;
  workCollectionHref: string;
  workCollectionLabel: string;
  proof: { label: string; href: string; kind: "Live Demo" | "Locally Tested" | "Pipeline Tested" | "Partner-Led" };
  pillarIds: string[];
  hubSlugs: string[];
  extraLinks?: { label: string; href: string }[];
};

const SERVICE_FAMILIES: ServiceFamily[] = [
  {
    id: "family-web-saas",
    icon: "code",
    title: "SaaS, Web Apps, E-Commerce & Dashboards",
    delivery: "Direct by Ali Arshad",
    bestFor: "Founders & teams launching MVPs, custom CRMs, storefronts, or replacing spreadsheets with reliable software.",
    deliverables: "Next.js App Router apps, PostgreSQL backends, custom storefronts, analytics dashboards & inventory systems.",
    workCollectionHref: "/work?collection=saas-web-apps",
    workCollectionLabel: "Browse SaaS, E-Commerce & Analytics Work",
    proof: { label: "PipelineOS CRM & StockFlow (Live Sandboxes)", href: "/products/pipelineos-crm", kind: "Live Demo" },
    pillarIds: ["web-development"],
    hubSlugs: ["web-development", "ecommerce-development", "business-dashboards"],
  },
  {
    id: "family-ai-automation",
    icon: "bot",
    title: "AI Products, Agents & n8n Automation",
    delivery: "Direct by Ali Arshad",
    bestFor: "Sales, support & ops teams cutting manual copy-paste tasks, slow lead triage, or repetitive inbox work.",
    deliverables: "Self-hostable n8n workflows, grounded BM25/RAG support agents, voice/chat lead qualification & CRM bridges.",
    workCollectionHref: "/work?collection=ai-products-agents",
    workCollectionLabel: "Browse AI & Automation Work",
    proof: { label: "Tideline Support Agent & 15-Node n8n Workflow", href: "/case-studies/inbound-lead-qualification-workflow", kind: "Locally Tested" },
    pillarIds: ["ai-automation"],
    hubSlugs: ["ai-agents", "n8n-automation"],
  },
  {
    id: "family-creative-brand",
    icon: "clapperboard",
    title: "Video, Motion, 3D & Brand Growth",
    delivery: "Direct by Ali Arshad",
    bestFor: "Product brands & founders needing launch edits, UI motion, scripted 3D pipelines, or WCAG-tested visual systems.",
    deliverables: "Video editing, motion graphics, social ad cuts, probed ffmpeg encodes, brand systems, HTML email & campaign pages.",
    workCollectionHref: "/work?collection=creative-motion-production",
    workCollectionLabel: "Browse Video, Motion & Brand Work",
    proof: { label: "Halcyon Brand System & Motion Pipeline", href: "/case-studies/halcyon-brand-system", kind: "Pipeline Tested" },
    pillarIds: ["creative-production", "brand-growth"],
    hubSlugs: ["creative-production", "branding"],
    extraLinks: [
      { label: "Playable Video Portfolio (13 Clips) →", href: "/services/creative-production#motion-examples" },
      { label: "ElevenLabs Voiceover Samples (3 Cues) →", href: "/services/creative-production#audio-voiceover-samples" },
      { label: "Photoshop, Illustrator & NFT Demos →", href: "/services/creative-production#creative-demonstrations" },
      { label: "Social Media Setup & Management →", href: "/services/social-media-management" },
      { label: "LinkedIn Outreach & Sales Dev →", href: "/services/linkedin-outreach" },
    ],
  },
  {
    id: "family-sourcing-specialists",
    icon: "users",
    title: "Product Sourcing, GPU Compute & Specialist Network",
    delivery: "Direct Sourcing + Partner-Led Specialists",
    bestFor: "Product importers vetting suppliers/landed cost, teams needing modest quote-led GPU compute, or builds needing specialist depth.",
    deliverables: "Direct product sourcing, samples, QC & Incoterms modeling; quote-led GPU & Linux compute; transparent partner-led security & specialist work.",
    workCollectionHref: "/work?collection=ecommerce-operations",
    workCollectionLabel: "Browse Operations & Security Work",
    proof: { label: "Product Sourcing Hub & Studio Network", href: "/services/product-sourcing", kind: "Partner-Led" },
    pillarIds: ["global-sourcing", "specialist-collaboration"],
    hubSlugs: ["global-sourcing"],
    extraLinks: [
      { label: "Product Sourcing Hub (9 Guides) →", href: "/services/product-sourcing" },
      { label: "GPU & Compute Hub (7 Guides) →", href: GPU_COMPUTE_PATH },
      { label: "Studio Network (Peers & Specialists)", href: "/studio-network" },
    ],
  },
];

/** Maps each detailed service pillar to its aligned Work collection for consistent cross-navigation. */
const PILLAR_WORK_COLLECTION: Record<string, { href: string; label: string }> = {
  "creative-production": { href: "/work?collection=creative-motion-production", label: "Creative & Motion Collection" },
  "web-development": { href: "/work?collection=saas-web-apps", label: "SaaS & Web Apps Collection" },
  "ai-automation": { href: "/work?collection=ai-products-agents", label: "AI Products & Automation Work" },
  "brand-growth": { href: "/work?collection=creative-motion-production", label: "Brand & Creative Collection" },
  "global-sourcing": { href: "/work?collection=ecommerce-operations", label: "E-Commerce & Operations Collection" },
  "specialist-collaboration": { href: "/work?collection=automation-integrations", label: "Security & Integration Work" },
};

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What services does Ali Arshad offer directly vs. with collaborators?",
    a: "Web & SaaS development, e-commerce, analytics dashboards, AI agents, n8n workflow automation, creative production, brand systems, and global sourcing coordination are delivered directly by Ali Arshad. For specialist domains like deep security reviews, blockchain, or high-volume parallel sprints, vetted independent collaborators join transparently through the Studio Network with Ali remaining your single point of contact.",
  },
  {
    q: "How do you work remotely with US and international clients?",
    a: "Ali Arshad Personal Studio operates remotely as an independent studio of one, with scheduled US time-zone overlap for discovery calls and milestone reviews. Every project starts with a plain-language written scope and ships through reviewable staging previews, with full repository and account ownership handed over directly. No physical regional offices are claimed.",
  },
  {
    q: "Are the portfolio projects real client engagements or demonstrations?",
    a: "The portfolio case studies and standalone applications are clearly labeled studio demonstrations, locally verified prototypes, or architecture concepts built under fictional companies and seeded data — including publicly deployed live sandboxes for PipelineOS CRM (crm.aliarshad.co) and StockFlow Inventory (stock.aliarshad.co). They prove real engineering execution without fabricating client claims.",
  },
  {
    q: "What is included in a typical engagement?",
    a: "A short discovery conversation (or a brief exported from the Visual Project Planner), followed by a plain-language written scope covering what will be built, in what order, what it costs, and what it depends on from your side. Work ships in reviewable milestones with documentation and full ownership hand-off.",
  },
];

const AUTOMATION_FLOW: FlowStep[] = [
  { label: "New inquiry", detail: "Form, inbox or chat", icon: "mail" },
  { label: "AI qualification", detail: "Scored against your criteria", icon: "bot" },
  { label: "CRM update", detail: "Record created, owner assigned", icon: "layers" },
  { label: "Human follow-up", detail: "A person takes the real conversation", icon: "users", human: true },
];

const SOURCING_FLOW: FlowStep[] = [
  { label: "Requirements", detail: "Specification, volume, target cost", icon: "briefcase" },
  { label: "Supplier research", detail: "Shortlist and first contact", icon: "globe" },
  { label: "Comparison", detail: "Quotes, samples, landed cost", icon: "trending" },
  { label: "Order coordination", detail: "Terms, production follow-up", icon: "check" },
  { label: "Shipping follow-up", detail: "Tracking through to arrival", icon: "clock" },
];

function ServiceVisual({ service }: { service: Service }) {
  const projects = projectsForService(service.id);

  if (service.id === "creative-production") {
    return (
      <div className="visual-stack">
        <div className="panel">
          <p className="eyebrow eyebrow--plain">13 Playable Videos, 3 Voiceover Cues &amp; 4 Visual Demos</p>
          <h3 className="card-title" style={{ marginTop: "4px" }}>
            Preview authorized video edits, ElevenLabs audio cues &amp; visual craft demos
          </h3>
          <p className="fine-print" style={{ marginTop: "8px", lineHeight: 1.6 }}>
            Stream 8 authorized portfolio/client edits and 5 first-party studio narrative and motion demos on demand, preview 3 transcribed
            ElevenLabs voiceover cues, and inspect studio demonstrations for Photoshop retouching, Illustrator vector work, social grids, and NFT concepts.
          </p>
          <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <Link href="/services/creative-production#motion-examples" className="btn btn--primary btn--sm">
              <span>Watch 13 playable clips</span>
              <Icon name="play" size={14} className="btn__icon" />
            </Link>
            <Link href="/services/creative-production#audio-voiceover-samples" className="btn btn--secondary btn--sm">
              <span>Hear 3 voiceover cues</span>
            </Link>
            <Link href="/services/creative-production#creative-demonstrations" className="btn btn--secondary btn--sm">
              <span>Photoshop, Illustrator &amp; NFT demos</span>
            </Link>
          </div>
        </div>
        <RelatedProjectList projects={projects} />
      </div>
    );
  }

  if (service.id === "ai-automation") {
    return (
      <div className="visual-stack">
        <FlowDiagram
          title="A typical inbound automation flow"
          steps={AUTOMATION_FLOW}
          caption="An illustration of how these stages connect — not a screenshot. The linked demonstrations below implement the qualification and support stages."
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
          caption="The coordination sequence for a sourcing engagement. Supplier quality, customs clearance and delivery dates depend on third parties and are never guaranteed."
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
        eyebrow="Services · Four Connected Studio Families"
        title={
          <>
            Creative and technical solutions, <span className="accent">aligned directly with real builds</span>
          </>
        }
        lead="Every capability is grouped into four clear service families — distinguishing what Ali builds directly from specialist work coordinated through vetted independent collaborators, with direct links to working studio demonstrations."
      >
        <div className="hero__actions">
          <ButtonLink href="/contact">Discuss your project</ButtonLink>
          <ButtonLink href="/project-planner" variant="secondary" icon={null}>
            Visual Project Planner
          </ButtonLink>
          <ButtonLink href="/work" variant="secondary" icon={null}>
            Explore Curated Work
          </ButtonLink>
        </div>
      </PageHero>

      <ServiceNav services={SERVICES} />

      {/* Consolidated 4-Family Service Directory (replaces overlapping comparison + hub + niche walls) */}
      <section className="section section--tight" id="compare-services" aria-labelledby="compare-services-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Service families &amp; direct delivery clarity</p>
            <h2 className="section-title section-title--sm" id="compare-services-title">
              Four focused families — zero overlapping agency menus
            </h2>
            <p className="section-sub">
              Choose the family closest to your bottleneck to inspect dedicated service hubs, focused niche pages, and
              the exact working portfolio builds that back them up.
            </p>
          </div>

          <div className="service-family-grid">
            {SERVICE_FAMILIES.map((family) => {
              const matchedHubs = PUBLISHED_HUBS.filter((h) => family.hubSlugs.includes(h.slug));
              const isPartner = family.delivery.includes("Partner");
              return (
                <article key={family.id} className="panel service-family-card">
                  <div className="service-family-card__top">
                    <span className="hub-deliverable__icon" aria-hidden="true">
                      <Icon name={family.icon} size={19} />
                    </span>
                    <span className={`badge ${isPartner ? "badge--partner" : "badge--demo"}`}>
                      {family.delivery}
                    </span>
                  </div>

                  <h3 className="card-title">{family.title}</h3>
                  <p className="service-family-card__best">{family.bestFor}</p>
                  <p className="fine-print">
                    <strong>Deliverables:</strong> {family.deliverables}
                  </p>

                  <div className="service-family-card__proof">
                    <span className="service-compare__badge">{family.proof.kind}</span>
                    <Link href={family.proof.href} className="service-compare__proof-link">
                      {family.proof.label}
                    </Link>
                  </div>

                  <div className="service-family-card__links">
                    <p className="label">Dedicated hubs &amp; specializations</p>
                    <div className="location-pill-list">
                      {matchedHubs.map((hub) => (
                        <Link key={hub.slug} href={`/services/${hub.slug}`} className="location-pill location-pill--all">
                          {hub.h1} →
                        </Link>
                      ))}
                      {matchedHubs.flatMap((hub) =>
                        hub.spokes
                          .filter((sp) => isIndexable(sp.publicationState))
                          .map((sp) => (
                            <Link
                              key={`${hub.slug}/${sp.slug}`}
                              href={`/services/${hub.slug}/${sp.slug}`}
                              className="location-pill"
                            >
                              {sp.h1}
                            </Link>
                          )),
                      )}
                      {family.extraLinks?.map((extra) => (
                        <Link key={extra.href} href={extra.href} className="location-pill">
                          {extra.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="service-family-card__footer">
                    <Link href={family.workCollectionHref} className="arrow-link">
                      <span>{family.workCollectionLabel}</span>
                      <Icon name="arrow-up-right" size={15} />
                    </Link>
                    <a href={`#${family.pillarIds[0]}`} className="fine-print">
                      Read scope details ↓
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed 6 Studio Pillars — preserves all deep anchors (#web-development, #ai-automation, etc.) */}
      <section className="section section--flush-top" aria-label="Detailed studio capabilities">
        <div className="container service-stack">
          {SERVICES.map((s, i) => {
            const projects = projectsForService(s.id);
            const visual = <ServiceVisual service={s} />;
            const matchedHubs = hubsForPillar(s.id);
            const workCol = PILLAR_WORK_COLLECTION[s.id];

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
                  <span className={`badge ${s.partnerDelivered ? "badge--partner" : "badge--demo"}`}>
                    {s.partnerDelivered ? "Coordinated with vetted partners" : "Delivered directly by Ali Arshad"}
                  </span>

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

                  {matchedHubs.length > 0 ? (
                    <div className="service-block__niches">
                      <p className="label">Deep-dive hub{matchedHubs.length > 1 ? "s" : ""}</p>
                      <div className="location-pill-list">
                        {matchedHubs.map((hub) => (
                          <Link key={hub.slug} href={`/services/${hub.slug}`} className="location-pill location-pill--all">
                            {hub.h1} →
                          </Link>
                        ))}
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
                    {workCol ? (
                      <ButtonLink href={workCol.href} variant="secondary" icon={null}>
                        {workCol.label}
                      </ButtonLink>
                    ) : projects.length > 0 ? (
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
            Typical deliverables describe the shape of a scoped build, not past client engagements. Every project is
            quoted individually after discovery — zero fixed public rate sheets.
          </p>
        </div>
      </section>

      <CreativeDemoShowcase
        id="creative-demos-overview"
        eyebrow="Creative Visual Demonstrations · Studio-Authored"
        heading="Visual proof across Photoshop, Illustrator, social content & collectible concepts"
        lead="Alongside live software sandboxes, 13 playable videos, 3 ElevenLabs voiceover samples, and 1,436 sourcing models, these original studio pieces demonstrate retouching, vector geometry, brand grid systems, and 3D collectible art direction."
        surface
        compact
      />

      <section className="section section--tight" aria-labelledby="remote-delivery-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Remote-first collaboration &amp; infrastructure</p>
            <h2 className="section-title section-title--sm" id="remote-delivery-title">
              How Ali works remotely with US and international clients
            </h2>
            <p className="section-sub">
              Independent studio of one operating remotely — no physical US offices or hidden agency hand-offs.
            </p>
          </div>
          <div className="remote-delivery-grid">
            <div className="panel">
              <h3 className="card-title">Scheduled time-zone overlap</h3>
              <p className="section-sub" style={{ marginTop: "8px" }}>
                Discovery calls, milestone demos, and scope reviews schedule around US Eastern, Central, Mountain, and Pacific working hours, backed by crisp async written updates.
              </p>
            </div>
            <div className="panel">
              <h3 className="card-title">Written scope &amp; staged previews</h3>
              <p className="section-sub" style={{ marginTop: "8px" }}>
                Before writing code or cutting assets, you get a plain-language scope and milestone order, testing real preview URLs at each stage.
              </p>
            </div>
            <div className="panel">
              <h3 className="card-title">Full ownership &amp; transparent partners</h3>
              <p className="section-sub" style={{ marginTop: "8px" }}>
                Repositories, n8n JSON, brand SVGs, and hosting belong to you. When specialist depth is needed, vetted collaborators via the <Link href="/studio-network">Studio Network</Link> are disclosed upfront.
              </p>
            </div>
          </div>

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

      <Faq id="services-faq" eyebrow="Common questions" title="Questions clients usually start with" items={FAQ_ITEMS} />

      <ContactCTA
        standalone
        title="Not sure where to start? Let's work backward from your goal."
        text="Shape an exploratory brief in the Visual Project Planner or tell me directly what you're trying to build, improve, or automate."
        button="Start a conversation"
        secondaryHref="/project-planner"
        secondaryLabel="Open Visual Project Planner"
      />
    </>
  );
}
