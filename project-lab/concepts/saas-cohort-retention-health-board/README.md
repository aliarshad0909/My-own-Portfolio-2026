# B2B SaaS Net Retention & Expansion Board — Representative Concept Workflow (`saas-cohort-retention-health-board`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **B2B SaaS Net Retention & Expansion Board** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Early SaaS teams misread blended growth numbers because expansion revenue hides underlying small-account churn.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/saas-cohort-retention-health-board
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
