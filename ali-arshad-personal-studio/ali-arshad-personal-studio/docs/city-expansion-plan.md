# US State → City Coverage Expansion Plan & Editorial Governance

## Purpose

This document tracks the studio's structured expansion of remote US state and city coverage under `/locations`, `/locations/[state]`, and `/locations/[state]/[city]`, while enforcing strict anti-doorway SEO hygiene and honesty rules.

## Governance Rules (Enforced by Automated Tests & Production Routing)

1. **No physical branch office claims:** Ali Arshad — Personal Studio is a 100% remote studio of one. Location pages never imply local offices, local phone numbers, or W-2 branch headcount.
2. **State pages (`51` jurisdictions — 50 states + Washington, D.C.):** Served publicly under `/locations/[state]` as `PublicNoIndex` (`noindex, follow`, excluded from `sitemap.xml`).
3. **City pages (`32` verified preview metros across 24 states + Washington, D.C.):** Registered in `lib/geo/cities.ts` with unique, non-templated local economic context in `lib/geo/city-local-content.ts` + `lib/geo/city-local-content-extra.ts`.
   - Every city cites at least **2 live-verified HTTP 200 primary government URLs** (exact Bureau of Labor Statistics *Economy at a Glance* MSA page + BEA County/Metro GDP dataset).
   - Every city starts strictly in **`NeedsEvidence`** (renders in preview/development environments with `noindex`; returns **HTTP 404** in production and stays excluded from `sitemap.xml` until verified local engagement evidence and human editorial sign-off exist).
4. **51-Jurisdiction Research Backlog (`lib/geo/city-backlog.ts`):** Every remaining US state has explicit candidate metro targets tracked in code so coverage expands methodically rather than through thin templated clones.
5. **Fictional Demo Customer Profiles (`lib/geo/fictional-profiles.ts`):** Three clearly labeled fictional demo profiles (`Alder & Loom Home Goods`, `Beaconfield Mechanical Supply`, `Northstar Cloud Ops`) illustrate multi-store retail, regional B2B distribution, and 100% remote SaaS scenarios with synthetic illustrative SVG map pins — never presented as real clients, real street addresses, or testimonials.

## Registered Preview Cities (`32` Total — All `NeedsEvidence`)

| State | Registered Preview Cities | Primary Verified Sources |
|---|---|---|
| Arizona | Phoenix | BLS Phoenix MSA + BEA Metro GDP |
| California | San Francisco, Los Angeles, San Diego | BLS MSA pages + BEA Metro GDP |
| Colorado | Denver | BLS Denver MSA + BEA Metro GDP |
| Florida | Miami, Tampa | BLS MSA pages + BEA Metro GDP |
| Georgia | Atlanta | BLS Atlanta MSA + BEA Metro GDP |
| Illinois | Chicago | BLS Chicago MSA + BEA Metro GDP |
| Indiana | Indianapolis | BLS Indianapolis MSA + BEA Metro GDP |
| Maryland | Baltimore | BLS Baltimore MSA + BEA Metro GDP |
| Massachusetts | Boston | BLS Boston NECTA + BEA Metro GDP |
| Michigan | Detroit | BLS Detroit MSA + BEA Metro GDP |
| Minnesota | Minneapolis | BLS Minneapolis MSA + BEA Metro GDP |
| Missouri | Kansas City | BLS Kansas City MSA + BEA Metro GDP |
| Nevada | Las Vegas | BLS Las Vegas MSA + BEA Metro GDP |
| New York | New York City | BLS New York MSA + BEA Metro GDP |
| North Carolina | Charlotte, Raleigh | BLS MSA pages + BEA Metro GDP |
| Ohio | Columbus | BLS Columbus MSA + BEA Metro GDP |
| Oregon | Portland | BLS Portland MSA + BEA Metro GDP |
| Pennsylvania | Philadelphia, Pittsburgh | BLS MSA pages + BEA Metro GDP |
| Tennessee | Nashville | BLS Nashville MSA + BEA Metro GDP |
| Texas | Austin, Dallas, Houston | BLS MSA pages + BEA Metro GDP |
| Utah | Salt Lake City | BLS Salt Lake City MSA + BEA Metro GDP |
| Virginia | Richmond | BLS Richmond MSA + BEA Metro GDP |
| Washington | Seattle | BLS Seattle MSA + BEA Metro GDP |
| Wisconsin | Milwaukee | BLS Milwaukee MSA + BEA Metro GDP |
| Washington, D.C. | Washington | BLS Washington MSA + BEA Metro GDP |

## Remaining 26 States in Research Backlog (`lib/geo/city-backlog.ts`)

Alabama (Birmingham, Huntsville), Alaska (Anchorage), Arkansas (Little Rock, Bentonville), Connecticut (Stamford, Hartford), Delaware (Wilmington), Hawaii (Honolulu), Idaho (Boise), Iowa (Des Moines), Kansas (Wichita, Overland Park), Kentucky (Louisville, Lexington), Louisiana (New Orleans, Baton Rouge), Maine (Portland), Mississippi (Jackson), Montana (Bozeman, Billings), Nebraska (Omaha, Lincoln), New Hampshire (Manchester), New Jersey (Newark, Jersey City), New Mexico (Albuquerque), North Dakota (Fargo), Oklahoma (Oklahoma City, Tulsa), Rhode Island (Providence), South Carolina (Charleston, Greenville), South Dakota (Sioux Falls), Vermont (Burlington), West Virginia (Charleston), Wyoming (Cheyenne).

## Promotion Checklist Before Flipping Any City to `Published`

1. At least one verified local signal (real client engagement with permission or documented local case study).
2. Human editorial review recorded in `EDITORIAL_REVIEWS` (`lib/seo/evidence.ts`).
3. Fresh source access check confirming all cited BLS/BEA/state URLs remain HTTP 200 and accurate.
