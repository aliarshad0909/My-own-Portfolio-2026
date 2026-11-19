/**
 * Evidence integrity checks.
 *
 * The publication gate asks whether a page's `evidenceRequired` strings are all
 * present in `evidenceHave`. That is necessary but not sufficient: a string
 * like "a working demo exists" is only true if the cited project is *actually
 * built*. Without this module, a page could declare the evidence string while
 * citing a project that is still "In Development" — the declaration would pass
 * eligibility while the claim on the page is false.
 *
 * This closes that gap. The rule: no `Published` page may cite a project that
 * is not live (status Demo Ready, Verified or Published). A page that sells a
 * capability "evidenced by a demonstration build" must cite a build that
 * genuinely exists. Drafts may reference in-progress work, because they do not
 * render in production and are noindex.
 */

import { getProject, isLive, type ProjectStatus } from "@/lib/projects";
import { isIndexable, type PublicationState } from "@/lib/seo/publication";
import { SERVICE_HUBS } from "@/lib/seo/service-hubs";
import { INDUSTRIES } from "@/lib/content/industries";

export type EvidenceViolation = {
  page: string;
  project: string;
  reason: string;
};

type Cited = { page: string; state: PublicationState; slugs: string[] };

function citedEvidence(): Cited[] {
  const out: Cited[] = [];
  for (const h of SERVICE_HUBS) {
    out.push({ page: `/services/${h.slug}`, state: h.publicationState, slugs: h.projectSlugs });
    for (const s of h.spokes) {
      out.push({ page: `/services/${h.slug}/${s.slug}`, state: s.publicationState, slugs: s.projectSlugs });
    }
  }
  for (const i of INDUSTRIES) {
    out.push({ page: `/industries/${i.slug}`, state: i.publicationState, slugs: i.projectSlugs });
  }
  return out;
}

/** Published pages citing a project that is missing or not actually built. */
export function evidenceViolations(): EvidenceViolation[] {
  const out: EvidenceViolation[] = [];
  for (const { page, state, slugs } of citedEvidence()) {
    if (!isIndexable(state)) continue; // drafts may reference in-progress work
    for (const slug of slugs) {
      const project = getProject(slug);
      if (!project) {
        out.push({ page, project: slug, reason: "cited project does not exist" });
        continue;
      }
      if (!isLive(project)) {
        const status: ProjectStatus = project.status;
        out.push({ page, project: slug, reason: `cited as evidence but status is "${status}" (not a live demo)` });
      }
    }
  }
  return out;
}

/** Does this slug resolve to a project that is actually live? */
const slugIsLive = (slug: string): boolean => {
  const p = getProject(slug);
  return p ? isLive(p) : false;
};

/** Published service hubs / industries that cite no live demonstration at all. */
export function publishedWithoutLiveEvidence(): string[] {
  const out: string[] = [];
  for (const h of SERVICE_HUBS) {
    if (isIndexable(h.publicationState) && !h.projectSlugs.some(slugIsLive)) {
      out.push(`/services/${h.slug}`);
    }
  }
  for (const i of INDUSTRIES) {
    if (isIndexable(i.publicationState) && !i.projectSlugs.some(slugIsLive)) {
      out.push(`/industries/${i.slug}`);
    }
  }
  return out;
}
