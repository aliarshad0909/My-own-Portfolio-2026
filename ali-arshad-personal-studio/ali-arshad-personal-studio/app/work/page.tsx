import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { WorkGallery } from "@/components/work/WorkGallery";
import { PLANNED, PROJECTS } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Work",
  description: "Portfolio of creative production, 3D and motion, branding, web and software, AI automation and business projects by Ali Arshad.",
  path: "/work",
});

export default function WorkPage() {
  const hasSampleMedia = PROJECTS.some((p) => p.usesSampleMedia === true);
  return (
    <>
      <PageHero
        eyebrow="Work"
        title={
          <>
            Projects across <span className="accent">creative, technical and business</span> work
          </>
        }
        lead="Browse by discipline. Each project states how it came about — client work, an original build, or an adaptation of someone else's open-source project — and what I personally did."
      />
      <section className="section section--flush-top" aria-label="Projects">
        <div className="container">
          {hasSampleMedia ? (
            <p className="notice notice--wide">Cards marked with sample artwork preview the layout and are not client work.</p>
          ) : null}
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
