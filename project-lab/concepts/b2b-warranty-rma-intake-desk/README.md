# Hardware Warranty & RMA Claims Portal — Representative Concept Workflow (`b2b-warranty-rma-intake-desk`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Hardware Warranty & RMA Claims Portal** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Hardware makers field incomplete warranty emails missing serial numbers, purchase dates, and defect photos.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/b2b-warranty-rma-intake-desk
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
