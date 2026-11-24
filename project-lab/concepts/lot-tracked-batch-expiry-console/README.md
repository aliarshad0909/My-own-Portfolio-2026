# Lot-Tracked Batch & Shelf-Life Expiry Ledger — Representative Concept Workflow (`lot-tracked-batch-expiry-console`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Lot-Tracked Batch & Shelf-Life Expiry Ledger** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Standard SKU-only inventory systems cannot enforce FEFO picking or isolate recalled supplier batches quickly.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/lot-tracked-batch-expiry-console
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
