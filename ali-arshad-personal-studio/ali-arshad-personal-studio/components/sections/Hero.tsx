import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SITE } from "@/lib/site";

const DISCIPLINES: { icon: IconName; label: string }[] = [
  { icon: "clapperboard", label: "Creative production" },
  { icon: "code", label: "Software development" },
  { icon: "bot", label: "AI automation" },
];

/**
 * Editorial hero.
 *
 * The composition is deliberately asymmetric: an oversized three-line
 * headline on the left, the portrait bleeding off the right edge, and a
 * single coral rule tying the two together. The portrait is the approved
 * photograph from the repository, never regenerated.
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__accent" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy enter">
          <p className="eyebrow">{SITE.name}, Personal Studio</p>

          <h1 className="hero__title" id="hero-title">
            <span className="hero__line">One studio.</span>
            <span className="hero__line hero__line--accent">Multiple disciplines.</span>
            <span className="hero__line">Endless possibilities.</span>
          </h1>

          <p className="hero__lead">
            Creative production, software development and AI automation from one
            independent studio: the full arc of a project, without the hand-offs.
          </p>

          <div className="hero__actions">
            <ButtonLink href="/work">Explore Work</ButtonLink>
            <ButtonLink href="/contact" variant="secondary" icon={null}>
              Start a Project
            </ButtonLink>
          </div>

          <ul className="hero__disciplines" aria-label="Disciplines">
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
            alt="Ali Arshad, standing, wearing a dark suit"
            width={1024}
            height={1536}
            priority
            sizes="(min-width: 1024px) 560px, 80vw"
            className="hero__portrait"
          />
        </div>
      </div>
    </section>
  );
}
