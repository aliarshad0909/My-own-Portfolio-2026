# Lantern Sourcing — procurement demo

A China sourcing and procurement desk: requests for quotation, supplier
comparison on landed cost, a landed-cost calculator, shipment milestone
tracking and a correspondence record. Built as a portfolio demonstration by
Ali Arshad.

**Lantern Sourcing is fictional.** Suppliers, quotes, shipments and messages are
invented. Freight and duty use **indicative rates held in a table, not live
lookups** — the interface says so on every screen.

Project 07 of the portfolio expansion.

## The point of it

A sourcing decision made on unit price is usually the wrong decision. A $2.14
EXW quote and a $3.55 DDP quote are not comparable until freight, duty,
insurance, brokerage, inland delivery and one-off tooling are added and spread
across the order. This demo does that arithmetic and then ranks on the result.

### Landed cost

```
goods + tooling + freight + insurance + duty + brokerage + inland = total
total ÷ quantity = landed cost per unit
```

- **Freight** follows the mode: sea by volume (per CBM), air and express by chargeable weight, each with a minimum charge that bites on small shipments.
- **Duty** comes from the HS chapter. Change the code and the rate changes.
- **Incoterms are respected.** A CIF quote already includes freight and insurance, so those lines are zero rather than charged twice; DDP covers duty and delivery too. The build-up labels them "in CIF" / "in DDP" instead of hiding them.
- **Tooling is spread** across the order, so a cheap unit price with expensive tooling shows its true cost at low volumes.

### Quote scoring

100 points: landed cost 40, lead time 20, quality record 20, on-time record 12,
responsiveness 8. Cost and speed are scored **relative to the other quotes in
front of you** — the cheapest takes the full 40, the dearest takes none — so the
comparison is always between real alternatives rather than an arbitrary scale.
Below-MOQ quotes lose 15 points and expired quotes lose 10.

Every point is itemised on screen. In the seeded data the cheapest landed quote
is **not** the winner: it is below the minimum order quantity and comes from an
unverified supplier with a weaker quality record, and the interface explains
exactly that in a sentence above the table.

### Shipment tracking

Milestones carry a planned and an actual date, so variance is calculated rather
than asserted: the demo shipment shows production finishing three days late and
that slippage carrying through to departure.

## What actually works

- Three RFQs with specifications, target costs, HS codes and quote counts.
- Quote comparison with live recalculation when the shipping mode changes.
- Per-quote cost build-up, score breakdown and supplier risk assessment.
- A landed-cost calculator you can drive by hand — quantity, price, incoterm, tooling, HS code.
- Shipment milestones with progress, slip against plan and per-milestone variance.
- Supplier directory with a transparent risk rating and the reasons behind it.
- Correspondence thread filtered by supplier, tied to the RFQ.

## What is deliberately not here

| Area | Reality |
| --- | --- |
| Freight rates | A fixed table. Real freight is quoted per shipment by a forwarder and moves weekly. |
| Duty rates | Indicative, by HS chapter. The real rate depends on exact classification, origin and trade agreements — and classification is the importer's legal responsibility. |
| Supplier data | Invented. No directory is queried, no company is verified. |
| Tracking | Static milestones. No carrier or container API. |
| Persistence | In-memory. A reload restores the seeded state. |

**Feasibility is not assumed.** Some products cannot be exported or imported at
all, and others need licences, testing or certification. A real engagement
confirms that before anything is committed, and this demo makes no claim
otherwise.

## Running it

Requires Node.js 22.18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run typecheck
npm test           # 31 unit tests
```

```bash
npm run build && npx serve dist
npx playwright install chromium
node e2e/smoke.mjs http://localhost:3000
```

## Tests

| Suite | Count | Covers |
| --- | --- | --- |
| `tests/sourcing.test.ts` | 31 | Duty lookup and fallback; landed cost summing to its parts; duty on goods value; freight minimums; weight-based versus volume-based freight; incoterms zeroing the lines they cover; tooling spread per unit; zero quantity and negative inputs; working-day arrival estimates; quote scoring, ranking, MOQ and expiry penalties, relative cost weighting, and that every point is explained; shipment progress, slip and milestone variance; supplier risk banding. |
| `e2e/smoke.mjs` | 21 | Disclosure, request list, comparison contents, landed above unit price, MOQ flag, the explanation of why the cheapest loses, score breakdown, collapsible detail, mode switching changing costs, DDP lines showing as included, live calculator with price/incoterm/HS/zero-quantity, shipment milestones and variance, supplier risk, correspondence filtering. |
| `qa` sweep | 8 | Layout at 5 widths, skip link, touch targets, console errors. |

All pass as of the last commit. The layout sweep caught a real bug: a long
`<select>` option stretched the control past a 360px viewport.

## Technology

React 19, TypeScript, esbuild. No UI or charting dependency. Fonts (Manrope,
Spline Sans Mono) from Google Fonts under the SIL Open Font License.

## Deploying

Static output. Deploy as its own Vercel project with root directory
`demos/sourcing-platform`, then set `liveUrl` in the portfolio's `lib/projects.ts`.
