import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudioNetworkForm } from "@/components/network/StudioNetworkForm";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Testimonials } from "@/components/sections/Testimonials";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";
import { getKeyword } from "@/lib/seo/keyword-registry";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { SITE, activeSocials } from "@/lib/site";
import { breadcrumbSchema } from "@/lib/structured-data";
import { VERIFIED_COLLABORATORS } from "@/lib/studio-network";
import { isNetworkDeliveryConfigured } from "@/lib/studio-network-server";

// Evaluate delivery env vars per request so Vercel env updates take effect immediately.
export const dynamic = "force-dynamic";

const state = getKeyword("net-studio-network")?.state ?? "Researched";

export const metadata: Metadata = pageMetadata({
  title: "Studio Network — Independent Collaborators & US Project Delivery",
  description:
    "How Ali Arshad Personal Studio pairs direct solo delivery with vetted independent specialists on US-focused projects — plus how qualified collaborators can register interest.",
  path: "/studio-network",
  index: isIndexable(state),
});

const PRINCIPLES = [
  {
    icon: "users" as const,
    title: "Solo studio first, one point of contact",
    text: "Ali Arshad Personal Studio is an independent studio of one — not a staffed agency with a US office. When you hire me, you work directly with me from kickoff to hand-off.",
  },
  {
    icon: "check" as const,
    title: "Clear line between my work and partners",
    text: "Core web applications, AI automation, branding, and creative production are handled directly by me. Independent specialists are brought in only when a scope genuinely needs outside depth or extra capacity.",
  },
  {
    icon: "alert" as const,
    title: "Zero fake logos or implied employees",
    text: "Independent collaborators are contractors, not W-2 staff. Collaborators are named publicly only with verified details and written permission.",
  },
  {
    icon: "code" as const,
    title: "Built for US time-zone & quality standards",
    text: "Every collaborator engaged on a US-focused project aligns on written milestones, clear code/design hand-offs, and direct communication overlap.",
  },
];

const DIRECT_VS_PARTNER = [
  {
    heading: "Delivered directly by Ali Arshad",
    items: [
      "Custom Next.js & TypeScript web applications, dashboards, and internal tools",
      "Practical AI agents and n8n workflow automation tied to real business systems",
      "Video editing, motion graphics, Blender 3D visuals, and brand identity systems",
      "E-commerce storefronts, sourcing workflows, and technical scoping",
    ],
  },
  {
    heading: "Independent collaborator & specialist capabilities",
    items: [
      "Dedicated native mobile builds, complex React Native hardware integrations, and QA",
      "Deep security reviews, penetration testing, and specialized cloud/DevOps hardening",
      "High-volume production sprints needing parallel frontend, design, or motion capacity",
      "Specialized third-party integrations, ERP/accounting bridges, and domain consulting",
    ],
  },
];

export default function StudioNetworkPage() {
  if (!shouldRender(state)) notFound();

  const configured = isNetworkDeliveryConfigured();
  const linkedinUrl = activeSocials().find((s) => s.icon === "linkedin")?.url ?? "";

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Studio Network", path: "/studio-network" },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Studio Network", path: "/studio-network" },
        ]}
      />
      <PageHero
        eyebrow="Studio Network & Collaborators"
        title="An independent studio of one — backed by vetted specialists when needed"
        lead="I deliver most work directly myself. For US-focused builds that benefit from specialist depth or extra sprint capacity, the Studio Network brings in independent collaborators transparently under one accountable point of contact."
        aside={
          <div className="hub-hero-card">
            <div className="hub-hero-card__frame hub-hero-card__frame--dark-diagram">
              <Image
                src="/images/site-visuals/network/studio-network-collaboration.svg"
                alt="Hub-and-spoke collaboration diagram showing direct in-house execution and transparent independent specialist collaborators coordinated through Ali Arshad Personal Studio"
                width={1200}
                height={720}
                priority
                sizes="(min-width: 1024px) 520px, 92vw"
              />
            </div>
            <div className="hub-hero-card__caption">
              <span>Independent studio delivery with transparent specialist attribution</span>
            </div>
          </div>
        }
      />

      <section className="section section--tight" aria-labelledby="direct-vs-partner-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Clear boundaries</p>
            <h2 className="section-title section-title--sm" id="direct-vs-partner-title">
              My direct services vs. independent collaborators
            </h2>
            <p className="section-sub">
              Clients always know in writing before work starts which deliverables I build directly and where an independent collaborator is involved.
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
            <p className="eyebrow eyebrow--plain">Operating principles</p>
            <h2 className="section-title section-title--sm" id="network-principles">
              No pretending a solo studio is a staffed US agency
            </h2>
            <p className="section-sub">
              I work remotely with US and international clients. I do not maintain a physical US office or W-2 staff; specialist collaborators join on
              a transparent, project-by-project basis.
            </p>
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

      {/* Verified Collaborators Roster — never displays invented profiles */}
      <section className="section section--tight" aria-labelledby="collaborators-roster-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Public collaborator directory</p>
            <h2 className="section-title section-title--sm" id="collaborators-roster-title">
              Named only with verified details and written permission
            </h2>
          </div>

          {VERIFIED_COLLABORATORS.length > 0 ? (
            <div className="roster-grid">
              {VERIFIED_COLLABORATORS.map((person) => (
                <article key={person.name} className="panel roster-card">
                  <h3 className="card-title">{person.name}</h3>
                  <p className="roster-card__meta">
                    {person.role} · {person.location}
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
              <p className="roster-placeholder__title">Collaborator profiles are currently unpublished</p>
              <p className="section-sub">
                To stay strictly honest, this directory stays empty until each independent collaborator confirms their bio, location, work samples,
                and written permission to be listed publicly. When a client project involves a specialist, I introduce them directly during scoping.
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
              Register interest in collaborating on US-focused projects
            </h2>
            <p className="section-sub">
              Are you an independent engineer, designer, automation specialist, or creative producer who ships clean work and communicates clearly?
              Share your skills, time zone, and work samples below.
            </p>
            <ul className="check-list check-list--spaced" style={{ marginTop: "18px" }}>
              <li>
                <Icon name="check" size={16} />
                <span>Independent contractor basis — scoped clearly per project or sprint</span>
              </li>
              <li>
                <Icon name="check" size={16} />
                <span>Only details needed to assess collaboration fit are collected</span>
              </li>
              <li>
                <Icon name="check" size={16} />
                <span>Nothing you submit is published without your explicit written consent</span>
              </li>
            </ul>
            <p className="fine-print" style={{ marginTop: "16px" }}>
              Looking to hire the studio for a client project instead? Use the <Link href="/contact">project inquiry form</Link>.
            </p>
          </div>

          <div className="panel panel--lg">
            <h3 className="section-title section-title--sm">Collaborator registration</h3>
            <p className="section-sub">Fields marked with * are required.</p>
            <StudioNetworkForm configured={configured} fallbackEmail={SITE.email} linkedinUrl={linkedinUrl} />
          </div>
        </div>
      </section>

      <Testimonials title="What partners and clients say" />

      <ContactCTA
        standalone
        eyebrow="Client project scope"
        title="Planning a project that needs more than one specialism?"
        text="Tell me the full scope. If part of it is better handled with a vetted independent collaborator, I will say so openly and coordinate delivery cleanly."
        button="Discuss your project"
        href={`/contact?service=${encodeURIComponent("Specialist Technical Collaboration")}`}
      />
    </>
  );
}
