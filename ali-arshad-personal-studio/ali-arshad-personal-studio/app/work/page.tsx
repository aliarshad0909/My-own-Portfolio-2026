import type { Metadata } from "next";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { WorkGallery } from "@/components/work/WorkGallery";
import { COMMERCIAL_PROJECTS, PLANNED, PROJECTS } from "@/lib/projects";
import { GAME_WORK_ENTRIES } from "@/lib/projects-games";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Work: Curated Studio Builds, Prototypes & Playable Experiments",
  description:
    "Browse curated software, AI agent, automation, analytics, e-commerce, creative production, and browser game collections — each labeled honestly by build status with direct links to live demos or runnable source.",
  path: "/work",
});

export default function WorkPage() {
  const liveCount = COMMERCIAL_PROJECTS.filter((p) => Boolean(p.liveUrl)).length;
  const demoCount = COMMERCIAL_PROJECTS.filter((p) => p.status === "Demo Ready" && !p.liveUrl).length;
  const protoCount = COMMERCIAL_PROJECTS.filter((p) => p.status === "Prototype" && !p.liveUrl).length;
  const conceptCount = COMMERCIAL_PROJECTS.filter((p) => p.status === "Concept" || p.status === "Sample Scenario").length;
  const inDevCount = COMMERCIAL_PROJECTS.filter((p) => p.status === "In Development").length;
  const gamesCount = GAME_WORK_ENTRIES.length;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
        ]}
      />
      <PageHero
        eyebrow="Work · Curated Across 7 Studio Collections"
        title={
          <>
            Representative builds, prototypes &amp; <span className="accent">interactive experiments</span>
          </>
        }
        lead="Start with live multi-screen product demonstrations, then explore seven problem-based collections covering SaaS, AI agents, automation, dashboards, e-commerce, creative production, and personal browser games."
      >
        <div className="hero__actions">
          <ButtonLink href="/project-planner">Launch Visual Project Planner</ButtonLink>
          <ButtonLink href="/services" variant="secondary" icon={null}>
            Explore Studio Services
          </ButtonLink>
          <ButtonLink href="/games" variant="secondary" icon={null}>
            Dedicated Games Lab ({gamesCount})
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section section--flush-top" aria-label="Curated Work Showcase">
        <div className="container">
          {/* Concise visual status key instead of a dense wall of text */}
          <dl className="work-status-strip panel" aria-label="Honest portfolio build-status breakdown">
            <div>
              <dt>Live Public Sandboxes</dt>
              <dd>
                <strong>{liveCount}</strong>
                <span>Test directly online</span>
              </dd>
            </div>
            <div>
              <dt>Locally Verified Demos</dt>
              <dd>
                <strong>{demoCount}</strong>
                <span>Full-stack repo builds</span>
              </dd>
            </div>
            <div>
              <dt>Runnable Prototypes</dt>
              <dd>
                <strong>{protoCount}</strong>
                <span>
                  <code>apps/</code> &amp; <code>project-lab/</code>
                </span>
              </dd>
            </div>
            <div>
              <dt>Concepts &amp; In-Dev</dt>
              <dd>
                <strong>{conceptCount + inDevCount}</strong>
                <span>Architecture + workflow slices</span>
              </dd>
            </div>
            <div>
              <dt>Personal Games</dt>
              <dd>
                <strong>{gamesCount}</strong>
                <span>Playable experiments</span>
              </dd>
            </div>
          </dl>

          <WorkGallery projects={PROJECTS} />
        </div>
      </section>

      {PLANNED.length > 0 ? (
        <section className="section section--surface" aria-labelledby="pipeline-title">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow eyebrow--plain">In progress</p>
              <h2 className="section-title" id="pipeline-title">
                What I&rsquo;m building next
              </h2>
              <p className="section-sub">
                These are scoped but not built yet, so they are listed here rather than shown as finished work.
              </p>
            </div>
            <ol className="pipeline">
              {PLANNED.map((p, i) => (
                <li key={p.title} className="pipeline__item reveal">
                  <span className="pipeline__num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="card-title">{p.title}</h3>
                    <p className="pipeline__meta">
                      {p.category} · {p.projectType}
                    </p>
                    <p>{p.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <section className="section section--tight" aria-label="Related planning tools">
        <div className="container">
          <div className="panel home-directory-strip">
            <div>
              <p className="eyebrow eyebrow--plain">Plan your own build</p>
              <p className="section-sub" style={{ marginTop: "4px" }}>
                Use the interactive Project Planner to explore layouts, styles, features, and a readable brief before we talk.
              </p>
            </div>
            <div className="location-pill-list">
              <Link href="/project-planner" className="location-pill location-pill--all">
                Open Visual Project Planner →
              </Link>
              <Link href="/services/creative-production#motion-examples" className="location-pill location-pill--all">
                14 Playable Videos &amp; 3 Voiceover Cues →
              </Link>
              <Link href="/products" className="location-pill">
                12 SaaS Product Demos
              </Link>
              <Link href="/games" className="location-pill">
                20 Playable Browser Games
              </Link>
              <Link href="/services" className="location-pill">
                Explore Services &amp; Delivery Model
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ContactCTA standalone />
    </>
  );
}
