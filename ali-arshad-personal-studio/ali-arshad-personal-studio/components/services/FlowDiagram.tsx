import { Icon, type IconName } from "@/components/ui/Icon";

export type FlowStep = {
  label: string;
  detail: string;
  icon: IconName;
  /** Marks the step a person handles rather than the automation. */
  human?: boolean;
};

type Props = {
  title: string;
  steps: FlowStep[];
  /** Shown under the diagram — says what this illustrates and what it does not. */
  caption: string;
};

/**
 * Process diagram, drawn with markup rather than an image so it reflows on
 * narrow screens and stays readable to a screen reader. On desktop the steps
 * run left to right with connectors between them; below 820px they stack and
 * the connectors become vertical, which is why the arrow is a CSS pseudo
 * element rather than an SVG line with fixed coordinates.
 *
 * It is an ordered list because the order is the content.
 */
export function FlowDiagram({ title, steps, caption }: Props) {
  return (
    <figure className="flow">
      <figcaption className="flow__title">{title}</figcaption>
      <ol className="flow__steps">
        {steps.map((step, i) => (
          <li key={step.label} className={`flow__step ${step.human ? "flow__step--human" : ""}`.trim()}>
            <span className="flow__num" aria-hidden="true">
              {i + 1}
            </span>
            <Icon name={step.icon} size={22} className="flow__icon" />
            <span className="flow__label">{step.label}</span>
            <span className="flow__detail">{step.detail}</span>
            {step.human ? <span className="flow__tag">Person</span> : null}
          </li>
        ))}
      </ol>
      <p className="flow__caption">{caption}</p>
    </figure>
  );
}
