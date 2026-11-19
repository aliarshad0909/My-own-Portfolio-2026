/**
 * SCAFFOLD-ONLY preview helpers for unverified service-area pages.
 *
 * IMPORTANT: The copy generated here is a preview scaffold ONLY and is NEVER
 * sufficient to publish a service-area page. Before any combination may flip to
 * `Published`, this scaffold must be replaced with bespoke, locally
 * differentiated editorial content AND marked `editorialReview: { reviewed: true,
 * hasCustomContent: true }` alongside a genuine local signal.
 */

import type { ServiceArea } from "@/lib/seo/service-areas";
import type { ServiceHub } from "@/lib/seo/service-hubs";
import type { UsState } from "@/lib/geo/states";
import { isIndexable } from "@/lib/seo/publication";

export function serviceAreaMeta(area: ServiceArea, hub: ServiceHub, state: UsState) {
  return {
    title: `${hub.h1} in ${state.name}`,
    description: `${hub.lead} Remote delivery for ${state.name} businesses, as an independent studio.`,
    index: isIndexable(area.publicationState),
  };
}

/**
 * Preview-only scaffold paragraphs for an unverified state × service page.
 * Explicitly states that delivery is remote and that no local office exists.
 * Must be replaced with bespoke, editorially reviewed local copy prior to publication.
 */
export function serviceAreaIntro(hub: ServiceHub, state: UsState): string[] {
  const p0 = hub.problems[0] ? hub.problems[0].toLowerCase() : "a specific operational problem to solve";
  return [
    `${hub.h1} for ${state.name} businesses, delivered remotely by an independent studio. If your team in ${state.name} is dealing with "${p0}", this preview scaffold outlines how remote delivery is scoped and staged.`,
    `There is no physical studio office in ${state.name} or ${state.largestMetro}, and this page does not claim one. Before this route could ever become public or indexable, this scaffold must be replaced with editorially reviewed, locally specific content backed by a real ${state.name} engagement or service commitment.`,
  ];
}
