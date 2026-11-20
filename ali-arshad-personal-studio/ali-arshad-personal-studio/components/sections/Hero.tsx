import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SITE } from "@/lib/site";

const DISCIPLINES: { icon: IconName; label: string }[] = [
  { icon: "clapperboard", label: "Creative Production" },
  { icon: "code", label: "Software Development" },
  { icon: "bot", label: "AI & Automation" },
];

/**
 * Conversion-focused editorial hero.
 * Preserves the approved portrait-hero.webp photograph and studio identity.
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__accent" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy enter">
          <p className="eyebrow">
            {SITE.name} — {SITE.descriptor}
          </p>

          <h1 className="hero__title" id="hero-title">
            <span className="hero__line">Creative thinking.</span>
            <span className="hero__line hero__line--accent">Technical execution.</span>
            <span className="hero__line">One studio.</span>
          </h1>

          <p className="hero__lead">
            Creative production, software development, AI automation and business strategy — delivered directly by one independent studio without
            agency hand-offs.
          </p>

          <div className="hero__actions">
            <ButtonLink href="/contact">Start a Project</ButtonLink>
            <ButtonLink href="/work" variant="secondary" icon={null}>
              Explore My Work
            </ButtonLink>
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

        <div className="hero__visual enter enter--portrait">
          <Image
            src="/images/portraits/portrait-hero.webp"
            alt="Ali Arshad, founder of Ali Arshad Personal Studio"
            width={1024}
            height={1536}
            priority
            sizes="(min-width: 1024px) 520px, 80vw"
            className="hero__portrait"
          />
        </div>
      </div>
    </section>
  );
}
