import Image from "next/image";
import { StudioHeroCanvasLoader } from "@/components/three/StudioHeroCanvasLoader";
import { ChangingFocus } from "@/components/ui/ChangingFocus";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { SITE } from "@/lib/site";

const DISCIPLINES: { icon: IconName; label: string }[] = [
  { icon: "code", label: "SaaS, Web & E-Commerce" },
  { icon: "bot", label: "AI Agents & Automation" },
  { icon: "clapperboard", label: "Creative & Brand Production" },
];

/**
 * Conversion-focused editorial hero for Ali Arshad Personal Studio.
 * Composes Ali's existing studio portrait alongside the unboxed sculpted 3D "A"
 * logo directly in open obsidian-and-coral visual space (no card, no caption).
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__accent" aria-hidden="true" />
      <StudioHeroCanvasLoader />
      <div className="container hero__inner hero__inner--portrait">
        <div className="hero__copy enter">
          <p className="eyebrow">
            {SITE.name} — {SITE.descriptor}
          </p>

          <ChangingFocus />

          <h1 className="hero__title" id="hero-title">
            <span className="hero__line">Custom software,</span>
            <span className="hero__line hero__line--accent">AI automation &amp; creative</span>
            <span className="hero__line">built in one studio.</span>
          </h1>

          <p className="hero__lead">
            I help US and international businesses ship Next.js web applications, practical workflow automation, and sharp brand visuals — working
            directly with one accountable builder instead of layered agency hand-offs.
          </p>

          <div className="hero__actions">
            <TrackedLink
              href="/contact"
              event="cta_click"
              props={{ placement: "hero", label: "Start a Project" }}
              className="btn btn--primary btn--md"
            >
              <span>Start a Project</span>
              <Icon name="arrow-up-right" size={18} className="btn__icon" />
            </TrackedLink>
            <TrackedLink
              href="/work"
              event="cta_click"
              props={{ placement: "hero", label: "Explore Curated Work" }}
              className="btn btn--secondary btn--md"
            >
              <span>Explore Curated Work</span>
            </TrackedLink>
            <TrackedLink
              href="/#live-product-demonstrations"
              event="cta_click"
              props={{ placement: "hero", label: "Try Live Product Demos" }}
              className="btn btn--secondary btn--md"
            >
              <span>Try Live Demos</span>
            </TrackedLink>
          </div>

          <ul className="hero__disciplines" aria-label="Core studio capabilities">
            {DISCIPLINES.map((d) => (
              <li key={d.label}>
                <Icon name={d.icon} size={17} />
                <span>{d.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Homepage hero portrait only; the 3D studio mark remains on other pages. */}
        <div className="hero__stage hero__stage--portrait">
          <div className="hero__portrait-stage enter enter--portrait">
            <Image
              src="/images/portraits/portrait-hero.webp"
              alt="Ali Arshad, founder of Ali Arshad Personal Studio"
              width={1024}
              height={1536}
              priority
              fetchPriority="high"
              sizes="(min-width: 1280px) 480px, (min-width: 1024px) 36vw, 80vw"
              className="hero__portrait-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
