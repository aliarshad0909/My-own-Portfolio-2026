import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { Faq } from "@/components/ui/Faq";
import { personSchema, profilePageSchema, type FaqItem } from "@/lib/structured-data";
import Image from "next/image";
import Link from "next/link";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ArrowLink } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { visibleCredentials } from "@/lib/credentials";
import { EXPERIENCE } from "@/lib/experience";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About the Studio",
  description:
    "Ali Arshad is an independent creative and digital studio of one: a BBA in Supply Chain Management turned multidisciplinary practice across creative production, software development and automation.",
  path: "/about",
});

/** The three pillars. Each is a capability claim that the work pages evidence. */
const PILLARS: { icon: IconName; title: string; lead: string; text: string; proof: string; href: string }[] = [
  {
    icon: "clapperboard",
    title: "Creative perspective",
    lead: "Communicating an idea so it lands.",
    text: "Visual storytelling, design and content that make a product easy to understand: 3D visualization, video, motion and graphics.",
    proof: "See the brand system",
    href: "/case-studies/halcyon-brand-system",
  },
  {
    icon: "code",
    title: "Technical execution",
    lead: "Building the thing, not just describing it.",
    text: "Websites, dashboards and business applications, the integrations between them, and automation that removes repetitive work.",
    proof: "See the storefront build",
    href: "/case-studies/tessera-clayworks-storefront",
  },
  {
    icon: "trending",
    title: "Commercial understanding",
    lead: "Judging the work by what it has to achieve.",
    text: "A business and operations background that asks what a project is for, what it costs and how anyone will know it worked.",
    proof: "See the sourcing model",
    href: "/case-studies/lantern-sourcing-platform",
  },
];

/**
 * The journey, in the order the disciplines were added. Each stage points at a
 * verified entry in lib/experience.ts — nothing here asserts a date, employer
 * or job title, because none of those are confirmed yet. Fill them in
 * lib/experience.ts and /experience renders them automatically.
 */
const JOURNEY = [
  { id: "bba", label: "Business foundation" },
  { id: "analyst-internships", label: "Analytical work" },
  { id: "sales-internship", label: "Commercial work" },
  { id: "brand-management", label: "Brand management" },
  { id: "creative-production", label: "Creative production" },
  { id: "software-development", label: "Software and automation" },
] as const;

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Who is Ali Arshad?",
    a: "An independent designer, developer and creative technologist running a one-person studio: a BBA in Supply Chain Management turned multidisciplinary practice across creative production, software development, AI automation and brand work. The three pillars above describe how those disciplines combine on a project.",
  },
  {
    q: "Does Ali provide video editing and 3D visualization?",
    a: "Yes. Creative production is one of the studio's core services: video editing, motion graphics and Blender 3D product visualization. The Blender product visualization and motion production pipeline entries in the work section show complete demonstration builds of both.",
  },
  {
    q: "Why one studio across several disciplines?",
    a: "Because projects rarely fail inside one discipline. A product that works but cannot be explained, or a campaign that looks right but ignores the economics, fails all the same. One studio carrying creative perspective, technical execution and commercial understanding means those judgements happen together rather than across three vendors.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={profilePageSchema()} />
      <JsonLd data={personSchema()} />
      <PageHero
        eyebrow="About"
        title={
          <>
            The person <span className="accent">behind the studio</span>
          </>
        }
        lead="Creative thinking. Technical execution. Business understanding. I run an independent studio where those three come from the same person rather than three different vendors."
        aside={
          <div className="portrait-frame portrait-frame--about enter enter--portrait">
            <Image
              src="/images/portraits/portrait-about.webp"
              alt="Portrait of Ali Arshad wearing a black leather jacket"
              width={1157}
              height={1360}
              priority
              sizes="(min-width: 1024px) 460px, 80vw"
            />
          </div>
        }
      >
        <div className="hero__actions">
          <ButtonLink href="/contact">Discuss your project</ButtonLink>
          <ButtonLink href="/work" variant="secondary" icon={null}>
            Explore my work
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section" aria-labelledby="background-title">
        <div className="container split">
          <div className="split__head reveal">
            <p className="eyebrow eyebrow--plain">Background</p>
            <h2 className="section-title" id="background-title">
              Business first, then craft
            </h2>
          </div>
          <div className="prose reveal">
            <p>
              My background began in business. I studied for a Bachelor of Business Administration with a major in Supply Chain Management at Bahria
              University Islamabad, where the subject was how organisations move resources, information and money through a process, and where those
              processes get stuck.
            </p>
            <p>
              Over time my interests expanded into software development, creative production and intelligent automation. None of that replaced the
              business thinking; it sat on top of it. A sourcing problem and a slow checkout flow turn out to be the same kind of problem looked at from
              two ends.
            </p>
            <p>
              Today I combine those perspectives, which means I can take a project from a first conversation through to something working, and explain
              the commercial reason behind each decision on the way.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="pillars-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow eyebrow--plain">What makes the approach different</p>
            <h2 className="section-title" id="pillars-title">
              Three perspectives, one person
            </h2>
            <p className="section-sub">
              Most studios have one of these and buy in the others. Having all three in the same head is what removes the hand-offs where projects
              usually lose their shape.
            </p>
          </div>
          <ul className="pillars">
            {PILLARS.map((p, i) => (
              <li key={p.title} className="pillar reveal">
                <span className="pillar__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon name={p.icon} size={28} className="pillar__icon" />
                <h3 className="pillar__title">{p.title}</h3>
                <p className="pillar__lead">{p.lead}</p>
                <p className="pillar__text">{p.text}</p>
                <Link href={p.href} className="pillar__proof">
                  <span>{p.proof}</span>
                  <Icon name="arrow-up-right" size={15} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="journey-title">
        <div className="container split">
          <div className="split__head reveal">
            <p className="eyebrow eyebrow--plain">Journey</p>
            <h2 className="section-title" id="journey-title">
              How the range was built
            </h2>
            <p className="section-sub">
              The order the disciplines arrived in, not a list of job titles. Dates, employers and exact titles are published on the experience page as
              each one is confirmed.
            </p>
            <EditorNote>
              Journey stages read from lib/experience.ts. Add `period`, `title` and `organization` there once verified and they appear on /experience.
            </EditorNote>
            <ButtonLink href="/experience" variant="secondary" icon={null}>
              See full experience
            </ButtonLink>
          </div>

          <ol className="journey reveal">
            {JOURNEY.map((stage, i) => {
              const entry = EXPERIENCE.find((e) => e.id === stage.id);
              if (!entry) return null;
              return (
                <li key={stage.id} className="journey__item">
                  <span className="journey__marker" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="journey__body">
                    <p className="journey__stage">{stage.label}</p>
                    <h3 className="journey__area">{entry.title ?? entry.area}</h3>
                    {entry.organization || entry.period ? (
                      <p className="journey__meta">{[entry.organization, entry.period].filter(Boolean).join(" · ")}</p>
                    ) : null}
                    <p className="journey__summary">{entry.summary}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="collab-title">
        <div className="container">
          <div className="panel panel--lg collab reveal">
            <div>
              <p className="eyebrow eyebrow--plain">Collaboration model</p>
              <h2 className="section-title" id="collab-title">
                Independent by design. Collaborative when it matters.
              </h2>
            </div>
            <div className="prose">
              <p>
                I lead projects within my own capabilities personally: you talk to the person doing the work, not to an account manager relaying it.
              </p>
              <p>
                When a project needs expertise outside mine, such as blockchain development or a security review, I bring in trusted professionals and
                manage the collaboration. You always know who is involved and why. I stay the single point of contact and remain responsible for the
                result.
              </p>
              <p className="fine-print">
                This is a studio of one with a network, not an agency with a permanent team. Partner involvement is agreed with you upfront, never
                assumed.
              </p>
              <ButtonLink href="/services#specialist-collaboration" variant="secondary">
                See how collaboration works
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="about-creds-title">
        <div className="container">
          <div className="panel panel--lg cred-strip reveal">
            <div>
              <p className="eyebrow eyebrow--plain">Credentials</p>
              <h2 className="section-title section-title--sm" id="about-creds-title">
                Certified where it counts
              </h2>
              <p className="section-sub">
                Professional certifications in the areas I practise, kept current. Each one links to the issuer&rsquo;s record where a public one exists.
              </p>
            </div>
            <ul className="cred-strip__list">
              {visibleCredentials().map((c) => (
                <li key={c.id}>
                  <span className="cred-strip__mark" aria-hidden="true">
                    {c.mark}
                  </span>
                  <span className="cred-strip__text">
                    <strong>{c.title}</strong>
                    <small>{c.issuer}</small>
                  </span>
                </li>
              ))}
            </ul>
            <ArrowLink href="/experience#creds-title">See all credentials</ArrowLink>
          </div>
        </div>
      </section>

      <Faq id="about-faq" eyebrow="Common questions" title="Asked about the studio" items={FAQ_ITEMS} />

      <ContactCTA
        standalone
        title="Have an idea worth building?"
        text="Whether it's a brand, a digital product, a production challenge or an automation opportunity, I'm interested in understanding what you're working toward."
        button="Discuss your project"
      />
    </>
  );
}
