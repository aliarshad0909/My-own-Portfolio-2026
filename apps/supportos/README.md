# SupportOS — Customer Support & Help Desk SaaS

**SupportOS** is a clean-room MIT/Apache-2.0 TypeScript Customer Support & Help Desk SaaS built with Next.js 16, React 19, Tailwind CSS v4, Drizzle ORM, and PostgreSQL (with automatic local persisted PGlite fallback).

## Visual Identity
- **Sidebar:** Deep Indigo (`#1e1b4b`)
- **Primary Actions:** Crisp Blue (`#2563eb`)
- **Canvas:** Clean Support Inbox surface (`#f8fafc`)

## Core Workspaces & Capabilities
1. **Support Dashboard (`/`)**
   - Live KPIs: Open Tickets, SLA At-Risk / Breached, Avg First Response, Resolved Tickets, and Published KB Articles
   - Priority & Category distributions
   - Agent Performance Analytics table
   - Quick Workspace Mode Switcher (`Agent Inbox`, `Customer Portal`, `Admin SLA & Analytics`)
2. **Shared Inbox & Ticket Workspace (`/inbox`)**
   - Split-pane ticket queue with live search, status/priority/category filters, and SLA countdown/breach badges
   - Full conversation stream clearly distinguishing Public Customer Replies from Internal Agent Notes
   - 1-click **Insert Canned Response** macro popover
   - **Generate AI Draft Suggestion** grounded in ticket category & Knowledge Base articles — strictly populates an editable composer draft and **never auto-sends**
   - Inline ticket assignment, priority/category updates, status transitions (`open` → `in_progress` → `waiting_customer` → `resolved` → `closed`), and Create Ticket modal
3. **Customer Portal Workspace (`/portal`)**
   - Dedicated customer-facing ticket submission form (auto-categorized + SLA due calculated → immediately appears in Agent Inbox)
   - Customer Ticket Tracker (public replies only; internal agent notes are filtered out)
   - Self-service Knowledge Base search
4. **Customer Directory & Canned Responses (`/customers`)**
   - Full Customer CRUD directory displaying live open and resolved ticket counts per customer
   - Canned Responses library CRUD with `/shortcut` macros
5. **Knowledge Base & Admin SLA Analytics (`/kb`)**
   - Searchable Knowledge Base articles CRUD with publish/draft toggles & view counts
   - Admin SLA Policy thresholds (`Urgent: 1h`, `High: 4h`, `Medium: 12h`, `Low: 24h`) and Agent SLA attainment breakdown

## Security & Hardening
- `scrypt` password hashing with per-user random salt and `crypto.timingSafeEqual`
- `generateLockedPassword()` for non-interactive seeded team fixtures
- `resolveSessionSecret()` enforcing `>= 32` characters in production
- HttpOnly, SameSite=Lax HMAC-SHA256 hashed sessions stored in PostgreSQL
- `verifyCsrfOrigin()` protection on cookie-authenticated mutations
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS`) in `next.config.ts`
- Rate limiting + `ALLOW_DEMO_RESET` + 15s global cooldown on `/api/demo/reset`
- Dual database driver: `SUPPORTOS_DATABASE_URL || DATABASE_URL` (strict TLS + `RENDER=true` guard) + local persisted PGlite

## Demo Account
- **Email:** `agent@supportos.studio`
- **Password:** `SupportDemo2026!`
- One-click **Enter Demo Workspace** button on `/login`

## Local Development & Verification
```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run dev # http://localhost:3070
```
