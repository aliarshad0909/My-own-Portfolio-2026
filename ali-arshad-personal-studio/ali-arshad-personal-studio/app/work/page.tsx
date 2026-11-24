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
  title: "Work: 100 Software, AI, Analytics & Creative Showcases + 20 Playable Games",
  description:
    "Explore 100 technical and creative showcases across live SaaS sandboxes, locally tested demos, runnable project-lab prototypes, and concepts — plus 20 original playable browser game experiments with build stories and runnable source.",
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
        eyebrow={`Work · ${COMMERCIAL_PROJECTS.length} Project Showcases + ${gamesCount} Playable Games`}
        title={
          <>
            Projects, prototypes &amp; <span className="accent">interactive experiments</span>
          </>
        }
        lead="Filter by discipline, service area, stack, or build status. Every entry links directly to runnable repository source and states honestly whether it is a live public sandbox, a locally verified demo, a runnable prototype, a concept blueprint, or a personal browser game experiment."
      >
        <div className="hero__actions">
          <ButtonLink href="/project-planner">Launch Visual Project Planner</ButtonLink>
          <ButtonLink href="/games" variant="secondary" icon={null}>
            Dedicated Games Lab ({gamesCount})
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section section--flush-top" aria-label="Projects">
        <div className="container">
          <p className="notice notice--wide">
            <strong>Honest portfolio split ({COMMERCIAL_PROJECTS.length} projects + {gamesCount} personal games = {PROJECTS.length} entries):</strong>{" "}
            {liveCount} live public web/mobile sandboxes, {demoCount} locally verified studio demos, {protoCount} runnable repository prototypes (in{" "}
            <code>apps/</code> &amp; <code>project-lab/</code>), {inDevCount} build in development, {conceptCount} architecture concepts &amp; sample
            scenarios (each paired with a small representative workflow slice in <code>project-lab/concepts/</code>), and {gamesCount} personal browser
            game experiments (never client work). Unbuilt concepts, local prototypes, and game build stories under <code>/work/*</code> stay{" "}
            <code>noindex</code>.
          </p>
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
              <Link href="/products" className="location-pill">
                12 SaaS Product Demos
              </Link>
              <Link href="/games" className="location-pill">
                20 Playable Browser Games
              </Link>
              <Link href="/services" className="location-pill">
                Compare Services &amp; 26 Niches
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ContactCTA standalone />
    </>
  );
}
