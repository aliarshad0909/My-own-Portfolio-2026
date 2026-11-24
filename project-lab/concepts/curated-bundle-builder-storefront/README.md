# Dynamic Kit & Multi-SKU Bundle Builder — Representative Concept Workflow (`curated-bundle-builder-storefront`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Dynamic Kit & Multi-SKU Bundle Builder** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Naive ecommerce bundles break warehouse fulfillment when individual component SKUs sell out independently.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/curated-bundle-builder-storefront
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
