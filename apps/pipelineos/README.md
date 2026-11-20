# PipelineOS — CRM & Sales Management SaaS

> **Original Studio Demonstration** built by Ali Arshad Personal Studio (`https://www.aliarshad.co`).

PipelineOS is a full-stack B2B CRM and sales management platform built on permissive **MIT / Apache-2.0** open-source foundations, featuring real PostgreSQL persistence, session-cookie authentication, role-based access control, validated REST APIs, Kanban pipeline workflows, transactional lead conversion, live database analytics, and one-click Demo Reset.

## Open-Source Foundation & Attribution

- **Domain Model Inspiration:** [Marmelab Atomic CRM](https://github.com/marmelab/atomic-crm) — **MIT License** (Copyright 2024-present, Francois Zaninotto, Marmelab).
- **Stack:** Next.js 16 (MIT), React 19 (MIT), TypeScript (Apache-2.0), Tailwind CSS v4 (MIT), Drizzle ORM (Apache-2.0), `pg` (MIT), `@electric-sql/pglite` (Apache-2.0), Zod (MIT), Lucide Icons (ISC).
- See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for preserved upstream license notices.

## Controlled Demo Credentials

- **Email:** `demo@pipelineos.studio`
- **Password:** `PipelineDemo2026!`
- One-click **Open Demo Workspace** and **View Sales Pipeline** entry buttons are available on `/login`.

## Database & Local Development

PipelineOS runs against genuine PostgreSQL via **Drizzle ORM (`pg-core`)**:
- **Local Development (Zero Docker Required):** Leave `DATABASE_URL` empty to use persisted on-disk PostgreSQL (`@electric-sql/pglite` in `./data/pgdata`).
- **Production (Neon / Supabase PostgreSQL):** Set `DATABASE_URL` to your PostgreSQL connection string; migrations (`src/db/migrations/0000_init.sql`) and initial seed data bootstrap automatically on first boot.

```bash
npm install
npm run dev        # http://localhost:3010
npm run typecheck  # TypeScript check
npm run lint       # ESLint check
npm test           # Unit + PostgreSQL integration tests
npm run build      # Production build
```

## REST API Endpoints

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/health` | `GET` | Database connectivity & record counts |
| `/api/auth/login` | `POST` | Credential login or `{ "demo": true }` controlled demo session |
| `/api/auth/logout` | `POST` | Revoke session token & clear cookie |
| `/api/auth/me` | `GET` | Active authenticated user & team directory |
| `/api/dashboard` | `GET` | Live KPIs, monthly revenue, recent activities & upcoming tasks |
| `/api/contacts` | `GET`, `POST` | Search/filter contacts & create contact (+ company linking) |
| `/api/contacts/[id]` | `GET`, `PATCH`, `DELETE` | Contact details + communication history, update & delete |
| `/api/leads` | `GET`, `POST` | Search/filter leads & create lead |
| `/api/leads/[id]` | `PATCH`, `DELETE` | Update/qualify lead or delete |
| `/api/leads/[id]/convert` | `POST` | Transactional conversion into Contact + Deal + History + Follow-up |
| `/api/deals` | `GET`, `POST` | List deals & create opportunity |
| `/api/deals/[id]` | `GET`, `PATCH`, `DELETE` | Deal detail + stage audit history, update/move stage & delete |
| `/api/activities` | `GET`, `POST` | Filter & log calls, meetings, emails, follow-ups & notes |
| `/api/activities/[id]` | `PATCH`, `DELETE` | Toggle task completion or delete activity |
| `/api/analytics` | `GET` | Live SQL/DB aggregations for charts & sales team performance |
| `/api/demo/reset` | `POST` | Rate-limited transactional wipe & re-seed to initial demo dataset |

## Zero-Cost Commercial-Compatible Deployment (`crm.aliarshad.co`)

1. Provision a free PostgreSQL database on **Neon Free** (`neon.tech` — commercial use permitted, 1 GB storage, does not expire).
2. Create a **Render Free Web Service** using `apps/pipelineos/render.yaml` (`rootDir: apps/pipelineos`), setting `DATABASE_URL` to your Neon connection string and `NEXT_PUBLIC_APP_URL=https://crm.aliarshad.co`.
3. Add a `CNAME` record in GoDaddy DNS for `crm` pointing to your Render service hostname.

