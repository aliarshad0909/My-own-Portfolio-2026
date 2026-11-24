# Client Onboarding & Document Collection Portal — Representative Concept Workflow (`client-onboarding-portal-concept`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Client Onboarding & Document Collection Portal** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Consultancies and agencies stall for weeks chasing questionnaires, brand files, and contract sign-offs across scattered inbox threads.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/client-onboarding-portal-concept
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
