# FX-Sensitive Landed Cost & Wholesale Margin Modeler — Representative Concept Workflow (`multi-currency-landed-margin-simulator`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **FX-Sensitive Landed Cost & Wholesale Margin Modeler** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

A 6% currency move or tariff adjustment can wipe out wholesale profitability across an entire seasonal product catalog overnight.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/multi-currency-landed-margin-simulator
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
