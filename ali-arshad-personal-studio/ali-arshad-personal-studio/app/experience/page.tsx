import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CredentialGallery } from "@/components/credentials/CredentialGallery";
import { ExperienceTimeline } from "@/components/experience/ExperienceTimeline";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ExpertiseList } from "@/components/sections/Expertise";
import { ButtonLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { visibleCredentials } from "@/lib/credentials";
import { EXPERIENCE, THREADS } from "@/lib/experience";
import { TOOL_GROUPS, toolsInGroup } from "@/lib/expertise";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Experience",
  description:
    "Ali Arshad's career so far: a BBA in Supply Chain Management, brand management for US brands, creative production, software development and AI automation — and how the four connect.",
  path: "/experience",
});

/** The four strands, in the order they were added. */
const ARC: { thread: keyof typeof THREADS; icon: IconName; story: string }[] = [
  {
    thread: "business",
    icon: "globe",
    story: "It started with a business degree focused on supply chain — how resources, information and money move through an organisation, and where they stall.",
  },
  {
    thread: "creative",
    icon: "clapperboard",
    story: "Brand management for US brands turned that into practice: content, campaigns and the production work — video, motion, 3D — needed to ship them.",
  },
  {
    thread: "software",
    icon: "code",
    story: "Building the websites and tools those brands needed led into software proper: frontends, backends and the integrations between them.",
  },
  {
    thread: "automation",
    icon: "bot",
    story: "The newest strand, and a direct consequence of the others — once you have built the systems, the repetitive work between them is obvious and automatable.",
  },
];

export default function ExperiencePage() {
  const counts = {
    work: EXPERIENCE.filter((e) => e.kind === "work").length,
    internship: EXPERIENCE.filter((e) => e.kind === "internship").length,
    education: EXPERIENCE.filter((e) => e.kind === "education").length,
  };

  return (
    <>
      <PageHero
        eyebrow="Experience"
        title={
          <>
            One career, <span className="accent">four threads</span>
          </>
        }
        lead="Business education, brand management, creative production, software and automation — not a list of unrelated jobs, but a sequence where each one made the next possible."
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
      >
        <ul className="hero-facts" aria-label="At a glance">
          <li>
            <strong>{counts.work}</strong>
            <span>areas of work</span>
          </li>
          <li>
            <strong>{counts.internship}</strong>
            <span>internships</span>
          </li>
          <li>
            <strong>BBA</strong>
            <span>Supply Chain Management</span>
          </li>
        </ul>
        <div className="hero__actions">
          <ButtonLink href="/contact">Discuss a role or project</ButtonLink>
          <ButtonLink href="/work" variant="secondary" icon={null}>
            See the work
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section" aria-labelledby="arc-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow eyebrow--plain">The narrative</p>
            <h2 className="section-title" id="arc-title">
              How the threads connect
            </h2>
            <p className="section-sub">Each strand grew out of the one before it. That is why one person can cover the range, and why the business thinking never drops out.</p>
          </div>
          <ol className="arc">
            {ARC.map((a, i) => (
              <li key={a.thread} className={`arc__item arc__item--${a.thread} reveal`}>
                <span className="arc__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon name={a.icon} size={22} className="arc__icon" />
                <h3 className="arc__title">{THREADS[a.thread].label}</h3>
                <p className="arc__tag">{THREADS[a.thread].text}</p>
                <p className="arc__story">{a.story}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="timeline-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow eyebrow--plain">Timeline</p>
            <h2 className="section-title" id="timeline-title">
              Where the skills come from
            </h2>
            <p className="section-sub">
              Work, internships and education, with the responsibilities in each and the portfolio projects that demonstrate the same kind of work.
              Periods, employers and exact titles are shown as each one is confirmed.
            </p>
            <EditorNote>Dates, exact titles and organisation names are hidden until verified. Fill them in lib/experience.ts and they render here automatically.</EditorNote>
          </div>
          <ExperienceTimeline entries={EXPERIENCE} />
        </div>
      </section>

      <section className="section" aria-labelledby="creds-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow eyebrow--plain">Credentials</p>
            <h2 className="section-title" id="creds-title">
              Continuously learning. Practically applying.
            </h2>
            <p className="section-sub">
              Professional certifications, kept separate from employment and formal education. Each card carries the issuer&rsquo;s own title, dates and
              identifier; where the issuer published a verification page, it is linked.
            </p>
          </div>
          <div className="reveal">
            <CredentialGallery />
          </div>
          <p className="fine-print creds-note">
            {visibleCredentials().length} active {visibleCredentials().length === 1 ? "certification" : "certifications"}. Degree-level study is listed in
            the timeline above, not here.
          </p>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="skills-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow eyebrow--plain">Skills &amp; tools</p>
            <h2 className="section-title" id="skills-title">
              What I work with
            </h2>
            <p className="section-sub">Disciplines described by what they are for, and the tools behind them. Nothing is scored, because a percentage next to a skill is a number nobody can check.</p>
          </div>
          <div className="skills-layout">
            <div className="panel reveal">
              <h3 className="card-title">Disciplines</h3>
              <ExpertiseList />
            </div>
            <div className="panel reveal">
              <h3 className="card-title">Tools, by what they are for</h3>
              <div className="tool-groups tool-groups--stack">
                {TOOL_GROUPS.map((group) => {
                  const tools = toolsInGroup(group);
                  if (tools.length === 0) return null;
                  return (
                    <div key={group} className="tool-group">
                      <h4 className="label">{group}</h4>
                      <ul className="tool-chips">
                        {tools.map((t) => (
                          <li key={t.name} className="tool-chip">
                            <span className="tool-chip__mark" aria-hidden="true">
                              {t.mark}
                            </span>
                            <span>{t.name}</span>
                            {t.conceptOnly ? <span className="tool-chip__qualifier">concept work</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <p className="fine-print">
                The full stack behind each project is listed on its own page — see <Link href="/case-studies">the case studies</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ContactCTA
        standalone
        title="Want the full picture?"
        text="If you'd like more detail on any part of this background, or want to talk about a role or project, get in touch."
        button="Get in touch"
      />
    </>
  );
}
