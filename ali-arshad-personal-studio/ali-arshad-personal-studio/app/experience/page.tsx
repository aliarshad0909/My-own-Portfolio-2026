import type { Metadata } from "next";
import Image from "next/image";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ExpertiseList, ToolGrid } from "@/components/sections/StudioDashboard";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { EXPERIENCE, type ExperienceEntry } from "@/lib/experience";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Experience",
  description:
    "Ali Arshad's experience across brand management for US brands, creative production, software development, sales and business analysis, with a BBA in Supply Chain Management.",
  path: "/experience",
});

const KIND: Record<ExperienceEntry["kind"], { label: string; icon: IconName }> = {
  work: { label: "Experience", icon: "briefcase" },
  internship: { label: "Internship", icon: "clock" },
  education: { label: "Education", icon: "graduation" },
};

export default function ExperiencePage() {
  return (
    <>
      <PageHero
        eyebrow="Experience"
        title={
          <>
            A background in <span className="accent">brands, production and software</span>
          </>
        }
        lead="The experience behind the studio: brand management for US brands, creative production, software development, and a business education in supply chain management."
        aside={
          <div className="portrait-frame portrait-frame--experience enter enter--portrait">
            <Image
              src="/images/portraits/portrait-experience.webp"
              alt="Ali Arshad seated in a leather armchair, wearing a dark suit"
              width={1174}
              height={1339}
              priority
              sizes="(min-width: 1024px) 440px, 80vw"
            />
          </div>
        }
      />

      <section className="section" aria-labelledby="timeline-title">
        <div className="container split">
          <div className="split__head reveal">
            <p className="eyebrow eyebrow--plain">Timeline</p>
            <h2 className="section-title" id="timeline-title">
              Where the skills come from
            </h2>
            <p className="section-sub">Work, internships and education that shaped how the studio operates.</p>
            <EditorNote>Dates, exact titles and organisation names are hidden until verified. Fill them in lib/experience.ts.</EditorNote>
          </div>

          <ol className="timeline">
            {EXPERIENCE.map((e) => (
              <li key={e.id} className="timeline__item reveal">
                <span className="timeline__dot" aria-hidden="true">
                  <Icon name={KIND[e.kind].icon} size={16} />
                </span>
                <div className="panel timeline__card">
                  <div className="timeline__meta">
                    <span className="badge badge--neutral">{KIND[e.kind].label}</span>
                    {e.period ? <span className="timeline__period">{e.period}</span> : null}
                  </div>
                  <h3 className="card-title">{e.title ?? e.area}</h3>
                  {(e.title && e.kind !== "education") || e.organization ? (
                    <p className="timeline__org">{[e.title && e.kind !== "education" ? e.area : null, e.organization].filter(Boolean).join(" · ")}</p>
                  ) : null}
                  <p>{e.summary}</p>
                  <ul className="tag-list" aria-label="Focus areas">
                    {e.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="skills-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow eyebrow--plain">Skills &amp; tools</p>
            <h2 className="section-title" id="skills-title">
              What I work with
            </h2>
            <p className="section-sub">Disciplines and the tools behind them — described by what they are used for, not scored.</p>
          </div>
          <div className="skills-grid">
            <div className="panel reveal">
              <h3 className="card-title">Disciplines</h3>
              <ExpertiseList />
            </div>
            <div className="panel reveal">
              <h3 className="card-title">Tools &amp; technologies</h3>
              <ToolGrid />
            </div>
          </div>
        </div>
      </section>

      <ContactCTA standalone title="Want the full picture?" text="If you'd like more detail on any part of my background, or want to talk about a role or project, get in touch." />
    </>
  );
}
