/**
 * Testimonial infrastructure.
 *
 * Deliberately empty. There are no testimonials because none have been
 * collected and consented to yet, and inventing them is exactly the kind of
 * fabrication this whole architecture refuses. The types and helpers exist so
 * that, when a real client gives a real, consented quote, it drops in here and
 * renders — and until then, nothing shows. A test asserts the list is either
 * empty or fully consented, so a placeholder can never slip into production.
 */

export type Testimonial = {
  /** The quote, in the client's words. */
  quote: string;
  author: string;
  /** Role and company, as the client agreed to display them. */
  role: string;
  /** Explicit, recorded consent to publish this quote. Required to render. */
  consented: boolean;
  /** Optional link to the related work. */
  projectSlug?: string;
};

/** No fabricated testimonials. Add only real, consented quotes. */
export const TESTIMONIALS: Testimonial[] = [];

/** Only consented testimonials ever render. */
export const publishableTestimonials = (): Testimonial[] =>
  TESTIMONIALS.filter((t) => t.consented && t.quote.trim() !== "");

/** Guard: any testimonial present must be consented (caught by tests). */
export const unconsentedTestimonials = (): Testimonial[] =>
  TESTIMONIALS.filter((t) => !t.consented);
