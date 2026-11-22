# FlowOS — AI Workflow Automation Platform

FlowOS is an AI workflow automation platform built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, React Flow (`@xyflow/react`), and Drizzle ORM over PostgreSQL / persisted PGlite.

## Key Capabilities

1. **Automation Dashboard (`/`)** — Live KPIs (Active Workflows, Total Runs, Success Rate, Pending Human Approvals), 7-day execution volume chart, one-click Human Approval Queue, and recent execution traces.
2. **Interactive Visual Workflow Editor (`/editor` & `/editor/[id]`)** — Genuine `@xyflow/react` drag-and-drop node graph supporting all 8 node types:
   - `trigger`, `schedule`, `webhook`
   - `condition` (real dot-path deterministic evaluator with `true` / `false` branch handles)
   - `transform` (field mappings + `{{template}}` interpolation)
   - `ai_process` (zero-key deterministic scoring, triage & drafting; optional server-side LLM only if `OPENAI_API_KEY` is configured)
   - `human_approval` (**Mandatory Safety Gate** — pauses execution in `awaiting_approval` until an authorized operator clicks **Approve & Resume** or **Reject**)
   - `http_request` (sandboxed dry-run HTTP/webhook dispatch with SSRF protection)
3. **Execution History & Approvals (`/runs`)** — Trigger workflows with custom JSON payloads, inspect per-step inputs/outputs/durations, Approve/Reject paused runs, and Retry failed runs.
4. **Workflow Templates (`/templates`)** — 4 cloneable production blueprints:
   - Inbound Lead Qualification & Approval
   - Low-Stock Reorder Alert
   - Support Ticket AI Draft Triage
   - Overdue Invoice Escalation
5. **Integrations & Analytics (`/integrations`)** — Safe Webhook URL tester with SSRF filtering, optional n8n webhook bridge configuration, deterministic AI mode indicator, and per-workflow execution analytics.

## Local Development

```bash
cd apps/flowos
npm install
npm run dev
```

Open `http://localhost:3040` and sign in with the instant **Enter Demo Workspace** button or demo credentials:
- **Email:** `ops@flowos.studio`
- **Password:** `FlowDemo2026!`

## Verification Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

## Production Deployment (Render)

Configured via [`render.yaml`](./render.yaml):
- `startCommand: npx next start -H 0.0.0.0 -p $PORT`
- `healthCheckPath: /api/health`
- Set `FLOWOS_DATABASE_URL` (PostgreSQL) and `SESSION_SECRET` (>= 32 chars).
