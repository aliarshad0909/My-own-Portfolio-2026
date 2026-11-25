# Carton Volumetric & Container Load Planner — Representative Concept Workflow (`container-load-volumetric-planner`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Carton Volumetric & Container Load Planner** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Importers get hit with surprise air-freight dimensional weight charges or under-filled ocean containers during supplier booking.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/container-load-volumetric-planner
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
