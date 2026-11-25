# Production Line Downtime & Scrap Rate Board — Representative Concept Workflow (`manufacturing-oee-scrap-console`)

> **Honest Scope Disclosure (Sample Scenario):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Production Line Downtime & Scrap Rate Board** sample scenario in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Plant supervisors tally shift downtime on whiteboards, making recurring machine faults invisible across weeks.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/manufacturing-oee-scrap-console
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
