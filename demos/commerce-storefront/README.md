# Tessera Clayworks — demonstration storefront

A working e-commerce storefront built as a portfolio demonstration by Ali Arshad.

**Tessera Clayworks is a fictional brand.** No real orders are placed, no payment
details are collected and nothing is charged. Every product, price and stock
figure is sample data. The demo says so in a banner on every page and again at
the payment step.

Project 01 of the portfolio expansion. Case study: `/case-studies/tessera-clayworks-storefront`.

## What actually works

- **Catalogue** — 16 products, 6 categories, 6 glazes, per-variant stock.
- **Filtering** — category, glaze, maximum price, in-stock-only and free-text search, all combinable, plus five sort orders.
- **Product pages** — glaze and size variants that change the price, the illustration and the availability; per-variant stock messaging.
- **Cart** — quantity steppers clamped to stock on hand, promotion codes (`DEMO10`, `FREESHIP`), a free-shipping threshold and a flat tax estimate.
- **Checkout** — delivery details with field-level validation, two shipping methods, and stock re-checked at the moment the order is placed.
- **Orders** — order numbers, a confirmation page and order history. Placing an order decrements the stock the shop and admin both read.
- **Admin** — create, edit and delete products with validation, confirm-before-delete, per-variant stock editing and a live preview. Changes appear in the storefront immediately.
- **Wishlist** — save and remove products, with a header count.

State persists in `localStorage` for the current browser and nothing leaves the
device. "Reset demo data" in the admin restores the seeded catalogue.

## What is deliberately simulated

| Area | Reality |
| --- | --- |
| Payment | No card fields exist. Placing an order creates a local record and reduces local stock. |
| Email | No confirmation is sent. The order page says so. |
| Tax | A flat 8% estimate, labelled as a demo rate. Not a real tax engine. |
| Shipping | Two fixed rates. No carrier integration. |
| Admin auth | There is no sign-in. Anyone viewing the demo can open the admin. |
| Persistence | `localStorage` only — no server, no database, no analytics, no tracking. |

Making any of this real means adding a backend: the commerce rules in `src/lib/`
are deliberately free of React and browser APIs so they can move to a server
unchanged.

## Product illustrations

Every product image is drawn in code as SVG (`src/components/ProductArt.tsx`).
Eight parametric shapes are tinted at runtime by the selected glaze, with a
deterministic speckle pattern per product. There is no stock photography, so
there are no image licences to clear and no third-party assets in the build.

## Running it

Requires Node.js 22.18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static files in dist/
npm run typecheck
npm test           # 18 unit tests
```

End-to-end tests need Playwright and a served build:

```bash
npm run build
npx serve dist                      # or any static server
npx playwright install chromium
node e2e/smoke.mjs http://localhost:3000
```

## Tests

| Suite | Count | Covers |
| --- | --- | --- |
| `tests/logic.test.ts` | 18 | Money formatting and parsing, catalogue filtering and sorting, variant pricing, cart stock caps, promotion and shipping interaction, tax, order placement and stock decrement, address and admin validation, path matching. |
| `e2e/smoke.mjs` | 38 | Layout at 5 widths, catalogue and filters, variant switching, cart and promotions, persistence, checkout validation and totals, order placement and stock decrement, admin CRUD, keyboard access, runtime errors. |

Both suites pass as of the last commit. Two real defects were found and fixed
through them: visually-hidden labels inside the admin table escaped their scroll
container and widened the page on mobile, and the glaze swatches rendered blank
because an `!important` rule overrode their inline colour. Both now have tests.

## Architecture

```
src/
  lib/          Commerce rules — no React imports, directly unit tested
    types.ts      Domain model
    money.ts      Integer-cent formatting and parsing
    catalog.ts    Filtering, sorting, variant pricing, stock
    cart.ts       Add/update/remove, promotions, shipping, tax, totals
    checkout.ts   Address validation, order creation, stock decrement
    admin.ts      Product draft validation
    store.ts      Subscribable app state (useSyncExternalStore)
    router.ts     Hash router; paths.ts holds the pure matcher
    storage.ts    localStorage with a memory fallback
  components/   ProductArt (SVG), Layout, shared UI
  pages/        Home, Shop, ProductPage, Cart, Checkout, Admin
  styles.css    One stylesheet, custom properties at the top
```

Why plain React and esbuild rather than Next.js: this demo has no server, so a
static bundle is the honest shape for it. The whole build is 240 KB of JavaScript
and 14 KB of CSS with no UI framework, icon library or image dependencies.

## Dependencies

| Package | Licence | Why |
| --- | --- | --- |
| react, react-dom | MIT | UI |
| esbuild | MIT | Bundler |
| typescript | Apache-2.0 | Types |
| @types/react, @types/react-dom | MIT | Types |

Fonts (Fraunces, Inter) load from Google Fonts and are licensed under the SIL
Open Font License. No other third-party code or assets are included.

## Deploying

The build output is static, so any static host works. A `vercel.json` is
included:

```json
{ "buildCommand": "npm run build", "outputDirectory": "dist", "framework": null }
```

Deploy this directory as its **own** Vercel project, separate from the main
portfolio — do not merge it into the portfolio's Next.js app. Once deployed,
put the URL in `liveUrl` on the project record in
`ali-arshad-personal-studio/ali-arshad-personal-studio/lib/projects.ts` and the
"View live demo" button appears on the project and case-study pages.

## Before showing this to clients

- [ ] Deploy and confirm the live URL works, then set `liveUrl`.
- [ ] Read the demo banner wording once more — it is the thing that keeps this honest.
- [ ] If the admin should not be publicly editable, either remove the `/admin` route from the build or put the deployment behind Vercel password protection.
