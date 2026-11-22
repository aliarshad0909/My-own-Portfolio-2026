# Video Production Plan — Ali Arshad Personal Studio

This plan defines three short, focused videos designed to convert prospective US business clients while keeping pages fast, accessible, and strictly truthful.

> **Production Status:** No synthetic/stock videos have been fabricated or falsely embedded as recordings. This document provides production-ready scripts, shot lists, poster frames, and WebVTT caption tracks (`public/videos/captions/*.vtt`) ready for real screen capture + voiceover recording (or Remotion compositing of real captures).

---

## Shared Accessibility & Performance Standards

- **No sound-on autoplay:** Never autoplay with audio. Walkthrough videos use native `<video controls preload="metadata" poster="...">` with explicit play interaction.
- **Captions & transcripts:** Every video ships with a synchronized `.vtt` caption track (`<track kind="captions" srcLang="en" default />`) and a collapsible full text transcript directly underneath.
- **Reduced motion:** Respect `@media (prefers-reduced-motion: reduce)` — show static poster + chapter storyboard cards by default when reduced motion is preferred.
- **Format & bitrate targets:** H.264 `.mp4` (1920×1080 or 1440×900, 30fps, CRF 24–26, `< 4 MB` per 60s walkthrough) + optional `.webm` VP9 fallback.
- **Honesty rule:** Show only real verified application screens and genuine studio work — never mix stock footage or AI-generated mockups into product walkthroughs.

---

## Video 1 — Studio Introduction & Core Services Overview (45 seconds)

- **Placement:** Optional intro section on `/about` or below-the-fold on `/services` (keep homepage hero crisp and fast with `portrait-hero.webp`).
- **Poster Image:** `/images/portraits/portrait-hero.webp` (or 16:9 crop for widescreen player).
- **Caption File:** `/videos/captions/studio-intro.vtt`

### Shot List
| Time | Visual / Shot | On-Screen Text / Cue |
| --- | --- | --- |
| 0:00–0:08 | Ali speaking to camera (clean dark backdrop, natural lighting) | `Ali Arshad — Personal Studio` |
| 0:08–0:18 | Real screen capture of `https://crm.aliarshad.co` Kanban pipeline + `https://stock.aliarshad.co` dashboard | `Custom Web Apps & SaaS` |
| 0:18–0:28 | Real screen capture of `public/videos/n8n-workflow.mp4` + `public/videos/ai-agent-flow.mp4` | `AI Agents & n8n Automation` |
| 0:28–0:37 | Quick montage of real case-study visuals (brand system, motion pipeline, storefront) | `Creative & Brand Execution` |
| 0:37–0:45 | Ali to camera + clean end card showing `www.aliarshad.co/contact` | `Start a Project · www.aliarshad.co` |

### Voiceover Script (~110 words)
> "Hi, I'm Ali Arshad. I run an independent creative and technical studio working remotely with US and international businesses.
>
> Most teams end up splitting a project across three separate vendors — one for design, one for web development, and another for automation. Things break in the hand-off.
>
> I handle custom Next.js web applications, practical AI and n8n workflow automation, and brand or video production under one roof. And before we ever talk scope, you can test two of my live full-stack applications — PipelineOS CRM and StockFlow Inventory — directly on my website.
>
> If you have a project in mind, send a short note at aliarshad.co/contact and I'll reply directly with honest thoughts on scope and next steps."

---

## Video 2 — PipelineOS CRM Live Product Walkthrough (60 seconds)

- **Placement:** `/case-studies/pipelineos-crm` (above or beside the gallery).
- **Poster Image:** `/images/projects/pipelineos/dashboard.png` (1440×900, verified capture).
- **Caption File:** `/videos/captions/pipelineos-walkthrough.vtt`
- **Live URL Captured:** `https://crm.aliarshad.co` (sandbox account `demo@pipelineos.studio`).

### Shot List (All Real Application Screens)
| Time | Verified Screen / Action | Narration Focus |
| --- | --- | --- |
| 0:00–0:08 | `login.png` → Click **Demo Workspace Login** → `dashboard.png` loads live PostgreSQL KPIs | One-click sandbox login; real database metrics |
| 0:08–0:20 | `contacts.png` → Open contact detail drawer, add a communication note | Persistent contacts & timeline history |
| 0:20–0:34 | `leads.png` → Click **Convert to Deal** on a qualified lead | Atomic Lead → Contact + Deal database transaction |
| 0:34–0:46 | `pipeline.png` → Move a deal card across the 6-stage Kanban pipeline | Stage totals & immutable stage-move audit history |
| 0:46–0:54 | `analytics.png` → Live revenue & funnel conversion charts update | Real-time analytics computed from PostgreSQL |
| 0:54–1:00 | Click **Reset Demo Data** + end card `crm.aliarshad.co` | Safe public sandbox reset anytime |

### Voiceover Script (~145 words)
> "This is PipelineOS — a live full-stack CRM demonstration you can test right now at crm.aliarshad.co.
>
> Everything you see runs on Next.js, TypeScript, and PostgreSQL with realistic fictional B2B data. Start with one click on the sandbox demo login.
>
> On the executive dashboard, open pipeline value, weighted forecast, won revenue, and overdue tasks are calculated directly from the database.
>
> In Contacts, you can create records and log calls, emails, or meeting notes to a persistent timeline.
>
> In Leads, clicking Convert runs a single database transaction that creates the contact, opens a pipeline deal, and records the opening stage history.
>
> On the six-stage Kanban board, moving deals updates stage totals and immediately refreshes the live revenue analytics view.
>
> Try it yourself at crm.aliarshad.co — and use Reset Demo Data whenever you want a fresh workspace."

---

## Video 3 — StockFlow Inventory + Mobile Companion Walkthrough (60 seconds)

- **Placement:** `/case-studies/stockflow-inventory` (above the gallery / mobile preview section).
- **Poster Image:** `/images/projects/stockflow/dashboard.png` (1440×900, verified capture).
- **Caption File:** `/videos/captions/stockflow-walkthrough.vtt`
- **Live URLs Captured:** `https://stock.aliarshad.co` + `https://stockflow-mobile-web.onrender.com` (sandbox account `ops@stockflow.studio`).

### Shot List (All Real Application Screens)
| Time | Verified Screen / Action | Narration Focus |
| --- | --- | --- |
| 0:00–0:09 | `dashboard.png` at `https://stock.aliarshad.co` | Multi-warehouse valuation, low-stock alerts & live movement ledger |
| 0:09–0:19 | `products.png` → Search SKU / EAN-13 barcode, view per-warehouse bins | Unique SKUs, EAN-13 barcodes & available vs. reserved units |
| 0:19–0:30 | `warehouses.png` → Execute atomic transfer between Austin & Chicago hubs | Atomic transfer preventing negative inventory balances |
| 0:30–0:40 | `orders.png` → Receive a Purchase Order / Reserve & Fulfill a Sales Order | End-to-end PO receiving & SO fulfillment lifecycle |
| 0:40–0:53 | Side-by-side `https://stockflow-mobile-web.onrender.com` (`mobile-dashboard.png`, `mobile-scanner.png`, `mobile-adjust.png`) → Look up `8901234500101` & submit mobile stock adjustment | Shared `/api/v1` API syncing mobile updates live to desktop |
| 0:53–1:00 | `movements.png` showing new `MOBILE` badge entry + end card `stock.aliarshad.co` | Immutable audit trail; clarify camera scanning requires native device build |

### Voiceover Script (~150 words)
> "This is StockFlow — a live multi-warehouse inventory platform at stock.aliarshad.co paired with an interactive mobile web preview.
>
> On the desktop operations console, you see real-time stock valuation, low-stock alerts, and warehouse balances across Austin, Chicago, and Newark hubs.
>
> Every product tracks unique SKUs, EAN-13 barcodes, and per-bin on-hand versus reserved quantities.
>
> Warehouse transfers and stock adjustments run inside atomic PostgreSQL transactions so negative inventory can never occur. You can also receive purchase orders into a warehouse and reserve, fulfill, and ship customer sales orders.
>
> Now switch to the mobile preview at stockflow-mobile-web.onrender.com. Using the same backend API, look up a seeded EAN-13 barcode, record a stock receipt, and watch the updated balance and mobile-tagged audit entry appear immediately on the desktop web console. Note that live camera scanning requires the native React Native build on a physical phone.
>
> Test both live today at stock.aliarshad.co."
