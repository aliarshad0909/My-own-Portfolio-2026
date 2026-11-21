# BookOS — Appointment Booking & Scheduling SaaS

Clean-room TypeScript / Next.js 16 appointment booking and scheduling SaaS built as an Original Studio Demonstration for Ali Arshad Personal Studio.

## Highlights

- **Minimal Ivory & Architectural Blue Aesthetic:** Serene `#fafaf9` / `#f5f5f4` canvas, crisp `#2563eb` / `#1d4ed8` actions, and clean `#1c1917` charcoal typography with a light top-bar workspace layout.
- **PostgreSQL-Backed Dual Driver:** Runs on PostgreSQL (`BOOKOS_DATABASE_URL || DATABASE_URL`) in production with strict TLS (`RENDER=true` guard) and embedded persisted PGlite locally with native `gen_random_uuid()` (no `pgcrypto` extension required).
- **Atomic Double-Booking Prevention:** Every booking creation and reschedule executes inside a PostgreSQL transaction locking the specialist record (`SELECT ... FOR UPDATE`), verifying zero intersecting active intervals (`existing.start_utc < newEndUtc AND existing.end_utc > newStartUtc`), backed by a partial unique index `bookings_staff_start_active_uidx ON bookings (staff_id, start_utc) WHERE status <> 'cancelled'`. Conflicting attempts are rejected with HTTP `409 Conflict`.
- **Multi-Timezone Scheduling Engine:** Live slot computation and instant conversion across `America/New_York`, `America/Chicago`, `Europe/London`, `Asia/Dubai`, `Asia/Karachi`, and `UTC`.
- **Sandbox Payment Simulation Only:** Zero real card inputs or PCI data collection — simulate instant `sandbox_paid` receipts (`SBX-RCPT-*`) and automatic `refunded` transitions on cancellation.
- **5 Full-Stack Modules:**
  - `/` — Booking Dashboard (KPIs, Timezone switcher, Upcoming Schedule, Service & Staff analytics)
  - `/book` — 4-Step Live Customer Booking Interface with real-time slot availability
  - `/calendar` — Schedule Management, Reschedule Modal, Cancellation & Automated Reminders Queue
  - `/catalog` — Service Catalogue CRUD, Staff Specialists CRUD, Weekly Availability Rules Editor
  - `/customers` — Customer Directory with Full Past & Upcoming Booking History

## Demo Credentials

- **Email:** `admin@bookos.studio`
- **Password:** `BookDemo2026!`
- One-click **Enter Demo Workspace** button available on `/login`.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3110](http://localhost:3110).

## Verification Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```
