# Orexa — AI Learning Operating System (Interactive Demo)

A self-contained, full-stack **Interactive AI Learning Operating System Demonstration** built for **Ali Arshad Personal Studio** using Next.js 16, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, and PostgreSQL (Neon/Render PostgreSQL in production; persisted PGlite locally).

> **Scope Note:** This application is an interactive learning OS demonstration with deterministic curriculum-grounded AI tutoring and lesson outline generation (requiring zero paid API keys). It is intentionally self-contained and distinct from full enterprise Orexa deployments.

## Core Capabilities

1. **Student Dashboard (`/`)** — Active courses with real PostgreSQL completion bars, overall completion %, adaptive readiness level, personalized recommendations computed from assessment attempts, recent quiz scores, and one-click Quick Resume Lesson.
2. **Courses, Modules & Interactive Lessons (`/courses`)** — Course catalog filtering, expandable syllabus modules, interactive Markdown lesson reader with Key Takeaways, PostgreSQL-persisted lesson completion toggles, and Study Resources (`guide`, `cheatsheet`, `exercise`, `video_notes`).
3. **Adaptive Quizzes & Assessments (`/assessments`)** — Interactive quiz runner with server-side grading, persisted `assessment_attempts`, per-question explanations, and dynamic difficulty recommendations (`< 60%` review foundation · `60–84%` intermediate practice · `≥ 85%` unlock advanced challenge).
4. **Curriculum-Grounded AI Tutor (`/tutor`)** — Deterministic retrieval and synthesis engine grounded directly in each course's PostgreSQL lessons, takeaways, and resources, with persisted `tutor_messages` history and an optional server-side LLM hook (`OREXA_LLM_API_KEY`).
5. **Instructor & Admin Studio (`/studio`)** — Course, module, lesson, and study resource CRUD, a Deterministic AI-Assisted Lesson Outline Generator with inline human review before publishing, and an Admin Learning Analytics dashboard across courses and learners.

## Demo Credentials

- **Email:** `learner@orexa.studio`
- **Password:** `OrexaDemo2026!`
- One-click **Enter Demo Workspace** button is available on `/login`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3060`. When `DATABASE_URL` and `OREXA_DATABASE_URL` are empty locally, Orexa automatically initializes and seeds a persisted PGlite PostgreSQL database under `./data/pgdata`.

## Verification Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Security & Deployment

- `scrypt` per-user salted password hashing + HMAC-SHA256 hashed session tokens in `httpOnly` cookies
- Locked unguessable passwords (`generateLockedPassword()`) for seeded non-interactive cohort fixtures
- Enforced `SESSION_SECRET` (≥ 32 chars) and required external PostgreSQL (`OREXA_DATABASE_URL` or `DATABASE_URL`) when `RENDER=true`
- CSRF origin validation (`verifyCsrfOrigin`) on state-changing routes + HTTP security headers in `next.config.ts`
- Sliding-window rate limiting, `ALLOW_DEMO_RESET` toggle, and 15-second global cooldown on `POST /api/demo/reset`
- Ready for Render via `render.yaml` (`start: "next start"`).
