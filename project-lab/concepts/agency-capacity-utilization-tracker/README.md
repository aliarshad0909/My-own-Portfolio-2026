# Studio & Agency Billable Capacity Forecaster — Representative Concept Workflow (`agency-capacity-utilization-tracker`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Studio & Agency Billable Capacity Forecaster** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Service founders over-commit sprint capacity or wait too late to line up specialist contractors because bookings live in static spreadsheets.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/agency-capacity-utilization-tracker
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
