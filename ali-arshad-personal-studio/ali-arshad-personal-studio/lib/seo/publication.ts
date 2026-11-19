/**
 * Publication lifecycle for scalable, evidence-gated SEO pages.
 *
 * The portfolio can hold architecture for nationwide service coverage — every
 * US state, pilot cities, industries, a resource library — WITHOUT publishing
 * hundreds of thin, near-identical "doorway" pages. Google treats doorway
 * pages as spam, so a page only becomes real when it has earned the right to
 * exist: unique content and genuine evidence behind the claim it makes.
 *
 * This module is the single gate. Every location, service, industry and
 * resource record carries a `PublicationState`. Two questions are answered
 * here and nowhere else, so the rules can never drift between the router, the
 * sitemap and the metadata:
 *
 *   shouldRender(state)  — does the route resolve publicly at all?
 *   isIndexable(state)   — may search engines index it (index,follow + sitemap)?
 *
 * Nothing is indexable unless it is `Published`. Drafts and evidence-pending
 * pages are visible only on non-production deployments (previews), always
 * noindex, so they can be reviewed before they go live. Production therefore
 * never serves a page that has not been earned.
 */

export const PUBLICATION_STATES = [
  /** An idea in the registry. No page, no content yet. */
  "Researched",
  /** Content drafted. Visible on previews only, noindex. Not in production. */
  "Drafted",
  /**
   * The page is written but makes a claim (a location served, a result) that
   * is not yet backed by evidence. Visible on previews only, noindex.
   */
  "NeedsEvidence",
  /** Earned: unique content + evidence satisfied. Rendered and indexed. */
  "Published",
  /** Was live, deliberately removed. Does not render; may need a redirect. */
  "Retired",
] as const;

export type PublicationState = (typeof PUBLICATION_STATES)[number];

/** True only on the real production deployment (Vercel production env). */
export function isProductionEnv(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * States whose routes resolve on the current deployment.
 *
 * Production serves only `Published`. Previews and local builds also serve
 * `Drafted` and `NeedsEvidence` so work in progress can be reviewed, but those
 * are always noindex (see {@link isIndexable}), and robots.ts disallows preview
 * crawling entirely.
 */
export function renderableStates(): PublicationState[] {
  return isProductionEnv()
    ? ["Published"]
    : ["Published", "NeedsEvidence", "Drafted"];
}

/** Does a route in this state resolve on the current deployment? */
export function shouldRender(state: PublicationState): boolean {
  return renderableStates().includes(state);
}

/**
 * May this page be indexed? Only `Published`. This is environment-independent:
 * a `Drafted` page rendered on a preview is still noindex. Used for the robots
 * meta tag and to decide sitemap membership.
 */
export function isIndexable(state: PublicationState): boolean {
  return state === "Published";
}

/** Human-readable note for internal review UIs and QA output. */
export const PUBLICATION_NOTE: Record<PublicationState, string> = {
  Researched: "Registered opportunity. No page yet.",
  Drafted: "Draft content. Preview only, noindex. Not served in production.",
  NeedsEvidence: "Awaiting evidence before it can be published. Preview only, noindex.",
  Published: "Live and indexable.",
  Retired: "Removed from the live site.",
};
