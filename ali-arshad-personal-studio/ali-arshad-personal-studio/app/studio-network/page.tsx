import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudioNetworkForm } from "@/components/network/StudioNetworkForm";
import { StudioNetworkGlobe } from "@/components/network/StudioNetworkGlobe";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Testimonials } from "@/components/sections/Testimonials";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EditorialMedia } from "@/components/ui/EditorialMedia";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { getKeyword } from "@/lib/seo/keyword-registry";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { SITE, activeSocials } from "@/lib/site";
import { loadApprovedPublicCollaborators } from "@/lib/studio-network-directory";
import { isNetworkDeliveryConfigured } from "@/lib/studio-network-server";

export const dynamic = "force-dynamic";

const state = getKeyword("net-studio-network")?.state ?? "Researched";

export const metadata: Metadata = pageMetadata({
  title: "Studio Network — Peer & Specialist Collaboration",
  description:
    "Connect with Ali Arshad Personal Studio as a peer builder for project collaboration or as a complementary specialist for mutual referrals — strictly private by default, zero invented profiles.",
  path: "/studio-network",
  index: isIndexable(state),
});

const AUDIENCE_TRACKS = [
  {
    badge: "Track 01 · Peer Builders",
    title: "Similar service providers & parallel sprint collaborators",
    summary:
      "Independent full-stack developers, AI/n8n automation engineers, Blender/motion designers, and product-sourcing coordinators who ship clean work and want dependable collaboration when project scopes expand.",
    examples: [
      "Overflow frontend/backend engineering sprints on Next.js & PostgreSQL builds",
      "Co-delivery on multi-stage n8n automations, AI retrieval workflows, or video/3D batches",
      "Technical peer review, QA support, and clean written hand-offs across time zones",
    ],
  },
  {
    badge: "Track 02 · Complementary Specialties",
    title: "Adjacent & different-specialty professionals seeking real connections",
    summary:
      "Specialists in complementary domains who want a trustworthy independent partner for mutual introductions, scoped sub-components, or specialist referrals without agency politics.",
    examples: [
      "Licensed customs brokers, freight forwarders, and third-party QC inspectors alongside sourcing work",
      "Native iOS/Android engineers, penetration testers, DevOps/security specialists, and ERP consultants",
      "Paid-media specialists, conversion copywriters, photographers, and B2B advisors",
    ],
  },
];

const PRINCIPLES = [
  {
    icon: "users" as const,
    title: "Solo studio first, clear accountability",
    text: "Ali Arshad Personal Studio is an independent studio led directly by Ali Arshad — not a staffed agency pretending to have employees. Collaborators are independent contractors or peer businesses.",
  },
  {
    icon: "check" as const,
    title: "Explicit scope & direct credit",
    text: "Before any joint client project begins, deliverables, timelines, rates, and client-facing roles are agreed in writing so expectations stay crystal clear.",
  },
  {
    icon: "alert" as const,
    title: "Private by default, explicit opt-in only",
    text: "Every registration stays private in Ali's internal review queue. No submission is ever leaked onto a public map, directory, or client page unless you explicitly opt in, verify your details, and receive approval.",
  },
  {
    icon: "code" as const,
    title: "Built for remote clarity across time zones",
    text: "Clear written documentation, realistic availability disclosures, and respectful communication matter more than agency titles.",
  },
];

const DIRECT_VS_PARTNER = [
  {
    heading: "Delivered directly by Ali Arshad",
    items: [
      "Custom Next.js & TypeScript web applications, dashboards, and internal tools",
      "Practical AI agents, n8n workflow automation, and CRM integrations",
      "Video editing, motion graphics, Blender 3D visuals, and brand systems",
      "Product sourcing coordination, Instagram setup, LinkedIn outreach workflows, and quote-led GPU scoping",
    ],
  },
  {
    heading: "Where independent & complementary specialists join",
    items: [
      "Dedicated native mobile apps, deep cybersecurity audits, penetration testing, and blockchain builds",
      "Licensed customs brokerage, international freight forwarding, and on-site third-party factory QC",
      "Parallel high-volume production sprints requiring extra senior engineering or motion capacity",
      "Adjacent disciplines (paid-media management, legal/accounting, specialized ERP bridges)",
    ],
  },
];

export default function StudioNetworkPage() {
  if (!shouldRender(state)) notFound();

  const configured = isNetworkDeliveryConfigured();
  const approvedCollaborators = loadApprovedPublicCollaborators();
  const linkedinUrl = activeSocials().find((s) => s.icon === "linkedin")?.url ?? "";

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Studio Network", path: "/studio-network" },
        ]}
      />
      <PageHero
        eyebrow="Studio Network · Peer & Specialist Collaboration"
        title={
          <>
            Built for both <span className="accent">peer builders</span> and{" "}
            <span className="accent">complementary specialists</span>
          </>
        }
        lead="Ali Arshad Personal Studio is an independent studio of one. The Studio Network connects vetted independent providers in similar crafts for scoped collaboration — and adjacent specialists across logistics, security, mobile, and marketing for trustworthy professional introductions."
        aside={
          <EditorialMedia
            src="/images/services/studio-network-editorial.jpg"
            alt="Two independent creative engineers reviewing wireframes and technical notes over laptops in a warm studio loft"
            badge="Illustrative editorial photo"
            caption="Editorial visual only — real collaborator profiles stay private until explicit opt-in and verification."
            priority
          />
        }
      >
        <div className="hero__actions">
          <a href="#join-network" className="btn btn--primary btn--md">
            <span>Register collaboration interest</span>
            <Icon name="arrow-right" size={16} />
          </a>
          <Link href="/services" className="btn btn--secondary btn--md">
            <span>View studio services</span>
          </Link>
        </div>
      </PageHero>

      {/* Two Clear Tracks: Similar Providers vs Complementary Specialists */}
      <section className="section section--tight" aria-labelledby="network-tracks-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Who the Studio Network is for</p>
            <h2 className="section-title section-title--sm" id="network-tracks-title">
              Two ways independent providers connect with the studio
            </h2>
            <p className="section-sub">
              Whether your craft overlaps directly with mine or solves an adjacent problem my clients encounter, the goal is honest,
              low-friction collaboration.
            </p>
          </div>

          <div className="network-split">
            {AUDIENCE_TRACKS.map((track) => (
              <article key={track.title} className="panel feature-card">
                <span className="badge badge--demo">{track.badge}</span>
                <h3 className="card-title">{track.title}</h3>
                <p>{track.summary}</p>
                <ul className="check-list check-list--spaced" style={{ marginTop: "8px" }}>
                  {track.examples.map((ex) => (
                    <li key={ex}>
                      <Icon name="check" size={16} />
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy-First Interactive Collaborator Globe */}
      <section className="section section--surface section--tight" aria-labelledby="network-globe-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Global remote coverage · Privacy-first</p>
            <h2 className="section-title section-title--sm" id="network-globe-title">
              Opt-In Studio Network Globe
            </h2>
            <p className="section-sub">
              Only real, manually approved independent collaborators who explicitly opt into public listing appear here — showing broad metro
              regions only, never street addresses, unapproved form entries, or fabricated profiles.
            </p>
          </div>

          <StudioNetworkGlobe collaborators={approvedCollaborators} deliveryConfigured={configured} />
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="direct-vs-partner-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Clear delivery boundaries</p>
            <h2 className="section-title section-title--sm" id="direct-vs-partner-title">
              Direct work by Ali Arshad vs. specialist collaboration
            </h2>
            <p className="section-sub">
              Clients always know in writing before work starts which deliverables I build directly and where an independent collaborator is
              involved.
            </p>
          </div>
          <div className="network-split">
            {DIRECT_VS_PARTNER.map((col) => (
              <div key={col.heading} className="panel">
                <h3 className="card-title">{col.heading}</h3>
                <ul className="check-list check-list--spaced" style={{ marginTop: "14px" }}>
                  {col.items.map((item) => (
                    <li key={item}>
                      <Icon name="check" size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--surface section--tight" aria-labelledby="network-principles">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Collaboration process &amp; privacy</p>
            <h2 className="section-title section-title--sm" id="network-principles">
              How introductions, availability, and privacy work
            </h2>
          </div>
          <ul className="hub-deliverables">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="hub-deliverable">
                <div className="hub-deliverable__head">
                  <span className="hub-deliverable__icon" aria-hidden="true">
                    <Icon name={p.icon} size={18} />
                  </span>
                  <h3 className="hub-deliverable__title">{p.title}</h3>
                </div>
                <p className="hub-deliverable__detail">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Verified Collaborators Roster — never displays invented or unconsented profiles */}
      <section className="section section--tight" aria-labelledby="collaborators-roster-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Public opt-in directory</p>
            <h2 className="section-title section-title--sm" id="collaborators-roster-title">
              Real people only — published strictly after explicit opt-in &amp; verification
            </h2>
          </div>

          {approvedCollaborators.length > 0 ? (
            <div className="roster-grid">
              {approvedCollaborators.map((person) => (
                <article key={person.id} className="panel roster-card">
                  <h3 className="card-title">{person.name}</h3>
                  <p className="roster-card__meta">
                    {person.role} · {person.approximateLocation}
                  </p>
                  <p>{person.specialty}</p>
                  {person.portfolioUrl ? (
                    <a href={person.portfolioUrl} target="_blank" rel="noopener noreferrer" className="arrow-link">
                      <span>View work</span>
                      <Icon name="arrow-up-right" size={15} />
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="panel roster-placeholder" role="note">
              <p className="roster-placeholder__title">No public profiles listed yet (0 opt-in listings)</p>
              <p className="section-sub">
                Every form submission remains strictly private by default. Public collaborator cards only appear here after a real independent
                provider opts in explicitly, verifies their work samples and coarse metro region, and receives manual approval.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Join the Studio Network Form */}
      <section className="section section--surface" id="join-network" aria-labelledby="join-network-title">
        <div className="container network-apply">
          <div className="network-apply__intro">
            <p className="eyebrow eyebrow--plain">Join the Studio Network</p>
            <h2 className="section-title section-title--sm" id="join-network-title">
              Introduce yourself for peer collaboration or complementary referrals
            </h2>
            <p className="section-sub">
              Share your primary skills, availability, time zone, and work samples below. Your submission is sent privately to Ali Arshad and
              never appears publicly without your separate verification and approval.
            </p>
            <ul className="check-list check-list--spaced" style={{ marginTop: "18px" }}>
              <li>
                <Icon name="check" size={16} />
                <span>Open to both overlapping craft peers and complementary specialists</span>
              </li>
              <li>
                <Icon name="check" size={16} />
                <span>Private by default — zero public leakage to maps or client-facing lists</span>
              </li>
              <li>
                <Icon name="check" size={16} />
                <span>Independent contractor / peer-referral basis scoped cleanly per engagement</span>
              </li>
            </ul>
            <p className="fine-print" style={{ marginTop: "16px" }}>
              Looking to hire Ali Arshad for a client project instead? Use the <Link href="/contact">project inquiry form</Link> or try the{" "}
              <Link href="/project-planner">Visual Project Planner</Link>.
            </p>
          </div>

          <div className="panel panel--lg">
            <h3 className="section-title section-title--sm">Collaborator &amp; peer registration</h3>
            <p className="section-sub">Fields marked with * are required. Public globe visibility is off by default.</p>
            <StudioNetworkForm configured={configured} fallbackEmail={SITE.email} linkedinUrl={linkedinUrl} />
          </div>
        </div>
      </section>

      <Testimonials title="What partners and clients say" />

      <ContactCTA
        standalone
        eyebrow="Client project scope"
        title="Planning a project that spans multiple disciplines?"
        text="Tell me the full scope. If part of it benefits from a vetted independent or complementary specialist, I will say so upfront and coordinate cleanly."
        button="Discuss your project"
        href={`/contact?service=${encodeURIComponent("Specialist Technical Collaboration")}`}
      />
    </>
  );
}
