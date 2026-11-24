/**
 * 51-Jurisdiction US City Expansion Research Backlog (all 50 states + Washington, D.C.).
 *
 * Governance:
 *  - Tracks every jurisdiction cleanly without generating thin doorway pages.
 *  - States with verified BLS/BEA preview city pages list their registered preview
 *    cities (`NeedsEvidence`, preview-only, noindex, excluded from production sitemap).
 *  - Remaining states stay in the transparent research backlog until direct local
 *    research and editorial review justify creating dedicated preview city pages.
 */

import { citiesInState } from "@/lib/geo/cities";
import { US_STATES } from "@/lib/geo/states";

export type StateCityPlan = {
  stateSlug: string;
  stateName: string;
  stateCode: string;
  region: string;
  registeredPreviewCities: { name: string; slug: string; primaryService: string }[];
  backlogCandidateMetros: string[];
  status: "Preview cities built (NeedsEvidence — gated)" | "Research backlog (state overview PublicNoIndex)";
};

const EXTRA_BACKLOG_METROS: Record<string, string[]> = {
  alabama: ["Birmingham", "Huntsville"],
  alaska: ["Anchorage"],
  arizona: ["Tucson"],
  arkansas: ["Little Rock", "Bentonville"],
  california: ["San Jose", "Sacramento"],
  colorado: ["Colorado Springs", "Boulder"],
  connecticut: ["Stamford", "Hartford"],
  delaware: ["Wilmington"],
  florida: ["Orlando", "Jacksonville"],
  georgia: ["Savannah"],
  hawaii: ["Honolulu"],
  idaho: ["Boise"],
  illinois: ["Naperville"],
  indiana: ["Fort Wayne"],
  iowa: ["Des Moines"],
  kansas: ["Wichita", "Overland Park"],
  kentucky: ["Louisville", "Lexington"],
  louisiana: ["New Orleans", "Baton Rouge"],
  maine: ["Portland"],
  maryland: ["Bethesda"],
  massachusetts: ["Cambridge", "Worcester"],
  michigan: ["Grand Rapids", "Ann Arbor"],
  minnesota: ["Rochester"],
  mississippi: ["Jackson"],
  missouri: ["St. Louis"],
  montana: ["Bozeman", "Billings"],
  nebraska: ["Omaha", "Lincoln"],
  nevada: ["Reno"],
  "new-hampshire": ["Manchester"],
  "new-jersey": ["Newark", "Jersey City"],
  "new-mexico": ["Albuquerque"],
  "new-york": ["Buffalo", "Rochester"],
  "north-carolina": ["Durham"],
  "north-dakota": ["Fargo"],
  ohio: ["Cincinnati", "Cleveland"],
  oklahoma: ["Oklahoma City", "Tulsa"],
  oregon: ["Eugene"],
  pennsylvania: ["Harrisburg"],
  "rhode-island": ["Providence"],
  "south-carolina": ["Charleston", "Greenville"],
  "south-dakota": ["Sioux Falls"],
  tennessee: ["Memphis", "Knoxville"],
  texas: ["San Antonio"],
  utah: ["Provo"],
  vermont: ["Burlington"],
  virginia: ["Arlington", "Virginia Beach"],
  washington: ["Bellevue", "Spokane"],
  "west-virginia": ["Charleston"],
  wisconsin: ["Madison"],
  wyoming: ["Cheyenne"],
  "washington-d-c": ["District-wide remote coverage"],
};

export function allStateCityPlans(): StateCityPlan[] {
  return US_STATES.map((st) => {
    const reg = citiesInState(st.slug).map((c) => ({
      name: c.name,
      slug: c.slug,
      primaryService: c.primaryService,
    }));
    const backlog = EXTRA_BACKLOG_METROS[st.slug] ?? [st.largestMetro];
    return {
      stateSlug: st.slug,
      stateName: st.name,
      stateCode: st.code,
      region: st.region,
      registeredPreviewCities: reg,
      backlogCandidateMetros: backlog,
      status:
        reg.length > 0
          ? "Preview cities built (NeedsEvidence — gated)"
          : "Research backlog (state overview PublicNoIndex)",
    };
  });
}
