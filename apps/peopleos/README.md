# PeopleOS — Human Resource Management SaaS

**Product 11 · Original Studio Demonstration by Ali Arshad Personal Studio**

PeopleOS is a full-stack Human Resource Management (HRM) SaaS workspace built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Drizzle ORM**, and **PostgreSQL** (with zero-config persisted PGlite fallback locally).

> **Compliance & Fictional Data Notice:** PeopleOS is an HR operations demonstration populated exclusively with **100% fictional employee records**. It is **not** a legally compliant statutory payroll, benefits administration, or tax filing system.

---

## Core Capabilities

1. **HR Operations Dashboard (`/`)** — Active headcount, departments, pending leave approvals, open candidates, onboarding completion %, department headcount vs. target breakdown, attendance/remote/leave utilization analytics, and quick pending leave approval queue.
2. **Employee Directory, Profiles & Org Chart (`/directory`)** — Searchable directory with department & status filters, Add Employee CRUD, Department Management, visual recursive **Organizational Structure** tree (`Manager → Direct Reports`), and RBAC-governed Employee Profile drawer with linked compliance documents.
3. **Attendance & Leave Management (`/leave`)** — Leave request submission and **atomic PostgreSQL manager approval workflow**: inside ONE database transaction, approving a pending request updates `leave_requests.status`, validates & deducts `employees.leave_balance_days`, and upserts `"on_leave"` entries in `attendance_logs`. Rejecting leaves balances untouched. Includes daily attendance check-in & logbook.
4. **Recruitment & Onboarding (`/recruitment`)** — Multi-stage hiring pipeline (`applied` → `screening` → `interview` → `offer` → `hired` / `archived`) with Add Candidate & stage advancement, plus per-new-hire Onboarding Checklists with live completion toggles.
5. **Performance Reviews & Compliance Documents (`/reviews`)** — Review cycle CRUD with ratings and next-cycle goals, plus Employee Document Compliance Checklist (`offer_letter`, `policy_ack`, `nda`, `id_verified`) with verification toggles.

---

## RBAC & Privacy Architecture

PeopleOS includes a live **Role View Switcher** in the header backed by real server-side sessions (`demo`, `admin`, `manager`, `employee`):

- **`demo` / `admin`**: Full HR access including private fields (`compensation_band_private`, `emergency_contact_private`, `hr_notes_private`), directory CRUD, and demo reset.
- **`manager`**: Full access to own profile + direct reports' private fields, leave approvals, recruitment, and reviews; peer private fields outside reporting chain are server-redacted.
- **`employee`**: Strictly redacts `compensation_band_private`, `emergency_contact_private`, and `hr_notes_private` (`null`, `privateFieldsRedacted: true`) on every peer employee record in API responses, while preserving access to the employee's own profile. Leave approval routes return `403`.

---

## Demo Access

- **Email:** `hr@peopleos.studio`
- **Password:** `PeopleDemo2026!`
- One-click **Open Demo Workspace** button on `/login` and rate-limited **Reset Demo Data** action (`ALLOW_DEMO_RESET`, 15-second global cooldown).

---

## Local Development & Verification

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run start:local
```

Leave `DATABASE_URL` / `PEOPLEOS_DATABASE_URL` empty locally to persist PostgreSQL data via embedded PGlite in `./data/pgdata`. Set `PEOPLEOS_DATABASE_URL` or `DATABASE_URL` + a 32+ character `SESSION_SECRET` for managed PostgreSQL production deployments (see `render.yaml` and `.env.example`).
