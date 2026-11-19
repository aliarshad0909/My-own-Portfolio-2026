import { publishableTestimonials } from "@/lib/content/testimonials";

/**
 * Renders consented testimonials, or nothing. There is no empty-state copy and
 * no placeholder — an absence of testimonials is shown as an absence, never as
 * an invented quote. When real, consented quotes exist in lib/content/
 * testimonials.ts, this section appears automatically.
 */
export function Testimonials({ title = "In their words" }: { title?: string }) {
  const items = publishableTestimonials();
  if (items.length === 0) return null;

  return (
    <section className="container section" aria-label="Testimonials">
      <h2 className="section-title">{title}</h2>
      <ul className="testimonial-list">
        {items.map((t) => (
          <li key={`${t.author}-${t.quote.slice(0, 16)}`} className="testimonial">
            <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
            <p className="testimonial__by">
              <strong>{t.author}</strong>
              <span className="muted"> — {t.role}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
