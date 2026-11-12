import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SITE } from "@/lib/site";

const DIFFERENTIATORS: { icon: IconName; title: string; text: string }[] = [
  { icon: "lightbulb", title: "Creative Thinking", text: "Ideas with a point of view" },
  { icon: "code", title: "Technical Execution", text: "Designed, built and shipped" },
  { icon: "briefcase", title: "Business Perspective", text: "Grounded in commercial goals" },
];

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__accent" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy enter">
          <p className="eyebrow">Personal Studio</p>
          <h1 className="hero__title" id="hero-title">
            {SITE.name}
            <span className="hero__role">{SITE.role}</span>
          </h1>
          <p className="hero__lead">
            I bring together creative production, software development, intelligent automation, and business strategy to help brands turn ambitious ideas into practical digital solutions.
          </p>
          <div className="hero__actions">
            <ButtonLink href="/work">View Selected Work</ButtonLink>
            <ButtonLink href="/about" variant="secondary" icon={null}>
              About the Studio
            </ButtonLink>
          </div>
          <ul className="hero__points">
            {DIFFERENTIATORS.map((d) => (
              <li key={d.title}>
                <Icon name={d.icon} size={26} />
                <span>
                  <strong>{d.title}</strong>
                  <small>{d.text}</small>
                </span>
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
            sizes="(min-width: 1024px) 520px, 80vw"
            className="hero__portrait"
          />
        </div>
      </div>
    </section>
  );
}
