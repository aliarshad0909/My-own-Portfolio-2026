# SEO architecture

Scalable, evidence-gated SEO for nationwide service coverage — built so the
site can target hundreds of valuable queries **without publishing a single
doorway page**. The goal is sustainable first-page visibility for real service
queries, not a bigger count of indexed URLs.

## The core idea: a publication gate

Every page that could be mass-generated (locations, service specialisms,
industries, resources) is a **typed record** with a `publicationState`. A single
module, `lib/seo/publication.ts`, answers two questions and nothing else does:

- `shouldRender(state)` — does the route resolve on this deployment?
- `isIndexable(state)` — may search engines index it (and does it enter the sitemap)?

| State | Renders in production | Renders on previews | Indexable |
|---|---|---|---|
| `Researched` | no | no | no |
| `Drafted` | no | yes (noindex) | no |
| `NeedsEvidence` | no | yes (noindex) | no |
| `Published` | yes | yes | **yes** |
| `Retired` | no | no | no |

Production serves **only `Published`**. Drafts render on previews (always
noindex, and robots.txt disallows preview crawling) so they can be reviewed
before going live. This is why 50 states + D.C. + 12 cities can exist as
architecture while **zero** location pages are served or indexed in production
until each is earned.

Dynamic routes use `generateStaticParams` filtered by `shouldRender` plus
`dynamicParams = false`, so a gated slug returns a real 404 in production.

## The single source of truth

`lib/seo/keyword-registry.ts` holds ~78 keyword opportunities: intent, the one
canonical owner per URL, evidence required vs. evidence held, publication state
and an internal-link plan. Content modules (`service-hubs`, `resources`,
`industries`, `tools`) carry their own copy and state, and a test asserts their
state matches the registry row, so the two can never drift.

## What is published today

- **Service hubs** — one substantial, uniquely written page per core service,
  each evidenced by a real demonstration build. The opposite of a doorway page.
- **Tools** — three functional, unit-tested calculators (web project estimate,
  automation ROI, landed cost). Genuinely useful, so legitimately indexable.
- **Resources** — three cornerstone guides (paired with the calculators).
- **Industries** — ecommerce, SaaS and logistics, each backed by a real demo.
- **Studio Network** — an honest account of partner-delivered work.

Everything else (specialism spokes, most resources/industries, all locations)
is gated and invisible to production until earned.

## Guardrails against fabrication

- No location page is indexable without a real local signal (enforced in tests).
- No `Published` page without satisfied evidence (enforced in tests).
- Testimonials render only when real and consented — the list ships empty, and a
  test rejects any unconsented or placeholder entry.
- Structured data asserts only what the page shows: `Person` provider, no
  ratings, no aggregate claims, no fake addresses.

## How to publish a gated page

1. Do the real work: write unique copy, and for a location page, confirm the
   local signal (a client there, or a committed service area).
2. In the record (e.g. `lib/geo/states.ts`), set `publicationState: "Published"`
   and add the matching string to `evidenceHave`.
3. Update the matching `keyword-registry.ts` row to `Published` with evidence.
4. Run `npm run seo:audit` and `npm test`. Both must pass. The page now renders
   in production, is `index,follow`, and appears in the sitemap automatically.

## Commands

- `npm run seo:audit` — duplicate keywords, conflicting canonicals, publication
  eligibility, broken internal links, sitemap consistency, location/doorway and
  testimonial guards. Exits non-zero on any failure (CI-ready).
- `npm run seo:csv` — regenerate `docs/seo/keyword-registry.csv` from the registry.
- `npm test` — the full suite, including every invariant above.
- `npm run typecheck` / `npm run build` — types and production build.

## Canonical domain

Set `NEXT_PUBLIC_SITE_URL=https://aliarshad.co` in Vercel's Production
environment. Canonicals are relative and resolve against it; on Vercel, previews
canonicalise to production rather than competing with it.
