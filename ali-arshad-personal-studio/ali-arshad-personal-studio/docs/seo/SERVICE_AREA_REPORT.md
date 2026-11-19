# Nationwide service-area SEO report

Snapshot of the whole SEO surface, sorted into the five categories the brief
asks for. Regenerate any time with `npm run seo:report` (and validate with
`npm run seo:audit`). Counts below are the state as of this branch.

## Totals

| Category | Count |
|---|---|
| Total page-bearing records | 539 |
| Planned URLs (Researched — URL + intent, no page) | 414 |
| Draft pages (Drafted / NeedsEvidence — preview-only, noindex) | 73 |
| **Published & indexable** | **52** |
| Pages missing evidence | 0 |
| Pages blocked by duplicate intent | 0 blocking (6 advisory) |

The full 51-jurisdiction × 6-core-service matrix is **306** entries
(`coreServiceAreaMatrix`); with Creative Production and Brand & Growth added for
the two visual pillars the matrix is 408 (`serviceAreaMatrix`), plus 7 selected
city × service combinations.

## 1. Planned URLs (414)

Structured data only: each has a canonical URL, a unique keyword intent and a
publication state, but renders **no page** in any environment. Breakdown:

- Service-area (state × service) combinations: 400
- City × service combinations: 7
- Industry pages awaiting unique copy / a real client: 7

These exist so coverage scales without publishing doorway pages. None are
indexable; none appear in the sitemap.

## 2. Draft pages (73)

`Drafted` or `NeedsEvidence`: render on Vercel **previews only**, always
`noindex`, and 404 in production. They exist to be reviewed before going live.

- 50 states + D.C. location pages (gated until a real local signal)
- 12 pilot-city location pages
- 8 state × service scaffolds (highest-intent metros' states)
- 1–2 specialization spokes still being written

## 3. Published & indexable pages (52)

Live, `index,follow`, in the sitemap. All carry substantiated evidence:

- 8 service hubs
- ~20 specialization spokes (across all pillars)
- 3 functional calculators (`/tools/*`)
- 16 resource guides
- 3 industry pages (ecommerce, SaaS, logistics — each backed by a real demo)

No state, city or service-area page is published (none has a verified local
signal yet) — exactly the anti-doorway stance the brief requires.

## 4. Pages missing evidence (0)

- Registry rows Published without satisfied evidence: **0**
- Published pages citing a non-live or mismatched build: **0**

Every published page's evidence is satisfied. This is enforced, not asserted:
`lib/seo/evidence.ts` refuses to let a page claim a demonstration it does not
have, and the audit fails if one does.

## 5. Pages blocked by duplicate intent (0 blocking)

- **Blocking conflicts (two or more publishable owners of one intent): 0**
- Advisory overlaps (flagged; at most one is publishable, so not blocking): 6

The six advisory overlaps are the general location page and the web-development
service-area page for the same state (e.g. `/locations/texas` vs
`/services/web-development/in/texas`). Both are currently gated, so there is no
live collision. The guard (`blockingIntentConflicts`, enforced by a test)
prevents both from ever being published at once: one must own the intent.

## How to reproduce

```
npm run seo:report   # this report
npm run seo:audit    # all safeguards, exits non-zero on any failure
npm test             # full suite incl. SEO invariants
npm run seo:csv      # regenerate docs/seo/keyword-registry.csv
```
