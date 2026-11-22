# InsightOS — Business Intelligence & Analytics SaaS

**InsightOS** is an interactive Business Intelligence & Analytics SaaS application built as an Original Studio Demonstration for Ali Arshad Personal Studio. Every KPI, grouped visualization, executive report, and 3-period OLS linear trend forecast is computed strictly from real records persisted in PostgreSQL.

## Visual Identity
- **Chrome:** Dark Graphite (`#111827`) sidebar & telemetry headers
- **Data Accent:** Electric Cyan (`#06b6d4` / `#0891b2`) active states & chart series
- **Workspace Canvas:** High-contrast light analytical workspace (`#f3f6f9` canvas, `#ffffff` cards)

## Core Capabilities
1. **Analytics Dashboard (`/`)** — Switch across 5 seeded fictional demonstration datasets (Sales, Marketing, Inventory, Financial Performance, Customer Behaviour) or user-uploaded CSVs; live KPI cards, interactive Area/Bar/Line Recharts visualizations, 3-period OLS linear regression forecasting with transparent equation & `R²`, top segments breakdown, and saved dashboard quick launcher.
2. **CSV Upload & Data Sources (`/datasets`)** — Upload `.csv` files or paste raw CSV text (enforced 500 KB / 2,000 rows / 40 columns limits), automatic column type inference (`number`, `date`, `string`), missing cell & malformed row validation reporting, interactive searchable data preview table, and formula-injection-neutralized CSV export.
3. **Interactive Chart Explorer & Dashboard Builder (`/explorer`)** — Choose dataset, X-axis dimension, Y-axis numeric metric, aggregation (`sum`, `avg`, `count`, `max`), chart type (`bar`, `line`, `area`), category filter, date-range filter, toggle 3-period linear forecast, export filtered CSV, and save dashboards directly to PostgreSQL.
4. **Saved Dashboards & Executive Reports (`/dashboards`)** — Re-open saved views in the Explorer, delete dashboards, generate live structured Executive Summary Reports with KPIs & top segments computed from PostgreSQL rows, and export report CSVs.

## Tech Stack
- **Frontend:** Next.js 16 (`next@^16.1.6`), React 19, TypeScript, Tailwind CSS v4, Recharts, Lucide icons
- **Backend & Persistence:** Drizzle ORM, PostgreSQL (`pg`), local persisted PGlite (`@electric-sql/pglite`) fallback, native `gen_random_uuid()` migrations
- **Validation & Security:** Zod v4, `scrypt` password hashing, HMAC-SHA256 session cookies (`HttpOnly`, `SameSite=Lax`), CSRF origin verification, HTTP security headers, CSV formula injection neutralization, sliding-window rate limiting, and 15-second demo reset cooldown.

## Demo Account
- **Email:** `analyst@insightos.studio`
- **Password:** `InsightDemo2026!`
- Also supports 1-click **Demo Analyst Sign-In** on `/login`.

## Local Development
```bash
npm install
npm run dev
# Open http://localhost:3090
```

When `INSIGHTOS_DATABASE_URL` and `DATABASE_URL` are unset locally, InsightOS automatically initializes and persists a local PGlite PostgreSQL database in `./data/pgdata`.

## Verification Commands
```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

## Production Deployment (Render)
Use `render.yaml` and configure `DATABASE_URL` (or `INSIGHTOS_DATABASE_URL`) plus a 32+ character `SESSION_SECRET`. When `RENDER=true`, InsightOS enforces external PostgreSQL connectivity with strict TLS verification.
