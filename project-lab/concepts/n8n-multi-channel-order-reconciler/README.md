# Multi-Channel Ecommerce Payout Reconciliation Flow — Representative Concept Workflow (`n8n-multi-channel-order-reconciler`)

> **Honest Scope Disclosure (Sample Scenario):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Multi-Channel Ecommerce Payout Reconciliation Flow** sample scenario in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Bookkeepers burn full Fridays manually reconciling net bank payouts against gross storefront sales, shipping labels, and refund fees.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/n8n-multi-channel-order-reconciler
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
