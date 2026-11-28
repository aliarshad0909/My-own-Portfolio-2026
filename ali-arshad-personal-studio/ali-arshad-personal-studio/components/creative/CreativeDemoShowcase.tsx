import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CREATIVE_DEMOS, creativeDemosByCategories, type CreativeDemoCategory } from "@/lib/creative-demos";

type Props = {
  id?: string;
  eyebrow?: string;
  heading?: string;
  lead?: string;
  categories?: readonly CreativeDemoCategory[];
  surface?: boolean;
  compact?: boolean;
};

/**
 * Displays honestly badged studio-created demonstrations & concepts for
 * Photoshop retouching/compositing, Illustrator vector illustration, social
 * brand content direction, and NFT/digital collectible art direction.
 */
export function CreativeDemoShowcase({
  id = "creative-demonstrations",
  eyebrow = "Studio-Created Visual Demonstrations",
  heading = "Photoshop, Illustrator, social content & digital collectible craft",
  lead = "Original pieces produced by Ali Arshad Personal Studio so you can judge retouching, vector precision, grid cohesion, and 3D collectible art direction directly — clearly labeled as studio demonstrations, never client commissions.",
  categories,
  surface = false,
  compact = false,
}: Props) {
  const items = categories ? creativeDemosByCategories(categories) : [...CREATIVE_DEMOS];
  if (items.length === 0) return null;

  return (
    <section
      className={`section ${surface ? "section--surface" : ""} ${compact ? "section--tight" : ""}`.trim()}
      id={id}
      aria-labelledby={`${id}-title`}
    >
      <div className="container">
        <div className="section-head">
          <p className="eyebrow eyebrow--plain">{eyebrow}</p>
          <h2 className={`section-title ${compact ? "section-title--sm" : ""}`.trim()} id={`${id}-title`}>
            {heading}
          </h2>
          <p className="section-sub">{lead}</p>
        </div>

        <div className={`creative-demo-grid ${items.length === 1 ? "creative-demo-grid--single" : ""}`.trim()}>
          {items.map((demo) => (
            <article key={demo.id} className="panel creative-demo-card">
              <div className="creative-demo-card__media">
                <Image
                  src={demo.imageSrc}
                  alt={demo.imageAlt}
                  width={demo.width}
                  height={demo.height}
                  sizes={
                    items.length === 1
                      ? "(min-width: 1024px) 620px, 94vw"
                      : "(min-width: 1024px) 560px, 94vw"
                  }
                  className="creative-demo-card__img"
                />
                <span
                  className={`creative-demo-card__badge ${
                    demo.badge === "Studio-Created Concept" ? "creative-demo-card__badge--concept" : ""
                  }`.trim()}
                >
                  {demo.badge}
                </span>
                {demo.hasVectorOverlay ? (
                  <span className="creative-demo-card__svg-mark" aria-hidden="true" title="Scalable vector geometry">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <circle cx="13" cy="13" r="10.5" stroke="#ff7a5c" strokeWidth="1" strokeDasharray="2 2" />
                      <path d="M5 18L13 5L21 18H5Z" stroke="#f8f5ef" strokeWidth="1.2" />
                      <circle cx="13" cy="5" r="1.8" fill="#ff7a5c" />
                      <circle cx="5" cy="18" r="1.8" fill="#f8f5ef" />
                      <circle cx="21" cy="18" r="1.8" fill="#f8f5ef" />
                    </svg>
                  </span>
                ) : null}
              </div>

              <div className="creative-demo-card__body">
                <p className="creative-demo-card__discipline">{demo.discipline}</p>
                <h3 className="card-title">{demo.title}</h3>
                <p className="creative-demo-card__summary">{demo.summary}</p>

                {!compact ? (
                  <ul className="plain-list creative-demo-card__list">
                    {demo.techniques.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : null}

                <ul className="tag-list" aria-label="Tools and focus">
                  {demo.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>

                <p className="fine-print creative-demo-card__deliverables">
                  <strong>Typical handoff:</strong> {demo.deliverables}
                </p>

                <div className="creative-demo-card__actions">
                  <Link
                    href={`/contact?service=${encodeURIComponent(demo.contactService)}`}
                    className="btn btn--secondary btn--sm"
                  >
                    <span>Request similar scope</span>
                    <Icon name="arrow-up-right" size={14} className="btn__icon" />
                  </Link>
                  <Link href={demo.serviceHref} className="arrow-link">
                    <span>{demo.serviceLabel}</span>
                    <Icon name="arrow-right" size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="fine-print" style={{ marginTop: "16px" }}>
          Disclosure: Every visual above is an original studio-created demonstration or concept produced by Ali Arshad Personal Studio — not a paid
          client commission, client testimonial, or active commercial NFT mint.
        </p>
      </div>
    </section>
  );
}
