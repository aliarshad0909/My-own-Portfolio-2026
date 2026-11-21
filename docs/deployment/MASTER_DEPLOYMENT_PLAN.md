# Master Deployment Plan — 12-Product SaaS & AI Ecosystem

**Portfolio Domain:** `https://www.aliarshad.co` (Vercel — existing deployment)  
**Repository:** `https://github.com/aliarshad0909/My-own-Portfolio-2026`  
**Deployment Guardrail:** **NO new production apps have been deployed, NO paid subscriptions have been created, and NO GoDaddy DNS records have been altered.** This document defines the complete deployment-ready architecture for consolidated launch upon owner approval.

---

## 1. Complete Product, Subdomain, Port & Database Mapping

Every SaaS product runs as an independent Node.js web service with its own isolated PostgreSQL database (never sharing one database across products, except StockFlow Web + StockFlow Mobile which intentionally share the StockFlow `/api/v1` API & PostgreSQL ledger).

| # | Product | App Path | Local Port | Target Subdomain | Hosting Provider | Database (Isolated) | Required DB Env Var | Health Endpoint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | **PipelineOS** | `apps/pipelineos` | `3010` | `crm.aliarshad.co` | Render Web | Neon PG (`pipelineos`) | `DATABASE_URL` / `PIPELINEOS_DATABASE_URL` | `/api/health` |
| 02 | **StockFlow** | `apps/stockflow` | `3020` | `stock.aliarshad.co` | Render Web | Neon PG (`stockflow`) | `STOCKFLOW_DATABASE_URL` | `/api/v1/health` |
| 03 | **StockFlow Mobile** | `apps/stockflow-mobile` | `8081` / Web | EAS APK + optional `stock-mobile.aliarshad.co` | Expo EAS + Render Static | Shared via `stock.aliarshad.co/api/v1` | `EXPO_PUBLIC_API_URL` | N/A (client) |
| 04 | **FinanceOS** | `apps/financeos` | `3030` | `finance.aliarshad.co` | Render Web | Neon PG (`financeos`) | `FINANCEOS_DATABASE_URL` | `/api/health` |
| 05 | **FlowOS** | `apps/flowos` | `3040` | `flow.aliarshad.co` | Render Web | Neon PG (`flowos`) | `FLOWOS_DATABASE_URL` | `/api/health` |
| 06 | **SourceOS** | `apps/sourceos` | `3050` | `source.aliarshad.co` | Render Web | Neon PG (`sourceos`) | `SOURCEOS_DATABASE_URL` | `/api/health` |
| 07 | **Orexa (Demo)** | `apps/orexa` | `3060` | `orexa.aliarshad.co` | Render Web | Neon PG (`orexa`) | `OREXA_DATABASE_URL` | `/api/health` |
| 08 | **SupportOS** | `apps/supportos` | `3070` | `support.aliarshad.co` | Render Web | Neon PG (`supportos`) | `SUPPORTOS_DATABASE_URL` | `/api/health` |
| 09 | **ProjectOS** | `apps/projectos` | `3080` | `projects.aliarshad.co` | Render Web | Neon PG (`projectos`) | `PROJECTOS_DATABASE_URL` | `/api/health` |
| 10 | **InsightOS** | `apps/insightos` | `3090` | `insight.aliarshad.co` | Render Web | Neon PG (`insightos`) | `INSIGHTOS_DATABASE_URL` | `/api/health` |
| 11 | **PeopleOS** | `apps/peopleos` | `3100` | `people.aliarshad.co` | Render Web | Neon PG (`peopleos`) | `PEOPLEOS_DATABASE_URL` | `/api/health` |
| 12 | **BookOS** | `apps/bookos` | `3110` | `book.aliarshad.co` | Render Web | Neon PG (`bookos`) | `BOOKOS_DATABASE_URL` | `/api/health` |

---

## 2. Standard Environment Variables Per Web Service

Every Next.js 16 SaaS service requires:
- `NODE_ENV=production`
- `<PRODUCT>_DATABASE_URL` (or `DATABASE_URL`) — Neon pooled connection string with `?sslmode=require`
- `SESSION_SECRET` — **Mandatory >= 32 random bytes** (`openssl rand -hex 32` or Render `generateValue: true`); all apps throw if missing/short in production
- `NEXT_PUBLIC_APP_URL` — Canonical HTTPS URL (e.g., `https://finance.aliarshad.co`)
- `ALLOW_DEMO_RESET=true` — Kill switch (`false` disables public reset without redeploying code)
- Optional (StockFlow): `CORS_ALLOWED_ORIGINS=*` (Bearer-only mobile API)
- Optional (FlowOS / Orexa): Server-side LLM keys are **never required** — deterministic mode runs at \$0 API cost.

### Portfolio Environment Variables (Vercel — `www.aliarshad.co`)
Set each variable **only after** the corresponding subdomain is live and verified over HTTPS:
```bash
NEXT_PUBLIC_PIPELINEOS_URL=https://crm.aliarshad.co
NEXT_PUBLIC_STOCKFLOW_URL=https://stock.aliarshad.co
NEXT_PUBLIC_STOCKFLOW_MOBILE_WEB_URL=https://<stockflow-mobile-static>.onrender.com
NEXT_PUBLIC_STOCKFLOW_APK_URL=https://expo.dev/artifacts/eas/<apk-id>.apk
NEXT_PUBLIC_FINANCEOS_URL=https://finance.aliarshad.co
NEXT_PUBLIC_FLOWOS_URL=https://flow.aliarshad.co
NEXT_PUBLIC_SOURCEOS_URL=https://source.aliarshad.co
NEXT_PUBLIC_OREXA_URL=https://orexa.aliarshad.co
NEXT_PUBLIC_SUPPORTOS_URL=https://support.aliarshad.co
NEXT_PUBLIC_PROJECTOS_URL=https://projects.aliarshad.co
NEXT_PUBLIC_INSIGHTOS_URL=https://insight.aliarshad.co
NEXT_PUBLIC_PEOPLEOS_URL=https://people.aliarshad.co
NEXT_PUBLIC_BOOKOS_URL=https://book.aliarshad.co
```
Until an app's env var is set, its portfolio card and detail page show its honest status (`Demo Ready · Locally Tested`) and link cleanly to `#demo-access` with zero broken external links.

---

## 3. Free-Tier Restrictions & Monthly Operating Cost Analysis

### Option A — \$0/Month Commercial-Compatible Tier (Recommended for Showcase Phase)
- **Render Free Web Services (up to 11 apps):** \$0/mo, 512 MB RAM per service, commercial use permitted. **Limitation:** Free services spin down after 15 minutes of inactivity (~30–50s cold start on first visit) and share a 750 free instance-hour/month workspace quota across active services. Because portfolio demo traffic is bursty, 2–3 flagship apps stay well within 750 hours; running all 11 concurrently under heavy traffic may exhaust the shared 750-hour free quota mid-month.
- **Neon Free PostgreSQL:** \$0/mo, commercial use permitted, 100 CU-hours/month compute, 0.5 GB storage per project (free tier allows up to 10–20 databases across projects; databases can be isolated per app inside 1–2 Neon projects as separate PostgreSQL `DATABASE`s with separate least-privilege roles!). **Does not expire after 30 days** (unlike Render Free Postgres).
- **Render Static Site (`stockflow-mobile-web`):** \$0/mo, always-on, zero cold start.
- **Expo EAS Free:** \$0/mo, 30 cloud Android APK builds/month.
- **Estimated Cost:** **\$0/month** (with cold starts & 750h/mo Render free-tier sharing caveat).

### Option B — Always-On Low-Cost Production Tier (Zero Cold Starts)
- **Single Self-Managed VPS (e.g., Hetzner CX32 / 8 GB RAM / 4 vCPU + Coolify or Docker Compose + Caddy Auto-TLS):** ~**\$8–\$12/month** total to host ALL 11 Next.js apps + isolated PostgreSQL databases simultaneously with **zero cold starts** and **no 750-hour ceiling**.
- **Or Render Starter (\$7/service/mo × 11 = \$77/mo)** — higher cost; only recommended if deploying 2–3 priority flagships on Starter (\$14–\$21/mo) and leaving the rest on Free or VPS.

---

## 4. GoDaddy DNS Cutover Checklist (Owner Approval Required)

Preserve existing records untouched:
- `@` (`A`) → `216.198.79.1`
- `www` (`CNAME`) → `f46a51bc3d6609b9.vercel-dns-017.com`

Add `CNAME` records only for subdomains actively provisioned in Render/VPS:
`crm`, `stock`, `finance`, `flow`, `source`, `orexa`, `support`, `projects`, `insight`, `people`, `book` → exact target hostname issued by Render (or VPS `A` record). Verify DNS propagation (`Resolve-DnsName`) and automatic Let's Encrypt TLS before setting the corresponding `NEXT_PUBLIC_*_URL` variable in Vercel.

---

## 5. Consolidated Launch Sequence (When Approved)
1. Merge approved feature PRs into `main`.
2. Provision isolated Neon PostgreSQL databases & least-privilege roles (1 DB per app).
3. Deploy services via Render Blueprint (or Coolify/Docker Compose on VPS) and verify HTTP `200` + `"driver": "postgres"` on every `/api/health` endpoint.
4. Configure GoDaddy DNS records and confirm HTTPS certificates.
5. Run `cd apps/stockflow-mobile && npx eas login && npx eas build -p android --profile preview` and test barcode camera scanning on a physical Android device.
6. Set `NEXT_PUBLIC_*_URL` variables in Vercel Production and trigger a clean redeploy of `https://www.aliarshad.co`.
