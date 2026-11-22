# ProjectOS — Project Management & Team Collaboration SaaS

Clean-room studio delivery workspace built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, and PostgreSQL (dual driver: managed PostgreSQL via `pg` + local persisted embedded PostgreSQL via `@electric-sql/pglite`).

## Visual Identity
- **Charcoal (`#18181b`)** navigation rail with **Violet (`#8b5cf6` / `#7c3aed`)** active highlights over a clean `#f8f8fb` delivery canvas.

## Core Modules
1. **Project Dashboard (`/`)** — Live KPIs (Active Projects, Tasks Completed %, Logged Hours vs Budget, Milestones Complete, Blocked Dependencies), per-project progress & burn analytics chart, upcoming milestones, and activity history feed.
2. **Projects & Milestones (`/projects`)** — Create projects, assign team members, manage milestones with 1-click completion, project timeline visualization, and live printable + downloadable CSV project reports derived directly from PostgreSQL.
3. **Interactive Kanban Board (`/board`)** — Project-scoped HTML5 drag-and-drop Kanban board (`Backlog` → `To Do` → `In Progress` → `In Review` → `Done`) plus accessible move buttons, task dependency blocker badges, attachment metadata, and slide-over task detail drawer with live comments.
4. **Time Tracking & Team (`/time`)** — Log billable and non-billable time entries against projects/tasks, team capacity and utilization table, and billable rollups.
5. **Client-Facing Project View (`/client-view`)** — Read-only sanitized client portal presenting project health, milestone completion progress, deliverables checklist, and hours utilized while hiding internal comments and admin controls.

## Demo Access
- **Email:** `pm@projectos.studio`
- **Password:** `ProjectDemo2026!`
- One-click **Enter Demo Workspace** button on `/login`.

## Local Development
```bash
npm install
npm run dev
```

## Verification
```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## OSS Compliance
Clean-room MIT/Apache-2.0 TypeScript implementation. Contains zero AGPL/GPL third-party source code.
