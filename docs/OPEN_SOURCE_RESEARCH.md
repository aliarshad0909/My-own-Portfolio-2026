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

## Summary

| Project | Approach | Foundation | Licence | Decision |
| --- | --- | --- | --- | --- |
| 01 E-commerce | Original | React + esbuild only | — | **Built** |
| 02 Analytics | Original | TBD charting library | — | Planned |
| 03 AI support | Original | Vercel AI SDK | Apache-2.0 | Accept |
| 04 Voice agent | Original | LiveKit Agents or Pipecat | Apache-2.0 / BSD-2 | Accept |
| 05 n8n automation | Original workflows | n8n (not bundled) | SUL — see boundary above | Accept with limits |
| 06 Supply chain | Original | InvenTree as reference only | MIT (not forked) | Reference |
| 07 Sourcing | Original | — | — | Planned |
| 08 3D | Original creative | Ali's Blender work | — | Awaiting assets |
| 09 Motion | Original creative | Ali's footage | — | Awaiting assets |
| 10 Brand | Original | — | — | Planned |
| 11 Blockchain | Original | viem / wagmi | MIT | Accept |
| 12 Security | Original | — | — | Planned |

No project currently in the repository contains third-party source code beyond
its declared npm dependencies. If that changes, the adaptation gets an
`attribution` block in `lib/projects.ts`, which the project page renders
automatically, and the upstream LICENSE file is kept in the demo directory.
