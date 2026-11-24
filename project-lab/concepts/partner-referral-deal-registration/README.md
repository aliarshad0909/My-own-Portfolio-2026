# Channel Partner Deal Registration & Commission Desk — Representative Concept Workflow (`partner-referral-deal-registration`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Channel Partner Deal Registration & Commission Desk** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Growing B2B software companies lose channel trust when partner-sourced deals collide with direct sales reps in spreadsheets.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/partner-referral-deal-registration
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
