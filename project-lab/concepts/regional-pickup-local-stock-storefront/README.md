# Multi-Store Inventory Visibility & Local Pickup Flow — Representative Concept Workflow (`regional-pickup-local-stock-storefront`)

> **Honest Scope Disclosure (Sample Scenario):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Multi-Store Inventory Visibility & Local Pickup Flow** sample scenario in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Shoppers drive to a store only to find an item out of stock because the website only tracks central warehouse totals.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/regional-pickup-local-stock-storefront
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
