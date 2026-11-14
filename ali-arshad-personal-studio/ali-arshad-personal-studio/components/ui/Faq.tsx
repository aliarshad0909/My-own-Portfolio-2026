import { JsonLd } from "@/components/seo/JsonLd";
import { type FaqItem, faqSchema } from "@/lib/structured-data";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  items: FaqItem[];
  /** Surface variant to alternate with neighbouring sections. */
  surface?: boolean;
};

/**
 * Native-disclosure FAQ: fully server-rendered, crawlable and keyboard
 * operable with no JavaScript. Questions are plain text inside the summary —
 * a heading inside <summary> breaks disclosure semantics in some screen
 * readers, and the section h2 plus FAQPage schema carry the structure. Each page passes its own contextual questions;
 * the matching FAQPage JSON-LD is emitted from the same data so the markup
 * and the schema can never drift apart.
 */
export function Faq({ id, eyebrow, title, items, surface = false }: Props) {
  return (
    <section className={`section ${surface ? "section--surface" : ""}`.trim()} aria-labelledby={`${id}-title`}>
      <JsonLd data={faqSchema(items)} />
      <div className="container">
        <div className="section-head reveal">
          <p className="eyebrow eyebrow--plain">{eyebrow}</p>
          <h2 className="section-title" id={`${id}-title`}>
            {title}
          </h2>
        </div>
        <div className="faq">
          {items.map((item) => (
            <details key={item.q} className="faq__item reveal">
              <summary className="faq__question">
                <span className="faq__q-text">{item.q}</span>
                <span className="faq__marker" aria-hidden="true" />
              </summary>
              <p className="faq__answer">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
