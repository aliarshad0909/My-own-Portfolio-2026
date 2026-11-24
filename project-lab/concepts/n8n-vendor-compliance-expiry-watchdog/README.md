# Supplier Certificate & Insurance Expiry Watchdog — Representative Concept Workflow (`n8n-vendor-compliance-expiry-watchdog`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Supplier Certificate & Insurance Expiry Watchdog** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Procurement teams discover expired vendor insurance or factory audit certificates only after a shipment is already scheduled.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/n8n-vendor-compliance-expiry-watchdog
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
