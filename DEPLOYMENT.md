# Deployment Architecture & Zero-Cost Commercial Hosting Runbook

This runbook documents the verified **$0/month commercial-compatible** deployment architecture for **PipelineOS CRM** (`apps/pipelineos`), **StockFlow Inventory SaaS** (`apps/stockflow`), **StockFlow Mobile** (`apps/stockflow-mobile`), and their integration with the main portfolio at **https://www.aliarshad.co**.

> **Approval & Cost Guardrail:** No paid plans have been purchased, no external hosting accounts have been provisioned, and no production GoDaddy DNS records have been modified. All infrastructure blueprints (`render.yaml`, `.env.example`, `eas.json`) are ready to deploy upon owner approval.

---

## 1. Domain & DNS Architecture (GoDaddy)

Current verified DNS for `aliarshad.co` (authoritative nameservers: `ns19.domaincontrol.com`, `ns20.domaincontrol.com`):
- `@` (`A`) → `216.198.79.1` *(keep untouched — portfolio apex)*
- `www` (`CNAME`) → `f46a51bc3d6609b9.vercel-dns-017.com` *(keep untouched — portfolio)*

### New Subdomains to Add Upon Hosting Provisioning
| Subdomain | Record Type | Target Value | Product |
| --- | --- | --- | --- |
| `crm` (`crm.aliarshad.co`) | `CNAME` | `<pipelineos-service>.onrender.com` | PipelineOS CRM |
| `stock` (`stock.aliarshad.co`) | `CNAME` | `<stockflow-service>.onrender.com` | StockFlow Web + `/api/v1/*` Mobile Backend |

TLS/HTTPS certificates are issued automatically via Let's Encrypt once each Render Custom Domain verifies its CNAME record.

---

## 2. Hosting & Database Selection ($0/mo Commercial-Compatible)

| Component | Recommended Provider | Plan Cost | Commercial Use Permitted? | Notes & Free-Tier Limits |
| --- | --- | --- | --- | --- |
| **PostgreSQL Databases** (2 separate DBs) | **Neon Free** | $0/mo | Yes | 0.5–1 GB storage per project, does **not** expire after 30 days (avoid Render Free Postgres which expires after 30 days). |
| **PipelineOS Web & API** | **Render Free Web Service** | $0/mo | Yes | 512 MB RAM, 0.1 CPU, spins down after 15 min idle (~30–50s cold start), custom domain + TLS included. |
| **StockFlow Web & `/api/v1` API** | **Render Free Web Service** | $0/mo | Yes | 512 MB RAM, 0.1 CPU, serves both StockFlow web UI and StockFlow Mobile Bearer API. |
| **StockFlow Mobile Builds** | **Expo Go + EAS Free** | $0/mo | Yes | 30 free cloud builds/month on Expo EAS for installable Android `.apk` previews (`eas build -p android --profile preview`). |

> **Why not Vercel Hobby for PipelineOS / StockFlow?** Vercel's Hobby tier prohibits commercial / agency showcase deployments. Hosting the two standalone SaaS apps on Render Free + Neon Free stays strictly compliant at $0/month.

---

## 3. Step-by-Step Provisioning Checklist

### Step A — Provision Neon PostgreSQL Databases
1. Create two separate databases in Neon Free: `pipelineos` and `stockflow`.
2. Copy each pooled `postgresql://...` connection string (with `?sslmode=require`).

### Step B — Deploy PipelineOS (`crm.aliarshad.co`)
1. Connect repository `aliarshad0909/My-own-Portfolio-2026` in Render using Blueprint `apps/pipelineos/render.yaml` (root directory: `apps/pipelineos`).
2. Set environment variables:
   - `DATABASE_URL=<neon-pipelineos-connection-string>`
   - `NEXT_PUBLIC_APP_URL=https://crm.aliarshad.co`
   - `NODE_ENV=production`
3. Render builds with `npm ci && npm run build` and starts `npm run start -- -p $PORT`.
4. Database tables and demo seed records initialize automatically on first request (or manually via `npm run db:seed`).
5. Add Custom Domain `crm.aliarshad.co` in Render and add the GoDaddy `CNAME` record.

### Step C — Deploy StockFlow (`stock.aliarshad.co`)
1. Connect repository in Render using Blueprint `apps/stockflow/render.yaml` (root directory: `apps/stockflow`).
2. Set environment variables:
   - `STOCKFLOW_DATABASE_URL=<neon-stockflow-connection-string>` (or `DATABASE_URL`)
   - `NEXT_PUBLIC_APP_URL=https://stock.aliarshad.co`
   - `NODE_ENV=production`
3. Verify `https://stock.aliarshad.co/api/v1/health` returns `{"ok":true,"service":"stockflow-inventory",...}`.
4. Add Custom Domain `stock.aliarshad.co` in Render and add the GoDaddy `CNAME` record.

### Step D — Activate Live Demo Links on the Portfolio (`www.aliarshad.co`)
Once both subdomains are live and verified over HTTPS, add these two environment variables to the portfolio deployment and redeploy:
```bash
NEXT_PUBLIC_PIPELINEOS_URL=https://crm.aliarshad.co
NEXT_PUBLIC_STOCKFLOW_URL=https://stock.aliarshad.co
```
Setting these environment variables automatically switches the portfolio's **Live Product Demonstrations** buttons from internal case-study demo anchors to live external **Launch Live Demo** links — guaranteeing zero broken links prior to deployment.

### Step E — Build StockFlow Mobile Android Preview APK
```bash
cd apps/stockflow-mobile
npm install
npx eas login
npx eas build --platform android --profile preview
```
`eas.json` pre-configures `EXPO_PUBLIC_API_URL=https://stock.aliarshad.co` for preview/production builds.

