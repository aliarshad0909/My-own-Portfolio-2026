/**
 * Local content + source model for location and service-area pages.
 *
 * This is the smallest maintainable addition for genuinely local, cited
 * content. It is DATA ONLY and changes nothing about the publication gate:
 * a page carrying local content stays exactly as (non-)indexable as its
 * `publicationState` in lib/seo/publication.ts already dictates. Enriching a
 * page does not publish it.
 *
 * Honesty rules baked into the shape:
 *  - Every factual local claim lives in a `SourcedParagraph` that references
 *    one or more real `LocalSource` entries. A claim with no source is not a
 *    fact we may state; omit it instead.
 *  - Sources are real, current, reputable (official city/state/federal,
 *    economic-development, university or industry). Never fabricated.
 *  - Nothing here may assert a local office, local staff, local clients,
 *    local results or in-person availability. Service fit is framed remotely.
 */

/** A real, citable source. `accessed` is an ISO date (YYYY-MM-DD). */
export type LocalSource = {
  title: string;
  url: string;
  publisher: string;
  accessed: string;
};

/**
 * One paragraph of local context. `sources` holds indexes into the owning
 * record's `sources` array for every factual claim the paragraph makes. A
 * purely interpretive sentence (how a remote studio service could help) may
 * carry no sources, but any economic fact, figure or named sector must.
 */
export type SourcedParagraph = {
  text: string;
  sources?: number[];
};

/** How one studio service connects to the local economy (interpretive, remote). */
export type ServiceFit = {
  /** Display label, e.g. "AI & automation". */
  service: string;
  /** Internal link to the matching hub, e.g. "/services/n8n-automation". */
  href: string;
  text: string;
};

/** Genuinely local, cited content for a /locations/[state] page. */
export type StateLocalContent = {
  /** One-line local angle used as a section standfirst. */
  angle: string;
  /** Sourced economic context, distinct per state. */
  context: SourcedParagraph[];
  /** How specific remote services fit this state's economy. */
  serviceFit: ServiceFit[];
  /** Real citations referenced by `context` paragraphs. */
  sources: LocalSource[];
};

/** Genuinely local, cited content for a state service-area scaffold. */
export type ServiceAreaLocalContent = {
  angle: string;
  context: SourcedParagraph[];
  sources: LocalSource[];
};

/** True when a record has real, cited substance (used by audit/reporting). */
export function hasLocalSignal(c: { context: SourcedParagraph[]; sources: LocalSource[] } | undefined): boolean {
  if (!c) return false;
  const citedClaims = c.context.some((p) => (p.sources?.length ?? 0) > 0);
  return citedClaims && c.sources.length > 0;
}
