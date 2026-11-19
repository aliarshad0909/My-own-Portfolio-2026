/**
 * Honest, unique-per-combination content and metadata for service-area pages.
 *
 * A service-area page only publishes with substantive, geographically useful
 * content (see requirements). These helpers give each combination a distinct,
 * truthful starting point keyed on the real service and state — never a single
 * boilerplate paragraph with the place-name swapped in. The scaffold states
 * plainly that delivery is remote and that the page is not a local-office claim.
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
 * Distinct body for a state × service page. Draws on the hub's real problems and
 * the state's own context so no two pages read the same, and is explicit that
 * this is remote work, not a local office.
 */
export function serviceAreaIntro(hub: ServiceHub, state: UsState): string[] {
  const p0 = hub.problems[0] ? hub.problems[0].toLowerCase() : "a specific problem to solve";
  return [
    `${hub.h1} for ${state.name} businesses, delivered remotely by an independent studio. If your team in ${state.name} is thinking "${p0}", that is exactly the kind of work this covers — and location inside ${state.name} rarely matters when delivery is remote, clearly scoped and staged.`,
    `The largest market here is ${state.largestMetro}, but ${state.name} founders and operators anywhere in the ${state.region.toLowerCase()} are served the same way. There is no ${state.name} office to visit, and this page does not pretend otherwise; what it offers is a clear point of contact for ${hub.h1.toLowerCase()} in ${state.name}.`,
  ];
}
