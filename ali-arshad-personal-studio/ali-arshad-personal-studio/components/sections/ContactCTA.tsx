import { ButtonLink } from "@/components/ui/Button";
import { SignatureMark3D } from "@/components/ui/SignatureMark3D";

type Props = {
  eyebrow?: string;
  title?: string;
  text?: string;
  button?: string;
  /** Destination for the primary button (defaults to /contact; supports ?service= preselection). */
  href?: string;
  /** Render as a self-contained full-width section (default true for shared CTA sections). */
  standalone?: boolean;
  /** Optional second action beside the primary button. */
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Show the existing 3D studio "A" emblem directly in open visual space on the right. */
  signature?: boolean;
};

/**
 * Full-width warm coral, copper, and dark conversion band with crisp copy and
 * primary CTA on the left and the sculpted 3D "A" floating freely in open
 * visual space on the right (no card, panel, border, or frame around the mark).
 */
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
  const inner = (
    <div className={`cta-band__grid ${signature ? "cta-band__grid--signature" : ""}`.trim()}>
      <div className="cta-band__copy reveal">
        <p className="eyebrow eyebrow--plain cta-band__eyebrow">{eyebrow}</p>
        <h2 className="cta-band__title">{title}</h2>
        <p className="cta-band__text">{text}</p>
        <div className="cta-band__actions">
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
        <div className="cta-band__visual">
          <SignatureMark3D variant="cta" />
        </div>
      ) : null}
    </div>
  );

  if (!standalone) {
    return (
      <div className="cta-band cta-band--embedded">
        <div className="cta-band__texture" aria-hidden="true" />
        <div className="container cta-band__container">{inner}</div>
      </div>
    );
  }

  return (
    <section className="cta-band" aria-label="Contact">
      <div className="cta-band__texture" aria-hidden="true" />
      <div className="container cta-band__container">{inner}</div>
    </section>
  );
}
