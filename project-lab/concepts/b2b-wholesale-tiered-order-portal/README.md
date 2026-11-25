# B2B Wholesale Tiered Pricing & Quick-Order Portal — Representative Concept Workflow (`b2b-wholesale-tiered-order-portal`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **B2B Wholesale Tiered Pricing & Quick-Order Portal** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Wholesale buyers hate clicking through consumer product grids when they just want to reorder 25 SKUs by case pack on Net-30 terms.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/b2b-wholesale-tiered-order-portal
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
