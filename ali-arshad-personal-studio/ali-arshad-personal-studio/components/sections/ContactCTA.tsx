import { ButtonLink } from "@/components/ui/Button";

type Props = {
  eyebrow?: string;
  title?: string;
  text?: string;
  button?: string;
  /** Render as a self-contained section with page padding. */
  standalone?: boolean;
  /** Optional second action beside the primary button. */
  secondaryHref?: string;
  secondaryLabel?: string;
};

/** Coral-accented conversion panel used on the homepage and at the end of inner pages. */
export function ContactCTA({
  eyebrow = "Get in touch",
  title = "Have a project in mind?",
  text = "Whether you're launching a brand, developing a digital product, or automating business workflows, let's discuss how to bring your idea to life.",
  button = "Contact Ali",
  standalone = false,
  secondaryHref,
  secondaryLabel,
}: Props) {
  const panel = (
    <div className="cta-panel reveal">
      <div className="cta-panel__texture" aria-hidden="true" />
      <div className="cta-panel__content">
        <p className="eyebrow eyebrow--plain">{eyebrow}</p>
        <h2 className="cta-panel__title">{title}</h2>
        <p className="cta-panel__text">{text}</p>
        <div className="cta-panel__actions">
          <ButtonLink href="/contact" iconLeft="send">
            {button}
          </ButtonLink>
          {secondaryHref && secondaryLabel ? (
            <ButtonLink href={secondaryHref} variant="secondary" icon={null}>
              {secondaryLabel}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </div>
  );
  if (!standalone) return panel;
  return (
    <section className="section section--tight" aria-label="Contact">
      <div className="container">{panel}</div>
    </section>
  );
}
