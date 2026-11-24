import { ButtonLink } from "@/components/ui/Button";
import { SignatureMark3D } from "@/components/ui/SignatureMark3D";

type Props = {
  eyebrow?: string;
  title?: string;
  text?: string;
  button?: string;
  /** Destination for the primary button (defaults to /contact; supports ?service= preselection). */
  href?: string;
  /** Render as a self-contained section with page padding. */
  standalone?: boolean;
  /** Optional second action beside the primary button. */
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Show the restored 3D studio "A" emblem beside the CTA copy (enabled by default). */
  signature?: boolean;
};

/** Luminous obsidian-and-coral conversion panel featuring the restored 3D "A" mark. */
export function ContactCTA({
  eyebrow = "Get in touch",
  title = "Have a project in mind?",
  text = "Whether you're launching a brand, developing a digital product, or automating business workflows, let's discuss how to bring your idea to life.",
  button = "Contact Ali",
  href = "/contact",
  standalone = false,
  secondaryHref,
  secondaryLabel,
  signature = true,
}: Props) {
  const panel = (
    <div className={`cta-panel ${signature ? "cta-panel--signature" : ""} reveal`.trim()}>
      <div className="cta-panel__texture" aria-hidden="true" />
      <div className="cta-panel__content">
        <p className="eyebrow eyebrow--plain">{eyebrow}</p>
        <h2 className="cta-panel__title">{title}</h2>
        <p className="cta-panel__text">{text}</p>
        <div className="cta-panel__actions">
          <ButtonLink href={href} iconLeft="send">
            {button}
          </ButtonLink>
          {secondaryHref && secondaryLabel ? (
            <ButtonLink href={secondaryHref} variant="secondary" icon={null}>
              {secondaryLabel}
            </ButtonLink>
          ) : null}
        </div>
      </div>
      {signature ? (
        <div className="cta-panel__mark-wrap">
          <SignatureMark3D variant="cta" />
        </div>
      ) : null}
    </div>
  );
  if (!standalone) return panel;
  return (
    <section className="section section--tight" aria-label="Contact">
      <div className="container">{panel}</div>
    </section>
  );
}
