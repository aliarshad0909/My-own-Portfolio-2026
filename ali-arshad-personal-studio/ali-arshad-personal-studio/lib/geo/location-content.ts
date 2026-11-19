/**
 * Content and metadata helpers for location pages.
 *
 * Location pages are scaffolds until they are earned. These helpers produce
 * honest, state/city-aware copy and metadata, but the page only renders in
 * production (and only enters the index) when its record is `Published` with a
 * local signal — see lib/geo/states.ts and lib/seo/publication.ts. The copy
 * here is a starting point a human finishes before publishing; it never
 * fabricates a local presence that does not exist.
 */

import type { UsState } from "@/lib/geo/states";
import type { PilotCity } from "@/lib/geo/cities";
import { isIndexable } from "@/lib/seo/publication";

export type LocationMeta = {
  title: string;
  description: string;
  index: boolean;
};

export function stateMeta(state: UsState): LocationMeta {
  return {
    title: `Freelance Web Developer Serving ${state.name}`,
    description: `Remote web development, AI automation and creative production for clients in ${state.name}. Independent studio, working with ${state.name} businesses wherever they are.`,
    index: isIndexable(state.publicationState),
  };
}

export function cityMeta(city: PilotCity, state: UsState): LocationMeta {
  return {
    title: `Web Developer for ${city.name}, ${state.code}`,
    description: `${city.primaryService} and wider digital studio services for ${city.name} businesses, delivered remotely by an independent studio.`,
    index: isIndexable(city.publicationState),
  };
}

/** Intro paragraphs for a state page. Deliberately honest about the remote model. */
export function stateIntro(state: UsState): string[] {
  return [
    `I work with businesses across ${state.name} the same way I work with clients anywhere: remotely, as an independent studio. There is no ${state.name} office to visit, and this page does not pretend otherwise. What it offers is a clear point of contact for ${state.name} founders and teams who want web development, AI automation or creative production handled end to end.`,
    `The largest market here is ${state.largestMetro}, but remote delivery means location inside ${state.name} rarely matters. Timezone overlap, clear written scope and staged delivery do.`,
  ];
}

export function cityIntro(city: PilotCity, state: UsState): string[] {
  return [
    `${city.name} is one of the first metros where a dedicated page makes sense, because its businesses often look specifically for ${city.primaryService.toLowerCase()}. I deliver that remotely, as an independent studio working with ${city.name} and the wider ${state.name} market.`,
    `This is an honest service page, not a local-office claim. If you are a ${city.name} business, the fastest path is a short discovery call.`,
  ];
}
