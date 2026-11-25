# Small-Batch Product Drop & Cart Reservation Flow — Representative Concept Workflow (`limited-drop-queue-inventory-storefront`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Small-Batch Product Drop & Cart Reservation Flow** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Small-batch apparel and craft makers face double-sold units and angry refund emails during high-traffic release minutes.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/limited-drop-queue-inventory-storefront
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
