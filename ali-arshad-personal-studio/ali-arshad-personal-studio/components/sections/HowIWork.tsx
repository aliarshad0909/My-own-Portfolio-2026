import { Icon, type IconName } from "@/components/ui/Icon";

const STAGES: { icon: IconName; step: string; text: string }[] = [
  { icon: "lightbulb", step: "Discover", text: "Understand the business, the constraint and what the project actually has to achieve." },
  { icon: "layers", step: "Design", text: "Turn that into a scope, a shape and a plan you can hold me to." },
  { icon: "code", step: "Build", text: "Produce the work — designed, developed, automated or filmed." },
  { icon: "check", step: "Deliver", text: "Hand over tested, documented and explained, with support agreed." },
];

/** Four-stage workflow, drawn as connected steps rather than a block of text. */
export function HowIWork() {
  return (
    <section className="section" aria-labelledby="how-title">
      <div className="container">
        <div className="section-head reveal">
          <p className="eyebrow eyebrow--plain">How I work</p>
          <h2 className="section-title" id="how-title">
            Discover → Design → Build → Deliver
          </h2>
          <p className="section-sub">
            The same four stages on every project. The advantage of one person carrying all of them is that nothing is lost translating a creative idea
            into a technical build, or a technical constraint back into a commercial decision.
          </p>
        </div>

        <ol className="stages">
          {STAGES.map((s, i) => (
            <li key={s.step} className="stage reveal">
              <span className="stage__num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Icon name={s.icon} size={24} className="stage__icon" />
              <h3 className="stage__title">{s.step}</h3>
              <p className="stage__text">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
