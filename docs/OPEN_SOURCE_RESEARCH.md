# Open-source research and licensing report

Research for the portfolio expansion. Every candidate was assessed before any
code was written, so no project is built on a foundation we cannot legally use,
credit and redistribute.

Researched November 2026. **Licences change.** Re-check the LICENSE file in the
repository at the commit you actually fork before shipping anything built on it.

## How candidates were judged

| Criterion | Requirement |
| --- | --- |
| Licence | MIT, Apache-2.0 or BSD preferred. Anything else needs its conditions understood and satisfiable. |
| Commercial use | Must be permitted without a fee or a negotiated agreement. |
| Modification & redistribution | Must be permitted, with attribution preserved. |
| Bundled assets | Images, fonts, logos and datasets reviewed separately — a permissive code licence does not cover them. |
| Maintenance | Active commits and releases. |
| Deployment cost | Must run on a free tier or a static host for a portfolio demo. |
| Relevance | Must demonstrate a skill Ali is actually selling. |

Two rules applied throughout:

1. A public GitHub repository is **not** automatically open source. No licence file means no permission.
2. AGPL, GPL, Creative Commons and source-available licences are **not** interchangeable with MIT/Apache/BSD and were not treated as such.

## Candidates assessed

### E-commerce (Project 01)

**Medusa** — https://github.com/medusajs/medusa
*Licence:* MIT ([LICENSE](https://github.com/medusajs/medusa/blob/develop/LICENSE)).
*What it does:* Node.js/TypeScript headless commerce engine — modular backend handling inventory, pricing, carts and orders, with a separate storefront.
*Why it fits:* The most relevant TypeScript commerce backend, and MIT permits commercial use, modification and redistribution with the copyright notice retained.
*Attribution:* Retain the MIT notice and state the project is built on Medusa.
*Security:* Large dependency tree; handling real customer or payment data would need an independent security review beyond the licence question.
*Deployment:* Needs a persistent Node server plus PostgreSQL and Redis — not a static host, and beyond a free tier for a permanently running demo.
*Decision:* **Rejected for Project 01.** Deploying Medusa and theming a storefront would demonstrate configuration rather than engineering, and the hosting footprint does not suit an always-on portfolio demo. Reconsider if a backend-heavy commerce project is wanted later.

**Saleor** — https://github.com/saleor/saleor
*Licence:* BSD-3-Clause.
*What it does:* GraphQL-first headless commerce on Python/Django, with an official Next.js storefront example published separately.
*Why it fits:* Permissive licence; the storefront example is a realistic fork target.
*Decision:* **Rejected.** Python/Django plus a GraphQL layer adds operational weight without demonstrating more skill than a self-built storefront.

**Vendure** — https://github.com/vendurehq/vendure
*Licence:* MIT core, with a separate commercial Platform tier.
*Decision:* **Rejected.** Same hosting objection as Medusa, and the split licensing needs care about which parts are MIT.

**WooCommerce** (GPL-3.0), **CoreShop** (GPL-3.0)
*Decision:* **Rejected.** Copyleft obligations are a poor fit for portfolio code that may later be reused commercially, and neither demonstrates the TypeScript skills being sold.

**Bagisto** (MIT, PHP), **Spree** / **Solidus** (BSD-3-Clause, Ruby)
*Decision:* **Rejected.** Permissively licensed, but PHP and Ruby are not in Ali's stack.

**Conclusion for Project 01: build it originally.** The commerce logic — variant pricing, stock enforcement, promotions interacting with shipping thresholds — is exactly what a client is buying, and writing it demonstrates more than configuring someone else's engine. No third-party code is used beyond React and esbuild. See `demos/commerce-storefront`.

### Automation (Project 05)

**n8n** — https://github.com/n8n-io/n8n
*Licence:* **Sustainable Use License**, plus a separate n8n Enterprise License for files with `.ee.` in the name. This is **not** an OSI open-source licence — n8n calls the model "fair-code", and the Open Source Initiative's definition does not allow restrictions on how software is used or who may commercialise it.
*What it permits:* Use and modification for internal business purposes or non-commercial/personal use, and consulting that builds workflows on a client's own instance.
*What it forbids:* Reselling n8n, hosting it for others, or embedding it where the commercial value derives substantially from n8n functionality.
*Decision:* **Accepted, with a strict boundary.** Project 05 ships **workflow JSON that Ali authored**, which is his own work and carries no n8n licence obligation. We will not host an n8n instance for visitors or clients, and we will not describe n8n as open source in portfolio copy. Screenshots of a self-hosted editor are fine. If a client later wants a hosted instance, that needs a commercial agreement with n8n (license@n8n.io).

### Voice and conversational AI (Projects 03, 04)

**LiveKit Agents** — https://github.com/livekit/agents
*Licence:* Apache-2.0 for the framework. The turn-detection models ship under a separate LiveKit Model License, so model weights must be checked separately from the code.
*Decision:* **Accepted as a candidate** for Project 04 if a self-hosted voice pipeline is wanted. Apache-2.0 also grants an explicit patent licence. Note self-hosting SIP telephony is a separate deployment.

**Pipecat** — https://github.com/pipecat-ai/pipecat
*Licence:* BSD-2-Clause.
*What it does:* Python framework chaining speech-to-text, an LLM and text-to-speech into a low-latency pipeline.
*Decision:* **Accepted as a candidate** for Project 04. Lower-level than LiveKit and needs a persistent Python process, so a browser-only demo may be simpler first.

**Vercel AI SDK** — `ai` on npm
*Licence:* Apache-2.0.
*Decision:* **Accepted** for Project 03. Provider-agnostic, deploys to a serverless function, and no vendor lock-in.

### Inventory and supply chain (Project 06)

**InvenTree** — https://github.com/inventree/InvenTree
*Licence:* MIT ([LICENSE.txt](https://github.com/inventree/InvenTree/blob/master/LICENSE)).
*What it does:* Django + TypeScript inventory management with stock control and part tracking.
*Asset caveat:* Its own credits list bundled frontend dependencies under mixed licences — Font Awesome **icons** are CC BY 4.0 while the delivery **code** is MIT. Any icons reused must be attributed under CC BY 4.0, separately from the MIT code.
*Decision:* **Reference, do not fork.** InvenTree's data model (stock movements, purchase orders, receiving) is a good reference for Project 06, but it needs Django plus a database and carries the asset caveat above. Project 06 will be built originally; InvenTree will be credited as a design reference, not as a code dependency.

### Security (Project 12)

Defensive scanning tools were reviewed but Project 12 will **not** scan third-party
infrastructure. It will check approved targets only (Ali's own domains), with any
simulated output clearly separated from real checks.

### Blockchain (Project 11)

**viem** — MIT. **wagmi** — MIT. Both accepted as dependencies for a read-only
testnet explorer. No real-money transactions, minimal wallet permissions.

## Summary — as built

Every one of the twelve projects was written from scratch. **None is an
Open-Source Adaptation**, so no project carries an `attribution` block, because
none is owed one. Several libraries that were considered during planning were
not used in the end; the final column records what was actually built against.

| Project | Type | Third-party code in the demo | Notes |
| --- | --- | --- | --- |
| 01 Tessera Clayworks (e-commerce) | Original Concept | React, esbuild | All product art drawn as SVG; no stock imagery |
| 02 Northwind (analytics) | Original Concept | React, esbuild | Charting library considered, not used — charts are hand-drawn SVG |
| 03 Tideline (support agent) | Original Concept | React, esbuild | Vercel AI SDK considered, not used — BM25 implemented directly |
| 04 Kestrel (voice agent) | Original Concept | React, esbuild | LiveKit/Pipecat considered, not used — browser Web Speech API only |
| 05 Lead qualification (n8n) | Original Concept | none bundled | Workflow JSON for n8n; n8n itself is not redistributed. See the boundary note above |
| 06 Meridian (inventory) | Original Concept | React, esbuild | InvenTree read as a reference for domain modelling; no code taken, nothing forked |
| 07 Lantern (sourcing) | Original Concept | React, esbuild | — |
| 08 Blender scene system | Original Concept | none | Python against the bpy API. Blender itself is GPL and is not redistributed here |
| 09 Motion pipeline | Original Concept | none | Invokes ffmpeg as an external binary; ffmpeg is not bundled or redistributed |
| 10 Halcyon (brand system) | Original Concept | React, esbuild | Fonts loaded from Google Fonts — see the font note below |
| 11 Ledgerlight (block explorer) | Original Concept | React, esbuild | viem/wagmi/ethers considered, **not used** — Keccak-256 and EIP-55 implemented from the specifications |
| 12 Sentryline (security) | Original Concept | React, esbuild | node-forge/pkijs considered, not used — ASN.1/DER parser written from the specification. openssl is used only to generate test fixtures, not shipped |

### Shared dependencies

| Package | Licence | Role |
| --- | --- | --- |
| React / React DOM | MIT | Runtime, bundled into every demo |
| esbuild | MIT | Build tool, not shipped |
| Playwright | Apache-2.0 | Test tool, not shipped |

React is the only third-party code that ships inside a demo bundle. MIT permits
commercial use, modification and redistribution with the notice preserved;
bundlers retain the licence header, and no React code has been modified.

### Fonts

Every font used across the demos — Space Grotesk, DM Sans, Instrument Serif,
Public Sans, JetBrains Mono, Sora, IBM Plex Mono, Inter — is served from Google
Fonts under the SIL Open Font License 1.1, which permits commercial use and
embedding. No font file is copied into any repository, and no font is modified
or redistributed under a new name.

### Non-code assets

There are no stock photographs, no icon libraries and no third-party
illustrations anywhere in the twelve demos. Every graphic is SVG written for
this portfolio. The three `placeholder-*.webp` images in the portfolio are
marked `usesSampleMedia: true` and the cards say so on their face.

### Standing rule

If a future project does build on someone else's work, it gets
`projectType: "Open-Source Adaptation"` and a complete `attribution` block in
`lib/projects.ts` — upstream project, URL, SPDX identifier, licence URL,
copyright holder, what the original does and what was changed. The project page
renders that block, and the detail view shows an editor warning if an
adaptation is ever missing one. The upstream LICENSE file is kept in the demo
directory. Upstream copyright notices are never removed and sole ownership is
never implied.
