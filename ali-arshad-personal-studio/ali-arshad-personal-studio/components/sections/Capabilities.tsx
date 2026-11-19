import { Icon, type IconName } from "@/components/ui/Icon";

type Stage = {
  icon: IconName;
  label: string;
  title: string;
  text: string;
  href: string;
};

/**
 * Capabilities — one continuous pipeline.
 *
 * Replaces the old four-step "process" block. Instead of describing a workflow
 * in prose, it shows the one thing that actually differentiates the studio:
 * the three disciplines feed each other with no hand-off between them. Built as
 * an inline, CSS-animated SVG rail — lighter and sharper than a video, fully
 * accessible, and silenced under prefers-reduced-motion (see styles/motion.css).
 * A pre-rendered Remotion loop can later replace the rail via the documented
 * slot in docs/motion/ without touching this component's copy.
 */
const STAGES: Stage[] = [
  {
    icon: "clapperboard",
    label: "Create",
    title: "Creative production",
    text: "Brand, 3D, video and design that make the idea legible.",
    href: "/services/creative-production",
  },
  {
    icon: "code",
    label: "Build",
    title: "Development",
    text: "Next.js apps, commerce and dashboards that make it real.",
    href: "/services/web-development",
  },
  {
    icon: "bot",
    label: "Automate",
    title: "AI automation",
    text: "n8n workflows and AI agents that make it run itself.",
    href: "/services/n8n-automation",
  },
];

export function Capabilities() {
  return (
    <section className="section cap" aria-labelledby="cap-title">
      <div className="container">
        <div className="section-head reveal">
          <p className="eyebrow eyebrow--plain">How it connects</p>
          <h2 className="section-title" id="cap-title">
            Three disciplines, one pipeline
          </h2>
          <p className="section-sub">
            The advantage of one studio is continuity. A creative idea becomes a
            built product becomes an automated process, without losing its shape
            in the hand-off between specialists.
          </p>
        </div>

        <div className="cap__rail reveal" role="presentation">
          {/* The animated connecting rail. aria-hidden: the stage list below is
              the accessible, semantic version of the same relationship. */}
          <svg className="cap__flow" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
            <line x1="40" y1="20" x2="960" y2="20" className="cap__flow-rail" />
            <circle className="cap__flow-dot" cx="0" cy="20" r="4" />
            <circle className="cap__flow-dot cap__flow-dot--2" cx="0" cy="20" r="4" />
          </svg>

          <ol className="cap__stages">
            {STAGES.map((s, i) => (
              <li key={s.label} className="cap-node">
                <a href={s.href} className="cap-node__link">
                  <span className="cap-node__badge" aria-hidden="true">
                    <Icon name={s.icon} size={26} />
                  </span>
                  <span className="cap-node__label">{s.label}</span>
                  <span className="cap-node__title">{s.title}</span>
                  <span className="cap-node__text">{s.text}</span>
                  {i < STAGES.length - 1 ? (
                    <span className="cap-node__arrow" aria-hidden="true">
                      <Icon name="arrow-right" size={18} />
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
