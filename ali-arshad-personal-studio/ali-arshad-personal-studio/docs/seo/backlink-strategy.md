# Backlink strategy

Legitimate links only: every entry below is a profile, community or
publication where linking the portfolio is natural and allowed. No link
farms, PBNs, bought links, comment spam or reciprocal schemes — those risk
manual penalties and say nothing true about the work.

**Nothing below is acquired yet.** `backlink-tracker.csv` is the single
source of truth for status; a link counts as acquired only when it is live
on the external site and verified by loading the page. Every submission or
account change needs Ali's approval first (several profiles in
`lib/site.ts` are still empty — create or confirm the profile before any
outreach that references it).

## Tier 1 — profiles you control (do these first)

| Target | Why relevant | What to publish | Destination URL | Method |
|---|---|---|---|---|
| GitHub profile + repo | The code behind the demonstrations is the proof | Fill the repo About website field; README section per demo linking its case study | `/` and `/case-studies/<slug>` | Repo settings + README commit |
| LinkedIn profile | Primary professional identity; Featured section renders link cards | Website in contact info; one Featured entry per flagship demo | `/` and 2–3 case studies | Profile edit |
| Behance | Creative production, 3D and brand work belong here | Project showcase per visual project (Blender renders, motion stills, Halcyon brand system) with "full case study" link | matching `/case-studies/<slug>` | Project upload |
| Credly / credential.net profile | The Skillshop credential page is public | Confirm portfolio URL on the credential profile where the issuer allows one | `/experience` | Profile edit |

## Tier 2 — communities where the work is on-topic

| Target | Why relevant | Contribution | Destination | Method |
|---|---|---|---|---|
| n8n community forum (community.n8n.io) | The lead-qualification workflow is a complete worked example | Write up the workflow design as a forum post; share the exported workflow JSON | `/case-studies/inbound-lead-qualification-workflow` | Forum post after participating genuinely |
| Next.js GitHub Discussions / r/nextjs | Storefront and dashboard are substantial Next.js builds | Answer questions where the case studies genuinely help; link only when directly relevant | relevant case study | Ongoing participation — never drive-by links |
| Blender Artists forum (blenderartists.org) | Product visualization renders are showable work | Post renders in the Finished Projects category | `/case-studies/blender-product-visualisation` | Forum post |
| dev.to / Hashnode | Original tutorials earn editorial links | Tutorial drawn from real build decisions (e.g. hand-drawn SVG charts with a table fallback; keccak-256 address checksums in the block explorer) | the related case study | Publish under own account with canonical pointing at the article |

## Tier 3 — editorial (slower, highest value)

| Target | Why relevant | Contribution | Method |
|---|---|---|---|
| Smashing Magazine / CSS-Tricks style outlets | The backdrop-filter containing-block bug fixed in this repo is a genuinely useful write-up | Pitch an article on fixed-position overlays inside filtered headers | Editorial pitch; accept their edit process |
| Newsletter mentions (React Status, Next.js Weekly) | Curators link to substantial open write-ups | Submit the strongest tutorial once published | Submission form |

## Business listings

Only where eligibility is real: a Google Business Profile requires a real
business location or service area and verification — set this up only if
Ali wants the business registered that way. Generic "SEO directories" are
skipped deliberately.

## Outreach message template

> Subject: A worked example of <topic> 
> Hi <name> — I'm Ali Arshad, an independent designer-developer. I built
> <project> as a complete demonstration (fictional brand, real engineering)
> and wrote up the decisions: <url>. Sharing in case it is useful for
> <their audience/thread>; happy to answer questions about the approach.

The demonstration framing stays in every pitch — it is what makes the
outreach honest, and reviewers respond better to it than to vague client
claims they cannot check.
