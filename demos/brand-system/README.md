# Halcyon — Brand System

A brand identity, campaign template set and landing page for **Halcyon**, an invented
sleep-and-recovery brand. Built to demonstrate design-system work: tokens, a computed
type scale, live accessibility checking and production-grade email markup.

**Halcyon does not exist.** There is no company, no product, no campaign and no
results. Every number in the interface is computed from the design system itself.

## What is real here

| Claim | Status |
| --- | --- |
| Contrast ratios | Computed in the browser from the WCAG 2.2 relative-luminance formula |
| Type scale | Generated from a base size and ratio; change either and every step regenerates |
| SVG downloads | Serialised from the live DOM — real files, not placeholders |
| Email HTML | A complete table-based document; previewed by rendering it in an iframe |
| Campaign results | **None.** The campaign section lists what would be measured and says so |

## Project type

**Original Concept** — written from scratch for this portfolio. No template, no
starter kit, no third-party design system. The fonts (Instrument Serif, Public Sans)
are loaded from Google Fonts under the SIL Open Font License.

## A decision the tooling forced

The first Clay accent was `#C96F4A`. The live checker measured it at **3.36:1** on
Paper — below the 4.5:1 required for body text. Rather than document a colour that
fails, Clay was darkened to `#A94F30` (**5.12:1**). The palette carries a note
recording the change. A test asserts every documented pairing passes, so the system
cannot drift back without the suite failing.

A second test asserts that Mist on Paper *fails*, so the first test is not passing
vacuously against an empty set.

## Running it

```bash
npm install
npm run dev     # esbuild dev server on :5173
npm run build   # static bundle in ./dist
npm test        # 29 unit tests (node --test)
```

Browser tests need the built bundle served:

```bash
npm run build && (cd dist && python3 -m http.server 8807) &
node e2e/smoke.mjs
```

## Test coverage

**Unit (29)** — hex parsing and round-tripping, contrast against the WCAG reference
values (black on white is exactly 21:1; `#767676` on white is the canonical 4.5:1
boundary), symmetry of the ratio, grading thresholds, shading, the type scale's
monotonicity and rem conversion, email structure (tables not flexbox, hidden
preheader, unsubscribe links, Outlook conditional, HTML escaping, alt attributes on
every image), and an assertion that the campaign copy contains no results language.

**Browser (21)** — every tab opens, the contrast table computes a ratio per row, the
checker grades `#000000`/`#FFFFFF`/`#CCCCCC`/`#767676` correctly and refuses
malformed input, the type scale regenerates and stays monotonic in computed styles,
downloads produce real SVG bytes with the right viewBox, the email preview renders
inside the iframe and regenerates on edit, the landing page uses the Midnight token,
nothing scrolls horizontally at 360px, and the console stays clean.

### A bug the browser suite caught

`checkContrast` throws on malformed hex. The checker called it before validating
input, so typing a non-colour unmounted the whole React tree — the page went blank
with only a `pageerror` to show for it. The test that types nonsense into the field
found it. The memo is now guarded and the test stays as a regression check.

## Structure

```
src/lib/color.ts       WCAG luminance and contrast maths
src/lib/type-scale.ts  Modular scale generation
src/lib/email.ts       Table-based HTML email + plain-text alternative
src/data/brand.ts      Palette, pairings, voice, principles, campaign
src/components/        SVG mark, lockups, social templates
src/main.tsx           The guidelines application
tests/brand.test.ts    Unit tests
e2e/smoke.mjs          Browser tests
```

## Deployment

Static output in `dist/`. `vercel.json` is present but **nothing has been deployed** —
no Vercel project has been created and no domain purchased.
