# Ali Arshad Studio — Runnable Project Lab (`project-lab/`)

This directory holds **76 locally runnable, zero-external-dependency Node.js (ESM) vertical slices and workflow prototypes** backing the portfolio's expanded showcase catalog:

- **20 substantive vertical-slice prototypes** (`project-lab/<slug>/` for `p81`–`p100`) across AI evaluation, MCP least-privilege security, AI FinOps, webhook idempotency/replay, secret scanning, PostgreSQL DDL linting, RAG citation verification, ecommerce returns/feeds, Monte Carlo safety stock, supplier compliance, feature flags, OpenAPI diffing, PII redaction, SLA routing, A/B SRM statistics, 3-way invoice matching, WCAG 2.2 token auditing, ffmpeg rendition planning, and GPU VRAM sizing.
- **56 representative workflow prototypes** (`project-lab/concepts/<slug>/` for `p25`–`p80`) giving every Architecture Concept / Sample Scenario in `/work` a real, inspectable local domain state machine and automated test suite — while keeping public pages honestly labeled as **Concept** or **Sample Scenario**.

*(The 14 core portfolio demonstrations and 10 full-stack SaaS prototypes live in `apps/` and `demos/` at the repository root, and the 20 playable browser games live in `ali-arshad-personal-studio/ali-arshad-personal-studio/lib/games/` and `components/games/`.)*

## Prerequisites

- **Node.js 20+** (tested on Node.js 22).
- **Zero extra `npm install` required** — every lab slice uses pure Node.js standard library modules (`node:crypto`, `node:test`, `node:assert/strict`) so the production portfolio app carries zero unused dependencies.

## Quick Start

Run a single prototype and its unit tests:

```bash
cd project-lab/agent-eval-harness
cp .env.example .env   # optional — placeholder variables only
node index.mjs
node --test test.mjs
```

Run **every single prototype test suite across all 76 folders**:

```bash
node project-lab/scripts/test-all.mjs
```

## Security & Synthetic Data Policy

- All demo datasets inside `project-lab/` are 100% synthetic.
- `.env.example` files contain placeholder variable names only — never secrets, API keys, or real customer records.
- Teardown: no background servers, containers, or persistent external state are created; deleting any local `.env` restores a clean tree.
