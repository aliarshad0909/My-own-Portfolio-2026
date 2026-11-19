/**
 * Evidence integrity & location editorial-review checks.
 *
 * The publication gate asks whether a page's `evidenceRequired` strings are all
 * present in `evidenceHave`. That is necessary but not sufficient: declarations
 * must never bypass reality. A `Published` page may cite only builds that
 * genuinely exist, and its claimed evidence tier must match the actual record.
 *
 * Explicitly distinguishes four evidence tiers so locally tested demonstrations
 * are NEVER equated with publicly deployed apps, verified professional work or
 * client outcomes:
 *
 *   1. `locally-tested-demo`        — status Demo Ready with no public `liveUrl`
 *   2. `publicly-deployed-demo`     — status Demo Ready with a real public `liveUrl`
 *   3. `verified-professional-work` — Professional Work with status Verified/Published
 *   4. `verified-client-outcome`    — Consented client testimonial / verified outcome
 *
 * Drafts may still reference in-progress work because they are noindex and do
 * not render in production.
 *
 * Also enforces the mandatory editorial-review gate on all state, city and
 * service-area location pages so templated scaffolds can never be published.
 */

import { getProject, isLive, type Project, type ProjectStatus } from "@/lib/projects";
import { isIndexable, type PublicationState } from "@/lib/seo/publication";
import { SERVICE_HUBS } from "@/lib/seo/service-hubs";
import { INDUSTRIES } from "@/lib/content/industries";
import { EVIDENCE_PREDICATES, KEYWORD_REGISTRY } from "@/lib/seo/keyword-registry";
import { US_STATES } from "@/lib/geo/states";
import { PILOT_CITIES } from "@/lib/geo/cities";
import { cityServiceAreas, serviceAreaMatrix } from "@/lib/seo/service-areas";
import { publishableTestimonials } from "@/lib/content/testimonials";

export type EvidenceTier =
  | "not-built"
  | "locally-tested-demo"
  | "publicly-deployed-demo"
  | "verified-professional-work"
  | "verified-client-outcome";

/** Classify a project's honest evidence tier from its actual record fields. */
export function evidenceTierOf(project: Project): EvidenceTier {
  if (!isLive(project)) return "not-built";
  if (project.projectType === "Professional Work" && (project.status === "Verified" || project.status === "Published")) {
    return "verified-professional-work";
  }
  if (project.liveUrl && project.liveUrl.trim() !== "") {
    return "publicly-deployed-demo";
  }
  return "locally-tested-demo";
}

export type EvidenceViolation = {
  page: string;
  project: string;
  reason: string;
};

type Cited = { page: string; state: PublicationState; slugs: string[]; keywordId?: string };

function citedEvidence(): Cited[] {
  const out: Cited[] = [];
  for (const h of SERVICE_HUBS) {
    out.push({ page: `/services/${h.slug}`, state: h.publicationState, slugs: h.projectSlugs, keywordId: h.keywordId });
    for (const s of h.spokes) {
      out.push({ page: `/services/${h.slug}/${s.slug}`, state: s.publicationState, slugs: s.projectSlugs, keywordId: s.keywordId });
    }
  }
  for (const i of INDUSTRIES) {
    out.push({ page: `/industries/${i.slug}`, state: i.publicationState, slugs: i.projectSlugs, keywordId: i.keywordId });
  }
  return out;
}

/**
 * Published pages citing a project that is missing, not built, or weaker than
 * the evidence tier claimed in its keyword-registry row.
 */
export function evidenceViolations(): EvidenceViolation[] {
  const out: EvidenceViolation[] = [];
  const byUrl = new Map(KEYWORD_REGISTRY.map((k) => [k.primaryUrl, k]));

  for (const { page, state, slugs } of citedEvidence()) {
    if (!isIndexable(state)) continue; // drafts may reference in-progress work
    const resolved: Project[] = [];
    for (const slug of slugs) {
      const project = getProject(slug);
      if (!project) {
        out.push({ page, project: slug, reason: "cited project does not exist" });
        continue;
      }
      if (!isLive(project)) {
        const status: ProjectStatus = project.status;
        out.push({ page, project: slug, reason: `cited as evidence but status is "${status}" (not a built demonstration)` });
        continue;
      }
      resolved.push(project);
    }

    const row = byUrl.get(page);
    if (row) {
      if (
        row.evidenceHave.includes(EVIDENCE_PREDICATES.PUBLIC_DEMO) &&
        !resolved.some((p) => evidenceTierOf(p) === "publicly-deployed-demo")
      ) {
        out.push({
          page,
          project: slugs.join(", ") || "(none)",
          reason: "claims publicly deployed demo, but cited builds are locally tested only (no liveUrl)",
        });
      }
      if (
        row.evidenceHave.includes(EVIDENCE_PREDICATES.VERIFIED_WORK) &&
        !resolved.some((p) => evidenceTierOf(p) === "verified-professional-work")
      ) {
        out.push({
          page,
          project: slugs.join(", ") || "(none)",
          reason: "claims verified professional work, but no Verified/Published Professional Work build is cited",
        });
      }
      if (
        row.evidenceHave.includes(EVIDENCE_PREDICATES.REAL_CLIENT) &&
        publishableTestimonials().length === 0 &&
        !resolved.some((p) => evidenceTierOf(p) === "verified-professional-work")
      ) {
        out.push({
          page,
          project: slugs.join(", ") || "(none)",
          reason: "claims consented client outcome, but none exists",
        });
      }
    }
  }
  return out;
}

const slugIsSubstantiated = (slug: string): boolean => {
  const p = getProject(slug);
  return p ? evidenceTierOf(p) !== "not-built" : false;
};

/** Published service hubs, spokes or industries that cite no substantiated build at all. */
export function publishedWithoutLiveEvidence(): string[] {
  const out: string[] = [];
  for (const h of SERVICE_HUBS) {
    if (isIndexable(h.publicationState) && !h.projectSlugs.some(slugIsSubstantiated)) {
      out.push(`/services/${h.slug}`);
    }
    for (const s of h.spokes) {
      if (isIndexable(s.publicationState) && !s.projectSlugs.some(slugIsSubstantiated)) {
        out.push(`/services/${h.slug}/${s.slug}`);
      }
    }
  }
  for (const i of INDUSTRIES) {
    if (isIndexable(i.publicationState) && !i.projectSlugs.some(slugIsSubstantiated)) {
      out.push(`/industries/${i.slug}`);
    }
  }
  return out;
}

/**
 * Guard against publishing templated location scaffolds.
 * Every Published state, city or service-area page MUST pass editorial review
 * (`reviewed && hasCustomContent`) AND hold local signal + unique copy + editorial review.
 */
export function unreviewedPublishedLocations(): string[] {
  const out: string[] = [];
  const hasAllPredicates = (have: string[]) =>
    have.includes(EVIDENCE_PREDICATES.LOCAL_SIGNAL) &&
    have.includes(EVIDENCE_PREDICATES.UNIQUE_COPY) &&
    have.includes(EVIDENCE_PREDICATES.EDITORIAL_REVIEW);

  for (const s of US_STATES) {
    if (isIndexable(s.publicationState)) {
      if (!s.editorialReview.reviewed || !s.editorialReview.hasCustomContent || !hasAllPredicates(s.evidenceHave)) {
        out.push(`/locations/${s.slug}`);
      }
    }
  }
  for (const c of PILOT_CITIES) {
    if (isIndexable(c.publicationState)) {
      if (!c.editorialReview.reviewed || !c.editorialReview.hasCustomContent || !hasAllPredicates(c.evidenceHave)) {
        out.push(`/locations/${c.stateSlug}/${c.slug}`);
      }
    }
  }
  for (const a of serviceAreaMatrix()) {
    if (isIndexable(a.publicationState)) {
      if (!a.editorialReview.reviewed || !a.editorialReview.hasCustomContent || !hasAllPredicates(a.evidenceHave)) {
        out.push(a.url);
      }
    }
  }
  for (const ca of cityServiceAreas()) {
    if (isIndexable(ca.publicationState)) {
      if (!ca.editorialReview.reviewed || !ca.editorialReview.hasCustomContent) {
        out.push(ca.url);
      }
    }
  }
  return out;
}
