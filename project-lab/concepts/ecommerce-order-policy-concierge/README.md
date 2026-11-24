# Storefront Returns & Order-Status Concierge — Representative Concept Workflow (`ecommerce-order-policy-concierge`)

> **Honest Scope Disclosure (Sample Scenario):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Storefront Returns & Order-Status Concierge** sample scenario in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

DTC support queues fill up with 'where is my order' and return-window inquiries during seasonal launches.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/ecommerce-order-policy-concierge
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
