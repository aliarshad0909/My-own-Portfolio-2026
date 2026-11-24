import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHero } from "@/components/ui/PageHero";
import { WorkGallery } from "@/components/work/WorkGallery";
import { PLANNED, PROJECTS } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Work: 80 Web, AI Automation, Analytics, 3D & Creative Showcases",
  description:
    "Explore 80 studio showcases across live public SaaS sandboxes, locally tested repository builds, monorepo prototypes, and architecture concepts — clearly labeled by status and filterable by service, stack, and live availability.",
  path: "/work",
});

export default function WorkPage() {
  const liveCount = PROJECTS.filter((p) => Boolean(p.liveUrl)).length;
  const demoCount = PROJECTS.filter((p) => p.status === "Demo Ready" && !p.liveUrl).length;
  const protoCount = PROJECTS.filter((p) => p.status === "Prototype" && !p.liveUrl).length;
  const conceptCount = PROJECTS.filter((p) => p.status === "Concept" || p.status === "Sample Scenario").length;
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
        ]}
      />
      <PageHero
        eyebrow={`Work · ${PROJECTS.length} Project Showcases`}
        title={
          <>
            Projects &amp; blueprints across <span className="accent">software, AI, creative &amp; ops</span>
          </>
        }
        lead="Browse by service, discipline, stack, or build status. Every card distinguishes publicly deployed sandboxes, locally tested repository builds, monorepo prototypes, and architecture concepts — never mixing unbuilt concepts with real client work."
      />
      <section className="section section--flush-top" aria-label="Projects">
        <div className="container">
          <p className="notice notice--wide">
            <strong>Honest status split ({PROJECTS.length} total):</strong> {liveCount} live public web/mobile sandboxes,{" "}
            {demoCount} locally verified demos, {protoCount} locally built monorepo prototypes, 1 build in development, and{" "}
            {conceptCount} architecture concepts &amp; sample scenarios (unbuilt concepts stay marked clearly and excluded from search indexing).
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
                These are scoped but not built yet, so they are listed here rather than shown as finished work. Each one moves into the gallery above once it is built, tested and deployable.
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

      <ContactCTA standalone />
    </>
  );
}
