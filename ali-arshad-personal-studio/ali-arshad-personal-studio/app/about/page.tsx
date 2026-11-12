import type { Metadata } from "next";
import Image from "next/image";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Meet Ali Arshad — a multidisciplinary creative and technical professional with a business and supply chain background, working as an independent studio.",
  path: "/about",
});

const STRENGTHS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "clapperboard",
    title: "Creative production",
    text: "3D visualization in Blender, video editing in Premiere Pro, motion in After Effects, and design in Photoshop and Illustrator.",
  },
  {
    icon: "code",
    title: "Software development",
    text: "Frontend and backend development for websites, dashboards and business applications.",
  },
  {
    icon: "bot",
    title: "AI-powered workflows",
    text: "Automations and AI agents that connect the tools a business already uses and take repetitive work off people's plates.",
  },
  {
    icon: "trending",
    title: "Brand and marketing",
    text: "Brand management, digital marketing and sales experience — so creative work is tied to how a business actually grows.",
  },
  {
    icon: "globe",
    title: "Supply chain thinking",
    text: "A BBA specialization in Supply Chain Management brings structure to sourcing, operations and delivery.",
  },
];

const PRINCIPLES = [
  {
    title: "Start with the business problem",
    text: "Before design or code, I want to understand what the work needs to achieve and how you will know it worked.",
  },
  {
    title: "One person, clear accountability",
    text: "You talk to the person doing the work. No hand-offs between account managers and production teams.",
  },
  {
    title: "Practical over impressive",
    text: "I'd rather ship something simple that gets used than something elaborate that doesn't.",
  },
  {
    title: "Honest about limits",
    text: "If a project needs expertise I don't have, I say so and bring in someone who does.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={
          <>
            One person across <span className="accent">design, code and business</span>
          </>
        }
        lead="I'm Ali Arshad. I run an independent studio that brings creative production, software development and automation together — with a business background that keeps the work commercially grounded."
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
          <ButtonLink href="/contact">Work with me</ButtonLink>
          <ButtonLink href="/experience" variant="secondary" icon={null}>
            View experience
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section" aria-labelledby="intro-title">
        <div className="container split">
          <div className="split__head reveal">
            <p className="eyebrow eyebrow--plain">Introduction</p>
            <h2 className="section-title" id="intro-title">
              A studio built around range
            </h2>
          </div>
          <div className="prose reveal">
            <p>
              Most projects don&rsquo;t fit neatly into one discipline. A product launch needs visuals, a website, a way to capture leads and someone thinking about how it all sells. I set up this studio to handle that kind of work as one connected job rather than four separate ones.
            </p>
            <p>
              My work covers creative production, brand management, digital marketing, sales and software development. That mix means I can take an idea from a first conversation through to something live, and understand the commercial reasons behind each decision along the way.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="background-title">
        <div className="container split">
          <div className="split__head reveal">
            <p className="eyebrow eyebrow--plain">Background</p>
            <h2 className="section-title" id="background-title">
              Business first, then craft
            </h2>
          </div>
          <div className="prose reveal">
            <p>
              I studied for a Bachelor of Business Administration with a specialization in Supply Chain Management. It taught me to look at how things move through a business — products, information, money — and where they get stuck.
            </p>
            <p>
              Alongside that, I built hands-on skills in creative production and software. I work in Blender, Photoshop, Illustrator, Premiere Pro and After Effects on the creative side, and with frontend and backend technologies and AI-powered business workflows on the technical side.
            </p>
            <p>The result is a way of working that treats design, development and operations as parts of the same problem.</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="strengths-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow eyebrow--plain">Strengths</p>
            <h2 className="section-title" id="strengths-title">
              Multidisciplinary by design
            </h2>
            <p className="section-sub">Five areas that work together on most projects.</p>
          </div>
          <ul className="card-grid card-grid--3">
            {STRENGTHS.map((s) => (
              <li key={s.title} className="panel feature-card reveal">
                <Icon name={s.icon} size={26} className="feature-card__icon" />
                <h3 className="card-title">{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="philosophy-title">
        <div className="container split">
          <div className="split__head reveal">
            <p className="eyebrow eyebrow--plain">Working philosophy</p>
            <h2 className="section-title" id="philosophy-title">
              How I like to work
            </h2>
          </div>
          <ol className="principles reveal">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title}>
                <span className="principles__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="card-title">{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="collab-title">
        <div className="container">
          <div className="panel panel--lg collab reveal">
            <div>
              <p className="eyebrow eyebrow--plain">Collaboration model</p>
              <h2 className="section-title" id="collab-title">
                Specialists when the project needs them
              </h2>
            </div>
            <div className="prose">
              <p>
                I do most of the work myself. When a project calls for specialist expertise — blockchain development or a security review, for example — I collaborate with trusted technical professionals.
              </p>
              <p>
                You&rsquo;ll always know who is involved and why. I stay your single point of contact and remain responsible for the result.
              </p>
              <ButtonLink href="/services#specialist-collaboration" variant="secondary">
                See how collaboration works
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <ContactCTA standalone title="Let's talk about your project" text="Tell me what you're working on and where you'd like help. I'll reply with honest thoughts on how I can contribute." />
    </>
  );
}
