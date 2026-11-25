# Subscription Renewal & Failed-Payment Recovery Flow — Representative Concept Workflow (`n8n-stripe-renewal-slack-alerts`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Subscription Renewal & Failed-Payment Recovery Flow** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Involuntary churn quietly drains SaaS revenue when failed-card webhooks go unnoticed by customer success teams.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/n8n-stripe-renewal-slack-alerts
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
