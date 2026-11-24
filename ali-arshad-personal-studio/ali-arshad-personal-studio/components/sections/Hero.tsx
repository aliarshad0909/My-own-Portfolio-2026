import { ChangingFocus } from "@/components/ui/ChangingFocus";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SignatureMark3D } from "@/components/ui/SignatureMark3D";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { SITE } from "@/lib/site";

const DISCIPLINES: { icon: IconName; label: string }[] = [
  { icon: "code", label: "SaaS, Web & E-Commerce" },
  { icon: "bot", label: "AI Agents & Automation" },
  { icon: "clapperboard", label: "Creative & Brand Production" },
];

/**
 * Conversion-focused editorial hero for Ali Arshad Personal Studio.
 * Places the sculpted 3D "A" logo directly in open visual space on the right
 * (unboxed, no portrait, no caption beneath the mark) against the obsidian
 * and warm coral studio atmosphere.
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__accent" aria-hidden="true" />
      <div className="container hero__inner hero__inner--mark">
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

        {/* Open visual space for the unboxed 3D "A" logo — no card, no portrait, no caption */}
        <div className="hero__mark-stage">
          <SignatureMark3D variant="hero" />
        </div>
      </div>
    </section>
  );
}
