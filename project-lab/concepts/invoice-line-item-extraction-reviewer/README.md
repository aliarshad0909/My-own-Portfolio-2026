# Supplier Invoice Extraction & Human Review Queue — Representative Concept Workflow (`invoice-line-item-extraction-reviewer`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Supplier Invoice Extraction & Human Review Queue** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Accounts payable teams manually re-key multi-page vendor invoices, inviting unit-price typos and missed PO discrepancies.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/invoice-line-item-extraction-reviewer
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
