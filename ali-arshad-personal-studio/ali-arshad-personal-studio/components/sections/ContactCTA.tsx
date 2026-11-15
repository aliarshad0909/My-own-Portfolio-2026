import { ButtonLink } from "@/components/ui/Button";
import { MotionMedia } from "@/components/ui/MotionMedia";

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
  /** Homepage only: the rendered 3D studio mark, as a slow loop over the panel. */
  signature?: boolean;
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
  signature = false,
}: Props) {
  const panel = (
    <div className={`cta-panel ${signature ? "cta-panel--signature" : ""} reveal`.trim()}>
      <div className="cta-panel__texture" aria-hidden="true" />
      {signature ? (
        <div className="cta-panel__mark" aria-hidden="true">
          <MotionMedia
            still={{ src: "/images/signature/mark-3d.webp", alt: "", width: 720, height: 720 }}
            sources={[
              { src: "/videos/mark-3d.webm", type: "video/webm" },
              { src: "/videos/mark-3d.mp4", type: "video/mp4" },
            ]}
            minWidth={900}
          />
        </div>
      ) : null}
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
