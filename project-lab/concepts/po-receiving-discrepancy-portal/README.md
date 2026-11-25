# Warehouse Purchase-Order Receiving & Variance App — Representative Concept Workflow (`po-receiving-discrepancy-portal`)

> **Honest Scope Disclosure (Sample Scenario):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Warehouse Purchase-Order Receiving & Variance App** sample scenario in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Short-shipped cartons go unnoticed until weeks after receiving because dock clipboards never reconcile back against original PO lines.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/po-receiving-discrepancy-portal
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
