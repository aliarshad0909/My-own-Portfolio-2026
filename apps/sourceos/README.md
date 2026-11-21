# SourceOS — Global Procurement & Sourcing Platform

**Product 06** in the Ali Arshad Personal Studio portfolio ecosystem. SourceOS is a full-stack industrial procurement workspace for supplier qualification, competitive RFQ comparison, atomic purchase order issuance, ocean/air freight tracking, trade compliance checklists, and scenario-based landed-cost modeling.

## Visual Identity
- **Industrial Navy (`#0f1d33`)** navigation & command headers
- **High-Visibility Orange (`#ea580c` / `#f97316`)** primary actions & cost/award indicators
- **Light-Industrial Operational Canvas (`#f2f4f8`)** with steel-bordered data tables and monospace RFQ/PO/tracking identifiers

## Core Modules
1. **Procurement Hub (`/`)** — Live KPIs (Active Suppliers, Open RFQs, POs & Spend, In-Transit Shipments, Avg On-Time Delivery %), supplier performance scorecard, active port-to-port shipments, and tender queue.
2. **Suppliers & Qualification (`/suppliers`)** — Filterable global vendor directory (search, country, category, status), detailed vendor capability profile, 1-click qualification workflow (`under_review` → `approved` / `probation`), and onboarding form.
3. **RFQs & Quotation Comparison (`/rfqs`)** — Issue RFQs, log supplier quotations, compare unit price, MOQ, lead time, incoterms, and freight estimates side by side, and **1-click Award Quotation → Auto-Create Purchase Order** atomically inside a PostgreSQL transaction.
4. **Purchase Orders, Freight & Trade Docs (`/orders`)** — Full PO lifecycle (`ordered` → `in_production` → `shipped` → `delivered`), shipment tracking (`booked` → `in_transit` → `customs` → `delivered`) across sea/air/express corridors, and trade compliance checklist (`commercial_invoice`, `packing_list`, `bill_of_lading`, `certificate_of_origin`, `qc_report`).
5. **Landed-Cost Calculator (`/landed-cost`)** — Real-time itemized calculation engine (`FOB`, `CIF`, `Customs Duty %`, `Other Expenses`, multi-currency FX conversion, total & per-unit landed USD + source currency) with PostgreSQL scenario persistence and an explicit planning-assumptions notice distinguishing user-entered figures from verified customs broker tariffs.

## Tech Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS v4**
- **PostgreSQL** via `drizzle-orm` + `pg` (`SOURCEOS_DATABASE_URL || DATABASE_URL`) with strict TLS & `RENDER=true` guard, plus zero-config embedded persisted **PGlite** for local development and isolated tests
- **Zod v4** request validation, **scrypt** password hashing, HMAC-SHA256 session cookies, CSRF origin validation, rate limiting, and HTTP security headers

## Demo Credentials
- **Email:** `buyer@sourceos.studio`
- **Password:** `SourceDemo2026!`
- One-click **Enter SourceOS Demo** button available on `/login`.

## Local Development & Verification
```bash
npm install
npm run dev          # Starts on http://localhost:3050
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint 9 flat config (Next 16 core-web-vitals + typescript)
npm test             # Unit + real PostgreSQL (PGlite) integration tests
npm run build        # Production Next.js build
```

## Deployment (Render)
Configured via `render.yaml` (`rootDir: apps/sourceos`, `healthCheckPath: /api/health`). Set `SOURCEOS_DATABASE_URL` and a 32+ character `SESSION_SECRET` in Render environment variables.
