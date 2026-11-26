import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OriginalUsRegionMap } from "@/components/locations/OriginalUsRegionMap";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  FICTIONAL_DEMO_PROFILES,
  allFictionalProfileSlugs,
  getFictionalProfileBySlug,
  type FictionalTeamMember,
} from "@/lib/geo/fictional-profiles";
import { getProject } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return allFictionalProfileSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = getFictionalProfileBySlug(slug);
  if (!profile) return {};
  return pageMetadata({
    title: `${profile.fictionalName} (Fictional Demo Scenario) — Studio Walkthrough`,
    description: `Fictional demo scenario (not a real client): ${profile.sampleProblem}`,
    path: `/demo-scenarios/${profile.slug}`,
    // Fictional customer scenarios stay strictly noindex so search indices never mistake them for real client case studies.
    index: false,
  });
}

function teamByParent(members: FictionalTeamMember[], parentId: string | null) {
  return members.filter((m) => m.reportsTo === parentId);
}

export default async function FictionalScenarioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = getFictionalProfileBySlug(slug);
  if (!profile) notFound();

  const relatedProjects = profile.relatedProjectSlugs
    .map((s) => getProject(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const otherProfiles = FICTIONAL_DEMO_PROFILES.filter((p) => p.slug !== profile.slug);
  const idx = FICTIONAL_DEMO_PROFILES.findIndex((p) => p.slug === profile.slug);
  const prevProfile = FICTIONAL_DEMO_PROFILES[(idx - 1 + FICTIONAL_DEMO_PROFILES.length) % FICTIONAL_DEMO_PROFILES.length];
  const nextProfile = FICTIONAL_DEMO_PROFILES[(idx + 1) % FICTIONAL_DEMO_PROFILES.length];
  const memberMap = new Map(profile.teamHierarchy.map((m) => [m.id, m]));
  const roots = teamByParent(profile.teamHierarchy, null);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
          { name: "Fictional Demo Scenarios", path: "/demo-scenarios" },
          { name: profile.fictionalName, path: `/demo-scenarios/${profile.slug}` },
        ]}
      />

      <PageHero
        eyebrow={`${profile.disclosureBadge} · ${profile.operatingModel}`}
        title={profile.fictionalName}
        lead={profile.sampleProblem}
      >
        <div className="hero__actions">
          <ButtonLink href="/project-planner">Configure a real project in Project Planner</ButtonLink>
          <ButtonLink href="/locations" variant="secondary" icon={null}>
            Back to Remote US Coverage
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section section--flush-top" aria-label="Fictional disclosure">
        <div className="container">
          <div className="panel scenario-disclosure" role="note">
            <div className="scenario-disclosure__head">
              <Icon name="alert" size={20} />
              <strong>Fictional Demo Scenario — Not a Real Client</strong>
            </div>
            <p>
              <strong>{profile.fictionalName}</strong> is a completely invented organization created solely to illustrate how Ali Arshad Personal
              Studio services and working repository demonstrations fit a concrete operating workflow. Ali Arshad has <strong>not</strong> been hired
              by this organization, there are zero testimonials or client quotes, every team member below is an{" "}
              <strong>AI-generated fictional illustration (not a real person)</strong>, and every map marker is synthetic rather than a real address.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="scenario-overview-title">
        <div className="container scenario-layout">
          <div className="scenario-copy">
            <p className="eyebrow eyebrow--plain">Business scenario &amp; imagined workflow</p>
            <h2 className="section-title section-title--sm" id="scenario-overview-title">
              How this fictional organization operates
            </h2>
            {profile.scenarioOverview.map((para, i) => (
              <p key={i} className="measure" style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                {para}
              </p>
            ))}

            <h3 className="card-title" style={{ marginTop: "20px" }}>
              Illustrative remote system flow
            </h3>
            <ol className="scenario-steps">
              {profile.workflowWalkthrough.map((step, i) => (
                <li key={step}>
                  <span className="scenario-steps__num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="scenario-map-col">
            <OriginalUsRegionMap
              scenarioName={profile.fictionalName}
              markers={profile.mapMarkers}
              caption={profile.mapPin.caption}
              detailed
            />
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="fictional-team-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Fictional organization chart · AI-generated illustrations</p>
            <h2 className="section-title" id="fictional-team-title">
              Fictional team hierarchy &amp; system usage
            </h2>
            <p className="section-sub">
              Every profile and portrait below is an <strong>AI-generated fictional illustration — not a real person</strong>. This team structure is
              separate from Ali Arshad&apos;s real <Link href="/studio-network" className="text-link">Studio Network</Link> of independent
              collaborators and exists purely to show who uses each part of the software.
            </p>
          </div>

          {/* Reporting tree summary */}
          <div className="panel org-tree" aria-label="Fictional reporting hierarchy">
            <p className="eyebrow eyebrow--plain" style={{ marginBottom: "12px" }}>
              Reporting lines (fictional scenario)
            </p>
            <ul className="org-tree__list">
              {roots.map((root) => {
                const directReports = teamByParent(profile.teamHierarchy, root.id);
                return (
                  <li key={root.id} className="org-tree__node">
                    <div className="org-tree__pill org-tree__pill--lead">
                      <strong>{root.fictionalName}</strong>
                      <span>{root.role}</span>
                    </div>
                    {directReports.length > 0 ? (
                      <ul className="org-tree__children">
                        {directReports.map((child) => {
                          const subReports = teamByParent(profile.teamHierarchy, child.id);
                          return (
                            <li key={child.id} className="org-tree__node">
                              <div className="org-tree__pill">
                                <strong>{child.fictionalName}</strong>
                                <span>{child.role}</span>
                              </div>
                              {subReports.length > 0 ? (
                                <ul className="org-tree__children">
                                  {subReports.map((sub) => (
                                    <li key={sub.id} className="org-tree__node">
                                      <div className="org-tree__pill">
                                        <strong>{sub.fictionalName}</strong>
                                        <span>{sub.role}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Illustrative operational environment photograph (replaces cartoon/illustrated avatar cards) */}
          <div style={{ marginTop: "24px", marginBottom: "24px" }}>
            <figure className="editorial-media">
              <div className="editorial-media__frame editorial-media__frame--16-9">
                <Image
                  src={profile.teamHierarchy[0]?.portraitSrc ?? "/images/services/studio-network-editorial.jpg"}
                  alt={`Illustrative editorial workspace scene for ${profile.fictionalName} (fictional demo scenario, not a real client)`}
                  fill
                  sizes="(min-width: 1024px) 1040px, 94vw"
                  className="editorial-media__img"
                />
                <span className="editorial-media__badge">Illustrative editorial photo · Fictional scenario</span>
              </div>
              <figcaption className="editorial-media__caption">
                Documentary-style editorial visual representing the simulated {profile.industry.toLowerCase()} operating setting — not a real client location or staff photo.
              </figcaption>
            </figure>
          </div>

          {/* Role usage breakdown cards (clean editorial cards without cartoon avatars) */}
          <div className="fictional-team-grid">
            {profile.teamHierarchy.map((member) => {
              const manager = member.reportsTo ? memberMap.get(member.reportsTo) : null;
              return (
                <article key={member.id} className="panel fictional-member-card">
                  <div className="fictional-member-card__body">
                    <span className="badge badge--draft">Illustrative Role · Fictional Scenario</span>
                    <h3 className="card-title">{member.role}</h3>
                    <p className="fictional-member-card__role">
                      {member.department} · Simulated region: {member.simulatedRegion}
                    </p>
                    <p className="fine-print">
                      {manager ? `Reports to ${manager.role}` : "Top-level scenario owner"}
                    </p>
                    <p className="fictional-member-card__usage">
                      <strong>How this role uses the system:</strong> {member.howTheyUseSystem}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="scenario-linked-work-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Substantiated builds &amp; services</p>
            <h2 className="section-title section-title--sm" id="scenario-linked-work-title">
              Real studio projects &amp; services illustrated by this scenario
            </h2>
            <p className="section-sub">
              Each linked showcase below displays its true repository status (Live Demo, Locally Tested Demo, Built Prototype, or Concept).
            </p>
          </div>

          <div className="scenario-links-split">
            <div className="panel">
              <h3 className="card-title" style={{ marginBottom: "14px" }}>
                Relevant portfolio showcases
              </h3>
              <ul className="scenario-project-list">
                {relatedProjects.map((proj) => (
                  <li key={proj.slug}>
                    <Link href={`/work/${proj.slug}`} className="scenario-project-row">
                      <div>
                        <strong>{proj.title}</strong>
                        <p className="fine-print">{proj.summary}</p>
                      </div>
                      <div className="scenario-project-row__right">
                        <StatusBadge status={proj.status} />
                        <Icon name="arrow-up-right" size={16} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <h3 className="card-title" style={{ marginBottom: "14px" }}>
                Relevant studio services
              </h3>
              <ul className="niche-directory__list">
                {profile.relatedServices.map((svc) => (
                  <li key={svc.href}>
                    <Link href={svc.href}>
                      <span>
                        <strong>{svc.title}</strong>
                        <small className="muted" style={{ display: "block", marginTop: "2px" }}>
                          {svc.note}
                        </small>
                      </span>
                      <Icon name="arrow-up-right" size={15} />
                    </Link>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-soft)" }}>
                <p className="eyebrow eyebrow--plain" style={{ marginBottom: "10px" }}>
                  Other fictional demo scenarios
                </p>
                <div className="location-pill-list">
                  {otherProfiles.map((other) => (
                    <Link key={other.slug} href={`/demo-scenarios/${other.slug}`} className="location-pill">
                      {other.fictionalName} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="case-nav" aria-label="Fictional demo scenario navigation">
        <div className="container case-nav__inner">
          <Link href={`/demo-scenarios/${prevProfile.slug}`} className="case-nav__link case-nav__link--prev">
            <span className="case-nav__label">
              <Icon name="arrow-right" size={15} className="flip" />
              Previous fictional scenario
            </span>
            <span className="case-nav__title">{prevProfile.fictionalName}</span>
          </Link>
          <Link href="/demo-scenarios" className="case-nav__all">
            All {FICTIONAL_DEMO_PROFILES.length} fictional scenarios
          </Link>
          <Link href={`/demo-scenarios/${nextProfile.slug}`} className="case-nav__link case-nav__link--next">
            <span className="case-nav__label">
              Next fictional scenario
              <Icon name="arrow-right" size={15} />
            </span>
            <span className="case-nav__title">{nextProfile.fictionalName}</span>
          </Link>
        </div>
      </nav>

      <ContactCTA
        standalone
        eyebrow="Scope your real organization"
        title="Want a tailored system built around your real team and workflow?"
        text="Start with our interactive Project Planner or share your real requirements directly — every engagement begins with honest scoping."
        button="Start a Project"
        secondaryHref="/project-planner"
        secondaryLabel="Open Visual Project Planner"
      />
    </>
  );
}
