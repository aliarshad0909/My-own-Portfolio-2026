# Made-to-Order Product & Dimension Configurator — Representative Concept Workflow (`custom-furniture-finish-configurator`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Made-to-Order Product & Dimension Configurator** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Custom makers field endless email quote requests because off-the-shelf carts cannot price continuous dimensions and finish combinations.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/custom-furniture-finish-configurator
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
